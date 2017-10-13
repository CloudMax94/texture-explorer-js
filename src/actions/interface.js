import * as INTERFACE from '../constants/interface'

export function setApplicationMenu (menu) {
  return {
    type: INTERFACE.SET_APPLICATION_MENU,
    menu
  }
}

export function setStatus (status) {
  return {
    type: INTERFACE.SET_STATUS,
    status
  }
}

export function movePanelToDock (dock, groupIndex, index, newDock) {
  return {
    type: INTERFACE.MOVE_PANEL_TO_DOCK,
    dock,
    groupIndex,
    index,
    newDock
  }
}

export function movePanelGroupToDock (dock, index, newDock) {
  return {
    type: INTERFACE.MOVE_PANEL_GROUP_TO_DOCK,
    dock,
    index,
    newDock
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
