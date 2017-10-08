// @flow
import { fromJS, List } from 'immutable'
import * as INTERFACE from '../constants/interface'
const defaultLayout = [
  [],
  [['overview']],
  [['settings', 'profileManager', 'finder']],
  [['directorySettings'], ['textureSettings'], ['itemPreview']]
]
const defaultContainerSizes = [160, 300, 300, 210]
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
    containerSizes: defaultContainerSizes,
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
    case INTERFACE.MOVE_PANEL_TO_CONTAINER: {
      let { container, groupIndex, index, newContainer } = action
      return state.updateIn(['settings', 'layout'], (layout) => {
        let panel = layout.getIn([container, groupIndex, index])
        let prevPanel = layout.getIn([container, groupIndex]).splice(index, 1)
        let newC = layout.get(newContainer).push(new List([panel]))
        let newLayout = layout.set(newContainer, newC)
        if (prevPanel.size) {
          return newLayout.setIn([container, groupIndex], prevPanel)
        } else {
          return newLayout.set(container, newLayout.get(container).splice(groupIndex, 1))
        }
      })
    }
    case INTERFACE.MOVE_PANEL_GROUP_TO_CONTAINER: {
      let { container, index, newContainer } = action
      return state.updateIn(['settings', 'layout'], (layout) => {
        let group = layout.getIn([container, index])
        let prevC = layout.get(container).splice(index, 1)
        let newC = layout.get(newContainer).push(group)
        return layout.set(container, prevC).set(newContainer, newC)
      })
    }
    case INTERFACE.SET_CONTAINER_SIZE:
      // NOTE: When top/bottom container is resized, we need to trigger a resize
      //       event on all .tree-view .tree-content to update the virtual lists
      if (action.container === 0 || action.container === 3) {
        var evt = new Event('resize')
        var el = document.querySelectorAll('.tree-view .tree-content')
        for (var i = 0, l = el.length; i < l; i++) {
          el[i].dispatchEvent(evt)
        }
      }
      return state.setIn(['settings', 'containerSizes', action.container], action.size)
    case INTERFACE.SET_TREE_SIZE:
      return state.setIn(['settings', 'treeSizes', action.column], action.size)
    case INTERFACE.RESET_PANELS:
      return state
        .setIn(['settings', 'layout'], fromJS(defaultLayout))
        .setIn(['settings', 'containerSizes'], fromJS(defaultContainerSizes))
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
