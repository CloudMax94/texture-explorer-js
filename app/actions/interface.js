import * as INTERFACE from '../constants/interface'

export function setApplicationMenu (menu) {
  return {
    type: INTERFACE.SET_APPLICATION_MENU,
    menu
  }
}

export function setCurrentPanel (panelGroupId, panelId) {
  return {
    type: INTERFACE.SET_CURRENT_PANEL,
    panelGroupId,
    panelId
  }
}

export function movePanelToDock (panelId, dockId) {
  return {
    type: INTERFACE.MOVE_PANEL_TO_DOCK,
    panelId,
    dockId
  }
}

export function movePanelNextToPanelGroup (panelId, panelGroupId = null, after = true) {
  return {
    type: INTERFACE.MOVE_PANEL_NEXT_TO_PANEL_GROUP,
    panelId,
    panelGroupId, // Optional panel group to place before/after
    after
  }
}

export function movePanelToPanelGroup (panelId, panelGroupId) {
  return {
    type: INTERFACE.MOVE_PANEL_TO_PANEL_GROUP,
    panelId,
    panelGroupId
  }
}

export function movePanelGroupToDock (panelGroupId, dockId) {
  return {
    type: INTERFACE.MOVE_PANEL_GROUP_TO_DOCK,
    panelGroupId,
    dockId
  }
}

export function setDockSize (dock, size) {
  let minSize = 200
  if (dock === 0 || dock === 3) {
    minSize = 120
  }
  size = Math.max(minSize, size)
  return {
    type: INTERFACE.SET_DOCK_SIZE,
    dock,
    size
  }
}

export function setTreeSize (column, size) {
  return {
    type: INTERFACE.SET_TREE_SIZE,
    column,
    size: Math.max(50, size)
  }
}

export function setSetting (key, value) {
  return {
    type: INTERFACE.SET_SETTING,
    key,
    value
  }

}

export function resetPanels () {
  return {
    type: INTERFACE.RESET_PANELS
  }
}

export function toggleAboutDialog (state = undefined) {
  return {
    type: INTERFACE.TOGGLE_ABOUT_DIALOG,
    state
  }
}

export function prompt (settings, callback) {
  return {
    type: INTERFACE.SET_PROMPT,
    settings,
    callback
  }
}

export function closePrompt () {
  return {
    type: INTERFACE.CLOSE_PROMPT
  }
}
