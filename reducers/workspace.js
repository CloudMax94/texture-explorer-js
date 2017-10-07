// @flow
import { fromJS, List } from 'immutable'
import * as WORKSPACE from '../constants/workspace'
// import textureManipulator from '../lib/textureManipulator'

function getSuccessors (items, item) {
  let successors = []
  function traverse (parentId) {
    items.forEach((i) => {
      if (i.get('parentId') === parentId) {
        let id = i.get('id')
        successors.push(id)
        traverse(id)
      }
    })
  }
  traverse(item)
  return successors
}

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
      const dataPath = ['workspaces', state.get('currentWorkspace'), 'data']
      let buffer = state.getIn(dataPath)
      return state.setIn(dataPath, Buffer.concat([buffer.slice(0, start), data, buffer.slice(start + data.length)]))
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
    case WORKSPACE.UPDATE_ITEM_BLOB:
      return state.updateIn(['workspaces', action.workspace, 'items', action.item], (item) => {
        let oldBlob = item.get('blob')
        if (oldBlob) {
          URL.revokeObjectURL(oldBlob)
        }
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
