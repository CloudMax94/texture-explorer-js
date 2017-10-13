import { fromJS, List } from 'immutable'
import * as INTERFACE from '../constants/interface'
const defaultLayout = [
  [],
  [['overview']],
  [['profileManager', 'settings', 'finder']],
  [['directorySettings'], ['textureSettings'], ['itemPreview']]
]
const defaultDockSizes = [160, 300, 300, 210]
export default function ui (state = fromJS({
  settings: {
    layout: defaultLayout,
    panels: {
      overview: {
        hidden: false
      },
      itemSettings: {
        hidden: false
      },
      itemPreview: {
        hidden: false
      },
      settings: {
        hidden: false
      },
      profileManager: {
        hidden: false
      },
      finder: {
        hidden: false
      },
      dummy: {
        hidden: false
      }
    },
    dockSizes: defaultDockSizes,
    treeSizes: [300, 115, 115, 115, 95, 85, 60, 60, 130]
  },
  status: null,
  menu: null,
  showAbout: false
}), action) {
  switch (action.type) {
    case INTERFACE.SET_APPLICATION_MENU:
      return state.set('menu', Object.assign({}, action.menu))
    case INTERFACE.SET_STATUS:
      return state.set('status', action.status)
    case INTERFACE.MOVE_PANEL_TO_DOCK: {
      let { dock, groupIndex, index, newDock } = action
      return state.updateIn(['settings', 'layout'], (layout) => {
        let panel = layout.getIn([dock, groupIndex, index])
        let prevPanel = layout.getIn([dock, groupIndex]).splice(index, 1)
        let newC = layout.get(newDock).push(new List([panel]))
        let newLayout = layout.set(newDock, newC)
        if (prevPanel.size) {
          return newLayout.setIn([dock, groupIndex], prevPanel)
        } else {
          return newLayout.set(dock, newLayout.get(dock).splice(groupIndex, 1))
        }
      })
    }
    case INTERFACE.MOVE_PANEL_GROUP_TO_DOCK: {
      let { dock, index, newDock } = action
      return state.updateIn(['settings', 'layout'], (layout) => {
        let group = layout.getIn([dock, index])
        let prevC = layout.get(dock).splice(index, 1)
        let newC = layout.get(newDock).push(group)
        return layout.set(dock, prevC).set(newDock, newC)
      })
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
      return state.setIn(['settings', 'dockSizes', action.dock], action.size)
    case INTERFACE.SET_TREE_SIZE:
      return state.setIn(['settings', 'treeSizes', action.column], action.size)
    case INTERFACE.RESET_PANELS:
      return state
        .setIn(['settings', 'layout'], fromJS(defaultLayout))
        .setIn(['settings', 'dockSizes'], fromJS(defaultDockSizes))
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
