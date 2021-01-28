import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { is, List, OrderedMap } from 'immutable'

import {
  setDockSize,
  setCurrentPanel,
  movePanelToDock,
  movePanelToPanelGroup,
  movePanelNextToPanelGroup,
  movePanelGroupToDock,
  popoutPanel,
  closePopout
} from '../actions/interface'

import PanelProvider from './PanelProvider'

import Rows from '../components/Rows'
import Columns from '../components/Columns'
import Handle from '../components/Handle'
import PanelGroup from '../components/PanelGroup'

const panelNames = {
  'textureSettings': 'Texture Settings',
  'directorySettings': 'Directory Settings',
  'itemPreview': 'Texture Viewer',
  'overview': 'Directory Tree',
  'profileManager': 'Profile Manager',
  'finder': 'Texture Finder',
  'settings': 'Settings'
}

const NecessaryDockProps = [
  'panelGroups', 'size', 'index', 'layoutDirection', 'popout'
]

class Dock extends React.Component {
  constructor (props) {
    super(props)
    this.containerEl = document.createElement('div')
    this.popouts = {}
  }
  shouldComponentUpdate (nextProps, nextState) {
    let shouldUpdate = !NecessaryDockProps.every((p) => is(nextProps[p], this.props[p]))
    return shouldUpdate
  }
  handleResize = (size) => {
    this.props.setDockSize(this.props.index, size)
  }
  handleClosePopout = (event) => {
    this.props.closePopout(event.target.value)
  }
  renderPanelGroup = (panelGroup) => {
    const { index, layoutDirection } = this.props
    let currentPanel = panelGroup.get('currentPanel')

    let panel
    if (this.props.popout.indexOf(currentPanel) >= 0) {
      panel = (
        <div className='popout-message'>
          <div>This panel is popped.</div>
          <button style={{marginTop: '8px'}} onClick={this.handleClosePopout} value={currentPanel}>Close popout</button>
        </div>
      )
    } else {
      panel = <PanelProvider panel={currentPanel} layoutDirection={layoutDirection === 'vertical' ? 'horizontal' : 'vertical'} />
    }

    return <PanelGroup
      key={panelGroup.get('id')}
      panelGroupId={panelGroup.get('id')}
      dockId={index}
      panels={panelGroup.get('panels')}
      currentPanel={currentPanel}
      setCurrentPanel={this.props.setCurrentPanel}
      movePanelToDock={this.props.movePanelToDock}
      movePanelToPanelGroup={this.props.movePanelToPanelGroup}
      movePanelNextToPanelGroup={this.props.movePanelNextToPanelGroup}
      movePanelGroupToDock={this.props.movePanelGroupToDock}
      popoutPanel={this.props.popoutPanel}
    >
      {panel}
    </PanelGroup>
  }
  render () {
    const { panelGroups, size, index, layoutDirection } = this.props
    const content = panelGroups.map(this.renderPanelGroup).toList()
    if (!content.size) {
      return null
    }
    let Wrap
    if (layoutDirection === 'vertical') {
      Wrap = Columns
    } else {
      Wrap = Rows
    }
    let output = [
      <Wrap key='dock' style={{flex: '0 0 ' + size + 'px'}}>{content}</Wrap>
    ]
    let after = index === 0 || index === 1
    let handle = <Handle
      key='handle'
      size={size}
      layoutDirection={layoutDirection}
      onResize={this.handleResize}
      reverse={!after}
    />
    if (after) {
      output.push(handle)
    } else {
      output.unshift(handle)
    }
    return output
  }
}

function mapStateToProps (state, ownProps) {
  let panelGroups = List()
  for (let panelGroup of state.ui.get('panelGroups').values()) {
    if (panelGroup.get('dock') !== ownProps.index) {
      continue
    }
    let groupId = panelGroup.get('id')
    let panels = OrderedMap()
    for (let [id, panel] of state.ui.get('panels').entries()) {
      if (panel.get('panelGroup') === groupId) {
        panels = panels.set(id, panelNames[id])
      }
    }
    panelGroups = panelGroups.push(panelGroup.set('panels', panels))
  }
  return {
    size: state.ui.getIn(['docks', ownProps.index, 'size']),
    panelGroups,
    popout: state.ui.get('popout')
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    setDockSize,
    setCurrentPanel,
    movePanelToDock,
    movePanelToPanelGroup,
    movePanelNextToPanelGroup,
    movePanelGroupToDock,
    popoutPanel,
    closePopout
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Dock)
