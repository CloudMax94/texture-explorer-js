import * as WORKSPACE from '../constants/workspace'

import { Record, Map } from 'immutable'
import { throttle } from 'lodash'
import { saveFileAs } from '../utils/fileHandler'
import { prepareProfiles, loadProfile } from './profile'
import workerPool from '../utils/workerPool'
import {getFormat} from '@cloudmodding/texture-manipulator'
import { getSuccessors, getItemPath } from '../utils/helpers'

import FileSaver from 'file-saver'
import JSZip from 'jszip'

let idCounter = 0

const WorkspaceRecord = Record({
  id: null,
  data: null,
  path: null,
  name: 'New Workspace',
  key: null,
  blobs: Map(),
  profile: null,
  selectedDirectory: null,
  selectedTexture: null
})

function itemHasValidData (item) {
  if (item.get('type') === 'texture') {
    if (Number.isInteger(item.get('address')) &&
      Number.isInteger(item.get('width')) &&
      Number.isInteger(item.get('height')) &&
      getFormat(item.get('format')).isValid()) {
      return true
    }
  }
  return false
}

function getItemBuffer (item, workspace) {
  let start = item.get('address')
  let end = start + item.get('width') * item.get('height') * getFormat(item.get('format')).bits / 8
  return workspace.get('data').slice(start, end)
}

function getItemPaletteBuffer (item, workspace) {
  return workspace.get('data').slice(
    item.get('palette'),
    item.get('palette') + 0x200
  )
}

function generateItemBlob (item, workspace, callback) {
  if (item.get('type') !== 'texture' || !itemHasValidData(item)) {
    callback(null)
    return
  }

  let palette
  const textureFormat = getFormat(item.get('format'))
  if (textureFormat.hasPalette()) {
    palette = Array.from(getItemPaletteBuffer(item, workspace))
  }
  const data = Array.from(getItemBuffer(item, workspace)) // Web workers are slow with typed data, so we turn it into regular arrays
  workerPool.send({
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
  return {
    type: WORKSPACE.SET_CURRENT_DIRECTORY,
    item
  }
}

export function setCurrentTexture (item) {
  return {
    type: WORKSPACE.SET_CURRENT_TEXTURE,
    item
  }
}

export function setCurrentWorkspace (workspaceId) {
  return {
    type: WORKSPACE.SET_CURRENT_WORKSPACE,
    workspaceId
  }
}

export function createWorkspace (input) {
  return async (dispatch, getState) => {
    const data = input.data
    const filePath = input.path
    const name = input.name
    let key
    let isN64ROM = false
    if (data.length >= 0x40) {
      switch (data.readUInt32BE(0)) {
        case 0x80371240:
          isN64ROM = true
          break
        case 0x37804012: {
          data.swap16()
          isN64ROM = true
          break
        }
        case 0x40123780: {
          data.swap32()
          isN64ROM = true
          break
        }
      }
    }

    if (isN64ROM) {
      key = data.toString('utf8', 0x3B, 0x3F) + data.readUInt8(0x3F)
    } else {
      key = name
    }

    let id = (idCounter++).toString(36)

    dispatch(prepareProfiles(key))
    const profileStore = getState().profile
    const defaultProfile = profileStore.get('profiles').find(
      (profile) => profile.get('key') === key && profile.get('name') === 'Default'
    )
    if (!defaultProfile.get('loaded')) {
      dispatch(loadProfile(defaultProfile.get('id')))
    }

    let workspace = new WorkspaceRecord({
      id,
      data,
      path: filePath,
      name,
      key,
      items: null,
      profile: defaultProfile.get('id'),
      selectedDirectory: null,
      selectedTexture: null
    })

    dispatch({
      type: WORKSPACE.ADD_WORKSPACE,
      workspace: workspace
    })

    dispatch({
      type: WORKSPACE.SET_CURRENT_WORKSPACE,
      workspaceId: id
    })
  }
}

export function deleteWorkspace (workspaceId) {
  return {
    type: WORKSPACE.DELETE_WORKSPACE,
    workspaceId: workspaceId
  }
}

const blobHandler = {
  dirty: {},
  resolvers: {},
  dispatch: false,
  getState: false,
  schedule: function (dispatch, getState, textureId, workspaceId) {
    blobHandler.dispatch = dispatch
    blobHandler.getState = getState
    dispatch({
      type: WORKSPACE.START_UPDATE_ITEM_BLOB,
      workspaceId,
      itemId: textureId
    })
    return new Promise((resolve, reject) => {
      let key = textureId + ',' + workspaceId
      if (!(key in blobHandler.resolvers)) {
        // if texture is not being generated at the moment, create a list of resolvers & start generating the texture
        blobHandler.resolvers[key] = [resolve]
        blobHandler.generate(textureId, workspaceId)
      } else {
        // schedule it for another generation
        blobHandler.dirty[key] = true
        blobHandler.resolvers[key].push(resolve)
      }
    })
  },
  generate (textureId, workspaceId) {
    let args = arguments
    let state = blobHandler.getState()
    let workspace = state.workspace.getIn(['workspaces', workspaceId])
    let item = state.profile.getIn(['profiles', workspace.get('profile'), 'items', textureId])
    let key = textureId + ',' + workspaceId
    generateItemBlob(item, workspace, (blob) => {
      if (blobHandler.dirty[key]) {
        // It's been dirtied, we generate it again
        delete blobHandler.dirty[key]
        blobHandler.generate(...args)
      } else {
        // Resolve all promises that are waiting for this texture to finish generating!
        blobHandler.dispatch({
          type: WORKSPACE.UPDATE_ITEM_BLOB,
          workspaceId,
          itemId: textureId,
          blob
        })
        for (let resolve of blobHandler.resolvers[key]) {
          resolve(blob)
        }
        delete blobHandler.resolvers[key]
      }
    })
  }
}

export function updateItemBlob (itemId, workspaceId) {
  return async (dispatch, getState) => {
    if (!workspaceId) {
      return
    }
    blobHandler.schedule(dispatch, getState, itemId, workspaceId)
  }
}

export function downloadItem (itemId) {
  return async (dispatch, getState) => {
    let state = getState()
    let workspaceId = state.workspace.get('currentWorkspace')
    let workspace = state.workspace.getIn(['workspaces', workspaceId])
    if (!workspace) {
      return
    }
    let profileId = workspace.get('profile')
    let items = state.profile.getIn(['profiles', profileId, 'items'])
    // TODO - Check item type and support downloading a single texture in addition to entires directories
    let successorIds = [itemId, ...getSuccessors(state.profile.getIn(['profiles', profileId, 'items']), itemId)]
    let zip = new JSZip()
    let usedNames = []
    for (let successorId of successorIds) {
      let item = state.profile.getIn(['profiles', profileId, 'items', successorId])
      if (item.get('type') !== 'texture') {
        continue
      }
      let blob = workspace.getIn(['blobs', successorId, 'blob'])
      if (!blob) {
        blob = await blobHandler.schedule(dispatch, getState, successorId, workspaceId)
        if (!blob) {
          continue // Failed to generate blob, do not include it in zip
        }
      }
      let p = getItemPath(items, successorId, itemId)
      let c = 1
      let name = p
      while (usedNames.indexOf(name) !== -1) {
        name = `${p} (${++c})`
      }
      usedNames.push(name)
      zip.file(name + '.png', blob)
    }
    zip.generateAsync({type: 'blob'}).then((content) => {
      FileSaver.saveAs(content, `textures.zip`)
    })
  }
}

export function setProfile (profileId, workspaceId) {
  return async (dispatch, getState) => {
    if (!workspaceId) {
      return
    }

    const profile = getState().profile.getIn(['profiles', profileId])
    if (!profile) {
      return
    }

    if (!profile.get('loaded')) {
      dispatch(loadProfile(profileId))
    }

    dispatch({
      type: WORKSPACE.SET_PROFILE,
      workspaceId,
      profileId
    })
  }
}

export function insertData (data, start) {
  return async (dispatch, getState) => {
    dispatch({
      type: WORKSPACE.INSERT_DATA,
      data,
      start
    })

    let state = getState()
    let workspaceId = state.workspace.get('currentWorkspace')

    let profileId = state.workspace.getIn(['workspaces', workspaceId, 'profile'])
    let profile = state.profile.getIn(['profiles', profileId])

    let itemIds = []
    profile.get('items').forEach((item) => {
      if (item.get('type') !== 'texture') {
        return
      }
      const textureLength = item.get('width') *
                            item.get('height') *
                            getFormat(item.get('format')).bits / 8
      if (item.get('address') < start + data.length && start < item.get('address') + textureLength) {
        itemIds.push(item.get('id'))
      }
    })
    dispatch({
      type: WORKSPACE.CLEAR_ITEM_BLOBS,
      workspaceId,
      itemIds
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
