import { fromJS, Map } from 'immutable'
import * as INTERFACE from '../constants/interface'

const defaultDocks = fromJS({
  docks: [
    {size: 210, toggled: false},
    {size: 300, toggled: false},
    {size: 300, toggled: false},
    {size: 210, toggled: false}
  ],
  panelGroups: {
    '0': {dock: 1, currentPanel: 'overview'},
    '1': {dock: 2, currentPanel: 'profileManager'},
    '2': {dock: 3, currentPanel: 'directorySettings'},
    '3': {dock: 3, currentPanel: 'textureSettings'},
    '4': {dock: 3, currentPanel: 'itemPreview'}
  },
  panels: {
    overview: {panelGroup: '0'},
    profileManager: {panelGroup: '1'},
    settings: {panelGroup: '1'},
    finder: {panelGroup: '1'},
    directorySettings: {panelGroup: '2'},
    textureSettings: {panelGroup: '3'},
    itemPreview: {panelGroup: '4'}
  }
})

export default function ui (state = fromJS({
  treeSizes: [300, 115, 115, 115, 95, 85, 60, 60, 130],
  menu: null,
  showAbout: false
}).merge(defaultDocks), action) {
  switch (action.type) {
    case INTERFACE.SET_CURRENT_PANEL:
      let { panelId, panelGroupId } = action
      return state.setIn(['panelGroups', panelGroupId, 'currentPanel'], panelId)
    case INTERFACE.MOVE_PANEL_TO_DOCK: {
      let { panelId, dockId } = action
      let panelGroups = state.get('panelGroups')
      let previousPanelGroupId = state.getIn(['panels', panelId, 'panelGroup'])
      if (previousPanelGroupId !== null) {
        let count = state.get('panels').count((panel) => panel.get('panelGroup') === previousPanelGroupId)
        if (count === 1) { // If the panel we're moving is the last one in the group, remove the group
          panelGroups = panelGroups.delete(previousPanelGroupId)
        } else if (count > 1) { // If there remains at least one panel in the group
          let currentPanel = panelGroups.getIn([previousPanelGroupId, 'currentPanel'])
          if (currentPanel === panelId) { // The current panel in that group is the one we moved away
            // Select the first available panel in that group
            panelGroups = panelGroups.setIn(
              [previousPanelGroupId, 'currentPanel'],
              state.get('panels').findKey((panel, id) =>
                panelId !== id && panel.get('panelGroup') === previousPanelGroupId
              )
            )
          }
        }
      }
      let panelGroup = Map({dock: dockId, currentPanel: panelId})
      let insertIndex = 0
      while (panelGroups.get(insertIndex.toString())) {
        insertIndex++
      }
      insertIndex = insertIndex.toString()
      panelGroups = panelGroups.set(insertIndex, panelGroup)
      return state.setIn(['panels', panelId, 'panelGroup'], insertIndex).set('panelGroups', panelGroups)
    }
    case INTERFACE.MOVE_PANEL_GROUP_TO_DOCK: {
      let { panelGroupId, dockId } = action
      return state.setIn(['panelGroups', panelGroupId, 'dock'], dockId)
    }
    case INTERFACE.SET_DOCK_SIZE:
      // NOTE: When top/bottom dock is resized, we need to trigger a resize
      //       event on all .tree-view .tree-content to update the virtual lists
      if (action.dock === 0 || action.dock === 3) {
        var evt = new Event('resize')
        var el = document.querySelectorAll('.tree-view .tree-content')
        for (var i = 0, l = el.length; i < l; i++) {
          el[i].dispatchEvent(evt)
        }
      }
      return state.setIn(['docks', action.dock, 'size'], action.size)
    case INTERFACE.RESET_PANELS:
      return state.merge(defaultDocks)
    // -- Actions unrelated to the docks ---------------------------------------
    case INTERFACE.SET_APPLICATION_MENU:
      return state.set('menu', Object.assign({}, action.menu))
    case INTERFACE.SET_STATUS:
      return state.set('status', action.status)
    case INTERFACE.SET_TREE_SIZE:
      return state.setIn(['treeSizes', action.column], action.size)
    case INTERFACE.TOGGLE_ABOUT_DIALOG:
      let newState = action.state
      if (typeof newState === 'undefined') {
        newState = !state.get('showAbout')
      }
      return state.set('showAbout', newState)
    default:
      return state
  }
}
