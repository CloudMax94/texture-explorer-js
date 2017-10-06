// @flow
import { fromJS, List } from 'immutable'
import * as INTERFACE from '../constants/interface'
const defaultLayout = [
  [],
  [['overview']],
  [['settings', 'profileManager', 'finder']],
  [['directorySettings'], ['textureSettings'], ['itemPreview']]
]
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
    containerSizes: [160, 300, 300, 210],
    treeSizes: [300, 115, 115, 115, 95, 85, 60, 60, 130]
  },
  status: null,
  menu: null
}), action) {
  switch (action.type) {
    case INTERFACE.SET_APPLICATION_MENU:
      return state.set('menu', fromJS(action.menu))
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
      return state.setIn(['settings', 'containerSizes', action.container], action.size)
    case INTERFACE.SET_TREE_SIZE:
      return state.setIn(['settings', 'treeSizes', action.column], action.size)
    case INTERFACE.RESET_PANELS:
      return state.setIn(['settings', 'layout'], fromJS(defaultLayout))
    default:
      return state
  }
}