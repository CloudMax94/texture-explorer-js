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

export function movePanelToContainer (container, groupIndex, index, newContainer) {
  return {
    type: INTERFACE.MOVE_PANEL_TO_CONTAINER,
    container,
    groupIndex,
    index,
    newContainer
  }
}

export function movePanelGroupToContainer (container, index, newContainer) {
  return {
    type: INTERFACE.MOVE_PANEL_GROUP_TO_CONTAINER,
    container,
    index,
    newContainer
  }
}

export function setContainerSize (container, size) {
  return {
    type: INTERFACE.SET_CONTAINER_SIZE,
    container,
    size
  }
}

export function setTreeSize (column, size) {
  return {
    type: INTERFACE.SET_TREE_SIZE,
    column,
    size
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
