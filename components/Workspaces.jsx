import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setCurrentWorkspace } from '../actions/workspace'

import TreeView from './TreeView.jsx'

class Workspace extends React.Component {
  handleTabClick (workspace) {
    this.props.setCurrentWorkspace(workspace)
  }

  render () {
    const tabs = this.props.workspaces.map((workspace, i) => {
      const classes = [
        'workspace-tab'
      ]
      if (workspace === this.props.current) {
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
    if (this.props.current && this.props.current.get('selectedDirectory')) {
      items = this.props.current.get('items').filter(x => x.parentId === this.props.current.get('selectedDirectory'))
    }
    return (
      <div className='workspace'>
        <div className='workspace-tabs'>
          {tabs}
        </div>
        <div className='workspace-content'>
          <TreeView sizes={this.props.sizes} items={items} />
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
