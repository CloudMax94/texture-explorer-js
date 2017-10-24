import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { is } from 'immutable'

import {
  setDockSize,
  setCurrentPanel,
  movePanelToDock,
  movePanelToPanelGroup,
  movePanelNextToPanelGroup,
  movePanelGroupToDock
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
  'finder': 'Texture Finder'
}

const NecessaryDockProps = [
  'panelGroups', 'size', 'index', 'layoutDirection'
]

class Dock extends React.Component {
  shouldComponentUpdate (nextProps, nextState) {
    let shouldUpdate = !NecessaryDockProps.every((p) => is(nextProps[p], this.props[p]))
    return shouldUpdate
  }
  handleResize = (size) => {
    this.props.setDockSize(this.props.index, size)
  }
  render () {
    const { panelGroups, size, index } = this.props
    const content = panelGroups.map((panelGroup) => {
      let panelId = panelGroup.get('currentPanel')
      return <PanelGroup
        key={panelGroup.get('id')}
        panelGroupId={panelGroup.get('id')}
        dockId={index}
        panels={panelGroup.get('panels').map((panel, panelId) => panelNames[panelId])}
        currentPanel={panelId}
        setCurrentPanel={this.props.setCurrentPanel}
        movePanelToDock={this.props.movePanelToDock}
        movePanelToPanelGroup={this.props.movePanelToPanelGroup}
        movePanelNextToPanelGroup={this.props.movePanelNextToPanelGroup}
        movePanelGroupToDock={this.props.movePanelGroupToDock}
      >
        <PanelProvider panel={panelId} />
      </PanelGroup>
    }).toList()
    if (!content.size) {
      return null
    }
    let Wrap
    if (this.props.layoutDirection === 'vertical') {
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
      layoutDirection={this.props.layoutDirection}
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
  let panelGroups = state.ui.get('panelGroups').filter((panelGroup) =>
    panelGroup.get('dock') === ownProps.index
  ).map((panelGroup) =>
    panelGroup.set('panels', state.ui.get('panels').filter((panel) =>
      panel.get('panelGroup') === panelGroup.get('id')
    ))
  )
  return {
    size: state.ui.getIn(['docks', ownProps.index, 'size']),
    panelGroups
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    setDockSize,
    setCurrentPanel,
    movePanelToDock,
    movePanelToPanelGroup,
    movePanelNextToPanelGroup,
    movePanelGroupToDock
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Dock)
