import { fromJS, Map } from 'immutable'
import * as INTERFACE from '../constants/interface'
import { REHYDRATE } from 'redux-persist/constants'

const defaultDocks = fromJS({
  docks: [
    {size: 235, toggled: false},
    {size: 300, toggled: false},
    {size: 300, toggled: false},
    {size: 235, toggled: false}
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
    itemPreview: {panelGroup: 4},
    settings: {panelGroup: 1}
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
const defaultSettings = Map({
  doubleClickSelect: false,
  includePathInSearch: false
})

export default function ui (state = fromJS({
  treeSizes: [300, 115, 115, 115, 115, 95, 85, 60, 60, 130],
  treeVisibility: [true, true, true, true, true, true, true, true, true, true],
  settings: defaultSettings,
  menu: null,
  showAbout: false,
  prompt: null
}).merge(defaultDocks), action) {
  switch (action.type) {
    case REHYDRATE:
      if (action.payload && action.payload.ui) {
        state = state.merge(action.payload.ui)
        // Add missing settings
        for (let [key, value] of defaultSettings.entries()) {
          if (!state.hasIn(['settings', key])) {
            state.setIn(['settings', key], value)
          }
        }
        // Check for missing panels, and if there are any,
        // add them all as a new panel group on dock 3
        let panels = defaultDocks.get('panels').keySeq().toJS()
        let missingPanels = []
        for (let panelId of panels) {
          if (!state.hasIn(['panels', panelId])) {
            missingPanels.push(panelId)
          }
        }
        if (missingPanels.length) {
          let panelGroups = state.get('panelGroups')
          let groupId = getInsertId(panelGroups)
          panelGroups = panelGroups.push(
            Map({id: groupId, dock: 3, currentPanel: missingPanels[0]})
          )
          state = state.set('panelGroups', panelGroups)
          for (let panelId of missingPanels) {
            state = state.setIn(['panels', panelId, 'panelGroup'], groupId)
          }
        }
        return state
      }
      return state
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
      //       event on all .tree-content to update the virtual lists
      if (action.dock === 0 || action.dock === 3) {
        var evt = new Event('resize')
        var el = document.querySelectorAll('.tree-content')
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
    case INTERFACE.SET_SETTING:
      return state.setIn(['settings', action.key], action.value)
    case INTERFACE.SET_PROMPT:
      const { settings, callback } = action
      return state.set('prompt', fromJS({
        settings,
        callback
      }))
    case INTERFACE.CLOSE_PROMPT:
      return state.set('prompt', null)
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
