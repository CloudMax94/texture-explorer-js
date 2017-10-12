import * as WORKSPACE from '../constants/workspace'

import { Record, Map } from 'immutable'
import { throttle } from 'lodash'
import { saveFileAs } from '../lib/fileHandler'
import { prepareProfiles, loadProfile } from './profile'
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
  blobs: Map(),
  profile: '',
  selectedDirectory: null,
  selectedTexture: null
})

function asyncThrottle (func, cbArg, timeout, keys) {
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

export function setCurrentWorkspace (workspace) {
  return {
    type: WORKSPACE.SET_CURRENT_WORKSPACE,
    workspace
  }
}

export function createWorkspace (input) {
  return async (dispatch, getState) => {
    const data = input.data
    const filePath = input.path
    const name = input.name
    const key = data.toString('utf8', 0x3B, 0x3F) + data.readUInt8(0x3F)
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
      workspace: workspace
    })
  }
}

export function deleteWorkspace (workspaceId) {
  return {
    type: WORKSPACE.DELETE_WORKSPACE,
    workspaceId: workspaceId
  }
}

const blobThrottler = {
  throttlers: {},
  call: function (...args) {
    let key = args[0].get('id') + '-' + args[1].get('id')
    if (!(key in this.throttlers)) {
      this.throttlers[key] = asyncThrottle(generateItemBlob, 2, 1000)
    }
    this.throttlers[key](...args)
  }
}

export function updateItemBlob (itemId, workspaceId) {
  return async (dispatch, getState) => {
    let state = getState()
    if (!workspaceId) {
      return
    }

    dispatch({
      type: WORKSPACE.START_UPDATE_ITEM_BLOB,
      workspaceId,
      itemId
    })

    let workspace = state.workspace.getIn(['workspaces', workspaceId])
    let item = state.profile.getIn(['profiles', workspace.get('profile'), 'items', itemId])

    blobThrottler.call(item, workspace, (blob) => {
      dispatch({
        type: WORKSPACE.UPDATE_ITEM_BLOB,
        workspaceId,
        itemId,
        blob
      })
    }, true)
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
  return {
    type: WORKSPACE.INSERT_DATA,
    data,
    start
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
