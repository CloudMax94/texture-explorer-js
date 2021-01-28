import { fromJS } from 'immutable'
import * as WORKSPACE from '../constants/workspace'
import * as PROFILE from '../constants/profile'

export default function workspace (state = fromJS({
  workspaces: {},
  currentWorkspace: null
}), action) {
  switch (action.type) {
    case WORKSPACE.SET_CURRENT_DIRECTORY:
      return state.setIn(['workspaces', state.get('currentWorkspace'), 'selectedDirectory'], action.item.get('id'))
    case WORKSPACE.SET_CURRENT_TEXTURE:
      return state.setIn(['workspaces', state.get('currentWorkspace'), 'selectedTexture'], action.item.get('id'))
    case WORKSPACE.SET_CURRENT_WORKSPACE:
      return state.set('currentWorkspace', action.workspaceId)
    case WORKSPACE.INSERT_DATA:
      let { data, start } = action
      return state.updateIn(['workspaces', state.get('currentWorkspace')], (workspace) => {
        let buffer = workspace.get('data')
        return workspace.set('data', Buffer.concat([buffer.slice(0, start), data, buffer.slice(start + data.length)]))
      })
    case WORKSPACE.ADD_WORKSPACE:
      return state.setIn(['workspaces', action.workspace.get('id')], action.workspace)
    case WORKSPACE.DELETE_WORKSPACE:
      if (state.get('currentWorkspace') === action.workspaceId) {
        state = state.set('currentWorkspace', null)
      }
      return state.deleteIn(['workspaces', action.workspaceId], action.workspace)
    case WORKSPACE.START_UPDATE_ITEM_BLOB:
      return state.mergeIn(['workspaces', action.workspaceId, 'blobs', action.itemId], {
        dirty: false,
        generating: true
      })
    case WORKSPACE.END_UPDATE_ITEM_BLOB:
      return state.mergeIn(['workspaces', action.workspaceId, 'blobs', action.itemId], {
        generating: false
      })
    case WORKSPACE.UPDATE_ITEM_BLOB:
      state = state.mergeIn(['workspaces', action.workspaceId, 'blobs', action.itemId], {
        blob: null,
        url: null
      })
      return state.updateIn(['workspaces', action.workspaceId, 'blobs', action.itemId], (item) => {
        let oldUrl = item.get('url')
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl)
        }
        if (action.blob) {
          return item.set('blob', action.blob).set('url', URL.createObjectURL(action.blob))
        }
        return item
      })
    case WORKSPACE.CLEAR_ITEM_BLOBS: {
      const { itemIds, workspaceId } = action
      return state.updateIn(['workspaces', workspaceId, 'blobs'], (blobs) => {
        return blobs.map((blob, itemId) => {
          if (itemIds.indexOf(itemId) >= 0) {
            let oldBlob = blob.get('blob')
            if (oldBlob) {
              URL.revokeObjectURL(oldBlob)
            }
            return blob.set('blob', null)
          }
          return blob
        })
      })
    }
    case WORKSPACE.SET_PROFILE:
      return state.updateIn(['workspaces', action.workspaceId], (workspace) => {
        return workspace
          .set('selectedDirectory', null)
          .set('selectedTexture', null)
          .set('profile', action.profileId)
      })
    case PROFILE.SET_ITEM_DATA: {
      const { itemId, key } = action
      if (
        key === 'address' ||
        key === 'format' ||
        key === 'width' ||
        key === 'height' ||
        key === 'palette'
      ) {
        const workspaces = state.get('workspaces').map((workspace) => {
          if (workspace.hasIn(['blobs', itemId])) {
            console.log('setting dirty!', itemId)
            workspace = workspace.setIn(['blobs', itemId, 'dirty'], true)
          }
          return workspace
        })
        return state.set('workspaces', workspaces)
      }
      return state
    }
    case PROFILE.DELETE_ITEMS:
      const { itemIds } = action
      return state.update('workspaces', (workspaces) => {
        return workspaces.map((workspace) => {
          if (itemIds.includes(workspace.get('selectedDirectory'))) {
            workspace = workspace.set('selectedDirectory', null)
          }
          if (itemIds.includes(workspace.get('selectedTexture'))) {
            workspace = workspace.set('selectedTexture', null)
          }
          return workspace.set('blobs', workspace.get('blobs').deleteAll(itemIds))
        })
      })
    case PROFILE.DELETE_PROFILE: {
      return state.update('workspaces', (workspaces) => {
        return workspaces.map((workspace) => {
          if (workspace.get('profile') === action.profileId) {
            return workspace.set('profile', null)
          }
          return workspace
        })
      })
    }
    case PROFILE.ADD_ITEM: {
      const { profileId, item } = action
      const currentWorkspace = state.get('currentWorkspace')
      if (state.getIn(['workspaces', currentWorkspace, 'profile']) === profileId) {
        if (item.get('type') === 'texture') {
          return state.setIn(['workspaces', currentWorkspace, 'selectedTexture'], item.get('id'))
        }
      }
      return state
    }
    default:
      return state
  }
}
