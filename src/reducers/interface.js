import { fromJS, Map } from 'immutable'
import * as INTERFACE from '../constants/interface'

const defaultDocks = fromJS({
  docks: [
    {size: 210, toggled: false},
    {size: 300, toggled: false},
    {size: 300, toggled: false},
    {size: 210, toggled: false}
  ],
  panelGroups: [
    {id: 0, dock: 1, currentPanel: 'overview'},
    {id: 1, dock: 2, currentPanel: 'profileManager'},
    {id: 2, dock: 3, currentPanel: 'directorySettings'},
    {id: 3, dock: 3, currentPanel: 'textureSettings'},
    {id: 4, dock: 3, currentPanel: 'itemPreview'}
  ],
  panels: {
    overview: {panelGroup: 0},
    profileManager: {panelGroup: 1},
    finder: {panelGroup: 1},
    directorySettings: {panelGroup: 2},
    textureSettings: {panelGroup: 3},
    itemPreview: {panelGroup: 4}
  }
})

function updatePreviousPanelGroup (panelId, panelGroups, panels) {
  let previousPanelGroupId = panels.getIn([panelId, 'panelGroup'])
  let previousPanelGroupIndex = panelGroups.findIndex((panelGroup) => panelGroup.get('id') === previousPanelGroupId)
  if (previousPanelGroupIndex >= 0) {
    let count = panels.count((panel) => panel.get('panelGroup') === previousPanelGroupId)
    if (count === 1) { // If the panel we're moving is the last one in the group, remove the group
      panelGroups = panelGroups.delete(previousPanelGroupIndex)
    } else if (count > 1) { // If there remains at least one panel in the group
      let currentPanel = panelGroups.getIn([previousPanelGroupIndex, 'currentPanel'])
      if (currentPanel === panelId) { // The current panel in that group is the one we moved away
        // Select the first available panel in that group
        panelGroups = panelGroups.setIn([previousPanelGroupIndex, 'currentPanel'],
          panels.findKey((panel, id) =>
            panelId !== id && panel.get('panelGroup') === previousPanelGroupId
          )
        )
      }
    }
  }
  return panelGroups
}

function getInsertId (panelGroups) {
  let getInsertId = 0
  while (panelGroups.findIndex((panelGroup) => panelGroup.get('id') === getInsertId) >= 0) {
    getInsertId++
  }
  return getInsertId
}

export default function ui (state = fromJS({
  treeSizes: [300, 115, 115, 115, 95, 85, 60, 60, 130],
  menu: null,
  showAbout: false
}).merge(defaultDocks), action) {
  switch (action.type) {
    case INTERFACE.SET_CURRENT_PANEL:
      let { panelId, panelGroupId } = action
      let panelGroupIndex = state.get('panelGroups').findIndex((panelGroup) =>
        panelGroup.get('id') === panelGroupId
      )
      return state.setIn(['panelGroups', panelGroupIndex, 'currentPanel'], panelId)
    case INTERFACE.MOVE_PANEL_TO_DOCK: {
      let { panelId, dockId } = action

      let panelGroups = updatePreviousPanelGroup(panelId, state.get('panelGroups'), state.get('panels'))

      let groupId = getInsertId(panelGroups)

      panelGroups = panelGroups.push(
        Map({id: groupId, dock: dockId, currentPanel: panelId})
      )
      return state.setIn(['panels', panelId, 'panelGroup'], groupId).set('panelGroups', panelGroups)
    }
    case INTERFACE.MOVE_PANEL_TO_PANEL_GROUP: {
      let { panelId, panelGroupId } = action
      let panelGroups = updatePreviousPanelGroup(panelId, state.get('panelGroups'), state.get('panels'))
      return state.setIn(['panels', panelId, 'panelGroup'], panelGroupId).set('panelGroups', panelGroups)
    }
    case INTERFACE.MOVE_PANEL_NEXT_TO_PANEL_GROUP: {
      let { panelId, panelGroupId, after } = action

      let panelGroups = updatePreviousPanelGroup(panelId, state.get('panelGroups'), state.get('panels'))

      let adjacentPanelGroupIndex = panelGroups.findIndex((panelGroup) =>
        panelGroup.get('id') === panelGroupId
      )

      let dockId = panelGroups.getIn([adjacentPanelGroupIndex, 'dock'])
      let groupId = getInsertId(panelGroups)

      panelGroups = panelGroups.splice(
        adjacentPanelGroupIndex + (after ? 1 : 0),
        0,
        Map({id: groupId, dock: dockId, currentPanel: panelId})
      )

      return state.setIn(['panels', panelId, 'panelGroup'], groupId).set('panelGroups', panelGroups)
    }
    case INTERFACE.MOVE_PANEL_GROUP_TO_DOCK: {
      let { panelGroupId, dockId } = action

      let panelGroups = state.get('panelGroups')
      let panelGroupIndex = panelGroups.findIndex((panelGroup) =>
        panelGroup.get('id') === panelGroupId
      )
      let panelGroup = panelGroups.get(panelGroupIndex).set('dock', dockId)
      panelGroups = panelGroups.delete(panelGroupIndex).push(panelGroup)

      return state.set('panelGroups', panelGroups)
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
