// @flow
import { fromJS } from 'immutable'
import * as WORKSPACE from '../constants/workspace'
// import textureManipulator from '../lib/textureManipulator'

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
