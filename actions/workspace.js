import * as WORKSPACE from '../constants/workspace'

import { Record, Map } from 'immutable'
import { join } from 'path'
import { throttle } from 'lodash'
import { loadProfile, saveFileAs } from '../lib/fileHandler'
import worker from '../lib/worker'
import textureManipulator from '../lib/textureManipulator'

const textureWorker = worker('textures')
let idCounter = 0

const WorkspaceRecord = Record({
  id: null,
  data: null,
  path: null,
  name: 'New Workspace',
  key: null,
  items: null,
  selectedDirectory: null,
  selectedTexture: null
})

const DirectoryRecord = Record({
  id: null,
  parentId: null,
  name: 'New Directory',
  address: 0,
  length: 0,
  type: 'directory'
})

const TextureRecord = Record({
  id: null,
  parentId: null,
  name: 'New Texture',
  address: 0,
  format: 'rgba32',
  width: 32,
  height: 32,
  palette: 0,
  type: 'texture',
  blob: null
})

function asyncThrottle (func, cbArg, timeout) {
  let running = false
  let queued = null
  let queueFunc = (...args) => {
    if (running) {
      queued = args
      return
    }
    running = true
    let cb = args[cbArg]
    args[cbArg] = (...argss) => {
      cb(...argss)
      if (queued) {
        setTimeout(() => {
          let args = queued
          queued = null
          running = false
          queueFunc(...args)
        }, timeout)
      } else {
        running = false
      }
    }
    func(...args)
  }
  if (timeout > 0) {
    return throttle(queueFunc, timeout)
  } else {
    return queueFunc
  }
}

function itemFormatPlural (format) {
  if (format.toLowerCase() === 'texture') {
    return 'textures'
  } else if (format.toLowerCase() === 'directory') {
    return 'directories'
  }
  return ''
}

function prepareProfile (profile, length) {
  const types = ['directory', 'texture']
  const _innerLoop = (input, items, parent) => {
    for (let type of types) {
      if (input[itemFormatPlural(type)]) {
        input[itemFormatPlural(type)].forEach((i, index) => {
          let item
          const id = (idCounter++).toString(36)
          if (type === 'directory') {
            item = new DirectoryRecord({
              id,
              parentId: parent,
              name: i.name,
              address: parseInt(i.address, 16),
              length: parseInt(i.size, 16)
            })
            items = _innerLoop(i, items, id)
          } else {
            item = new TextureRecord({
              id,
              parentId: parent,
              name: i.name,
              address: parseInt(i.address, 16),
              format: i.format,
              width: parseInt(i.width),
              height: parseInt(i.height),
              palette: parseInt(i.palette, 16) || 0
            })
          }

          items = items.set(id, item)
        })
      }
    }
    return items
  }
  const id = 'root'
  const rootItem = new DirectoryRecord({
    id,
    name: 'Root',
    address: 0,
    absolute: 0,
    length: length
  })
  let items = Map()
  items = items.set(id, rootItem)
  if (profile) {
    items = _innerLoop(profile, items, id)
  }
  return items
}

function itemHasValidData (item) {
  if (item.get('type') === 'texture') {
    if (Number.isInteger(item.get('address')) &&
      Number.isInteger(item.get('width')) &&
      Number.isInteger(item.get('height')) &&
      textureManipulator.getFormat(item.get('format')).isValid()) {
      return true
    }
  }
  return false
}

function getItemBuffer (item, workspace) {
  let start = item.get('address')
  let end = start + item.get('width') * item.get('height') * textureManipulator.getFormat(item.get('format')).sizeModifier()
  return workspace.get('data').slice(start, end)
}

function getItemPaletteBuffer (item, workspace) {
  return workspace.get('data').slice(
    item.get('palette'),
    item.get('palette') + 0x200
  )
}

function generateItemBlob (item, workspace, callback, forced) {
  if (!forced && item.get('blob')) {
    callback(null)
    return
  }

  if (item.get('type') !== 'texture' || !itemHasValidData(item)) {
    callback(null)
    return
  }

  let palette
  const textureFormat = textureManipulator.getFormat(item.get('format'))
  if (textureFormat.hasPalette()) {
    palette = Array.from(getItemPaletteBuffer(item, workspace))
  }
  const data = Array.from(getItemBuffer(item, workspace)) // Web workers are slow with typed data, so we turn it into regular arrays
  textureWorker.send({
    type: 'generatePNGBuffer',
    data: data,
    format: textureFormat.toString(),
    width: item.get('width'),
    palette: palette
  }, function (out) {
    if (out.buffer) {
      // TODO: Figure out how to deal with the differing buffer format that is output for browser & desktop better
      let buffer = out.buffer
      if (buffer.type === 'Buffer') {
        buffer = Buffer.from(out.buffer.data)
      }
      callback(new Blob([buffer], {type: 'image/png'}))
    } else {
      callback(null)
    }
  })
}

export function setCurrentDirectory (item) {
  return async (dispatch, getState) => {
    dispatch({
      type: WORKSPACE.SET_CURRENT_DIRECTORY,
      item
    })

    let workspaceState = getState().workspace
    let directoryId = item.get('id')
    let currentWorkspace = workspaceState.getIn(['workspaces', workspaceState.get('currentWorkspace')])
    const childTextures = workspaceState.getIn(['workspaces', workspaceState.get('currentWorkspace'), 'items']).filter((i) => {
      return i.type === 'texture' && i.parentId === directoryId
    })

    childTextures.forEach((texture) => {
      generateItemBlob(texture, currentWorkspace, (blob) => {
        if (blob) {
          dispatch({
            type: WORKSPACE.UPDATE_ITEM_BLOB,
            workspace: currentWorkspace.get('id'),
            item: texture.get('id'),
            blob: blob
          })
        }
      })
    })
  }
}

export function setCurrentTexture (item) {
  return {
    type: WORKSPACE.SET_CURRENT_TEXTURE,
    item
  }
}

export function setCurrentWorkspace (workspace) {
  return {
    type: WORKSPACE.SET_CURRENT_WORKSPACE,
    workspace
  }
}

const throttledGenerateItemBlob = asyncThrottle(generateItemBlob, 2, 100)
export function setItemData (workspace, item, key, value) {
  return async (dispatch, getState) => {
    if (key === 'offset') {
      key = 'address'
      let items = getState().workspace.getIn(['workspaces', workspace, 'items'])
      let parentId = items.getIn([item, 'parentId'])
      value += items.getIn([parentId, 'address'])
    }

    dispatch({
      type: WORKSPACE.SET_ITEM_DATA,
      workspace,
      item,
      key,
      value
    })

    let currentWorkspace = getState().workspace.getIn(['workspaces', workspace])
    let texture = currentWorkspace.getIn(['items', item])
    if (texture.get('type') === 'texture') {
      if (
        key === 'address' ||
        key === 'format' ||
        key === 'width' ||
        key === 'height' ||
        key === 'palette'
      ) {
        throttledGenerateItemBlob(texture, currentWorkspace, (blob) => {
          dispatch({
            type: WORKSPACE.UPDATE_ITEM_BLOB,
            workspace: workspace,
            item: item,
            blob: blob
          })
        }, true)
      }
    }
  }
}

export function createWorkspace (input) {
  return async (dispatch, getState) => {
    const data = input.data
    const filePath = input.path
    const name = input.name
    const key = data.toString('utf8', 0x3B, 0x3F) + data.readUInt8(0x3F)
    const id = (idCounter++).toString(36)

    let workspace = new WorkspaceRecord({
      id,
      data,
      path: filePath,
      name,
      key,
      items: null,
      selectedDirectory: null,
      selectedTexture: null
    })

    dispatch({
      type: WORKSPACE.ADD_WORKSPACE,
      workspace: workspace
    })

    dispatch({
      type: WORKSPACE.SET_CURRENT_WORKSPACE,
      workspace: workspace
    })

    loadProfile(join(__dirname, '../profiles/' + key + '/default/fileList.json'), (profile) => {
      const items = prepareProfile(profile, data.length)
      dispatch({
        type: WORKSPACE.ADD_WORKSPACE,
        workspace: workspace.merge({
          items: items,
          selectedDirectory: 'root'
        })
      })
    })
  }
}

export function createDirectory () {
  return async (dispatch, getState) => {
    let state = getState().workspace
    let workspace = state.get('currentWorkspace')
    let currentWorkspace = state.getIn(['workspaces', workspace])
    if (!currentWorkspace) {
      return
    }

    let selectedDirectory = currentWorkspace.getIn(['items', currentWorkspace.get('selectedDirectory')])
    if (!selectedDirectory) {
      return
    }

    let id = (idCounter++).toString(36)
    let item = new DirectoryRecord({
      id,
      parentId: selectedDirectory.get('id'),
      address: selectedDirectory.get('address')
    })

    dispatch({
      type: WORKSPACE.ADD_ITEM,
      workspace,
      item
    })
  }
}

export function createTexture () {
  return async (dispatch, getState) => {
    let state = getState().workspace
    let workspace = state.get('currentWorkspace')
    let currentWorkspace = state.getIn(['workspaces', workspace])
    if (!currentWorkspace) {
      return
    }

    let selectedDirectory = currentWorkspace.getIn(['items', currentWorkspace.get('selectedDirectory')])
    if (!selectedDirectory) {
      return
    }

    let id = (idCounter++).toString(36)
    let item = new TextureRecord({
      id,
      parentId: selectedDirectory.get('id'),
      address: selectedDirectory.get('address'),
      width: 32,
      height: 32,
      palette: 0
    })

    dispatch({
      type: WORKSPACE.ADD_ITEM,
      workspace,
      item
    })

    generateItemBlob(item, currentWorkspace, (blob) => {
      dispatch({
        type: WORKSPACE.UPDATE_ITEM_BLOB,
        workspace: workspace,
        item: item.get('id'),
        blob: blob
      })
    }, true)
  }
}

export function insertData (data, start) {
  return async (dispatch, getState) => {
    dispatch({
      type: WORKSPACE.INSERT_DATA,
      data,
      start
    })

    let state = getState().workspace
    let currentWorkspace = state.getIn(['workspaces', state.get('currentWorkspace')])
    const textures = currentWorkspace.get('items').filter((texture) => {
      if (texture.get('type') !== 'texture') {
        return false
      }
      const textureLength = texture.get('width') *
                            texture.get('height') *
                            textureManipulator.getFormat(texture.get('format')).sizeModifier()

      return texture.get('address') < start + data.length && start < texture.get('address') + textureLength
    })
    textures.forEach((texture) => {
      generateItemBlob(texture, currentWorkspace, (blob) => {
        dispatch({
          type: WORKSPACE.UPDATE_ITEM_BLOB,
          workspace: currentWorkspace.get('id'),
          item: texture.get('id'),
          blob: blob
        })
      }, true)
    })
  }
}

export function saveFile () {
  return async (dispatch, getState) => {
    let state = getState().workspace
    let workspace = state.getIn(['workspaces', state.get('currentWorkspace')])
    if (!workspace) {
      return
    }
    const data = workspace.get('data')
    saveFileAs(workspace.get('path'), data, (err) => {
      if (err) {
        console.error(err)
      }
      dispatch({
        type: WORKSPACE.FILE_SAVED,
        success: !err
      })
    })
  }
}
