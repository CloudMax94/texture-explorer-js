import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setCurrentWorkspace } from '../actions/workspace'
import { itemAddressCompare } from '../lib/helpers'

import TreeView from './TreeView.jsx'

class Workspace extends React.Component {
  handleTabClick (workspace) {
    this.props.setCurrentWorkspace(workspace)
  }

  render () {
    const { workspaces, current, sizes } = this.props
    const tabs = workspaces.map((workspace, i) => {
      const classes = [
        'workspace-tab'
      ]
      if (workspace === current) {
        classes.push('selected')
      }
      return (
        <div key={i} className={classes.join(' ')} onClick={this.handleTabClick.bind(this, workspace)}>
          <span className='btnText'>{workspace.get('name')}</span>
          <span className='closeBtn'>x</span>
        </div>
      )
    }).toArray()
    let items = null
    let currentDirectory
    if (current) {
      currentDirectory = current.get('selectedDirectory')
      if (current.get('selectedDirectory')) {
        items = current.get('items').toList().filter(item => item.get('parentId') === currentDirectory).sort(itemAddressCompare)
      }
    }
    return (
      <div className='workspace'>
        <div className='workspace-tabs'>
          {tabs}
        </div>
        <div className='workspace-content'>
          <TreeView sizes={sizes} items={items} directory={currentDirectory} />
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    sizes: state.ui.getIn(['settings', 'treeSizes']),
    workspaces: state.workspace.get('workspaces'),
    current: state.workspace.getIn(['workspaces', state.workspace.get('currentWorkspace')])
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({setCurrentWorkspace}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Workspace)
