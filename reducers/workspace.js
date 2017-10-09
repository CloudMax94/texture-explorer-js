import { fromJS } from 'immutable'
import * as WORKSPACE from '../constants/workspace'
import * as PROFILE from '../constants/profile'
import textureManipulator from '../lib/textureManipulator'

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
      return state.set('currentWorkspace', action.workspace.id)
    case WORKSPACE.INSERT_DATA:
      let { data, start } = action
      return state.updateIn(['workspaces', state.get('currentWorkspace')], (workspace) => {
        let newItems = workspace.get('items').map((item) => {
          if (item.get('type') !== 'texture') {
            return item
          }
          const textureLength = item.get('width') *
                                item.get('height') *
                                textureManipulator.getFormat(item.get('format')).sizeModifier()
          if (item.get('address') < start + data.length && start < item.get('address') + textureLength) {
            item = item.set('blob', null).set('blobState', WORKSPACE.BLOB_UNSET)
          }
          return item
        })
        let buffer = workspace.get('data')
        return workspace.set('items', newItems).set('data', Buffer.concat([buffer.slice(0, start), data, buffer.slice(start + data.length)]))
      })
    case WORKSPACE.ADD_WORKSPACE:
      return state.setIn(['workspaces', action.workspace.get('id')], action.workspace)
    case WORKSPACE.START_UPDATE_ITEM_BLOB:
      return state.mergeIn(['workspaces', action.workspaceId, 'blobs', action.itemId], {blobState: WORKSPACE.BLOB_SETTING})
    case WORKSPACE.UPDATE_ITEM_BLOB:
      state = state.mergeIn(['workspaces', action.workspaceId, 'blobs', action.itemId], {})
      return state.updateIn(['workspaces', action.workspaceId, 'blobs', action.itemId], (item) => {
        let oldBlob = item.get('blob')
        if (oldBlob) {
          URL.revokeObjectURL(oldBlob)
        }
        item = item.set('blobState', WORKSPACE.BLOB_SET)
        if (!action.blob) {
          return item.set('blob', null)
        }
        return item.set('blob', URL.createObjectURL(action.blob))
      })
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
          if (workspace.getIn(['blobs', itemId, 'blobState']) === WORKSPACE.BLOB_SET) {
            workspace = workspace.setIn(['blobs', action.itemId, 'blobState'], WORKSPACE.BLOB_UNSET)
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
    default:
      return state
  }
}
