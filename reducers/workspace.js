// @flow
import { fromJS } from 'immutable'
import * as WORKSPACE from '../constants/workspace'
import { getSuccessors } from '../lib/helpers'
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
            item = item.set('blob', null).set('blob_state', WORKSPACE.BLOB_UNSET)
          }
          return item
        })
        let buffer = workspace.get('data')
        return workspace.set('items', newItems).set('data', Buffer.concat([buffer.slice(0, start), data, buffer.slice(start + data.length)]))
      })
    case WORKSPACE.ADD_WORKSPACE:
      return state.setIn(['workspaces', action.workspace.get('id')], action.workspace)
    case WORKSPACE.ADD_ITEM:
      return state.setIn(['workspaces', action.workspace, 'items', action.item.get('id')], action.item)
    case WORKSPACE.DELETE_ITEM:
      return state.updateIn(['workspaces', action.workspace], (workspace) => {
        if (workspace.get('selectedDirectory') === action.item) {
          workspace = workspace.set('selectedDirectory', null)
        }
        if (workspace.get('selectedTexture') === action.item) {
          workspace = workspace.set('selectedTexture', null)
        }
        return workspace.update('items', (items) => {
          let successors = getSuccessors(items, action.item)
          return items.deleteAll([action.item, ...successors])
        })
      })
    case WORKSPACE.START_UPDATE_ITEM_BLOB:
      return state.setIn(['workspaces', action.workspaceId, 'items', action.itemId, 'blob_state'], WORKSPACE.BLOB_SETTING)
    case WORKSPACE.UPDATE_ITEM_BLOB:
      return state.updateIn(['workspaces', action.workspace, 'items', action.item], (item) => {
        let oldBlob = item.get('blob')
        if (oldBlob) {
          URL.revokeObjectURL(oldBlob)
        }
        item = item.set('blob_state', WORKSPACE.BLOB_SET)
        if (!action.blob) {
          return item.set('blob', null)
        }
        return item.set('blob', URL.createObjectURL(action.blob))
      })
    case WORKSPACE.SET_ITEM_DATA:
      return state.setIn(['workspaces', action.workspace, 'items', action.item, action.key], action.value)
    default:
      return state
  }
}
