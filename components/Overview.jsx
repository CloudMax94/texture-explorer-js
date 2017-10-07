import React from 'react'
import Immutable from 'immutable'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setCurrentDirectory, setCurrentTexture } from '../actions/workspace'
import { itemAddressCompare } from '../lib/helpers'

class Overview extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      focusedItem: null
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return this.props.selectedDirectory !== nextProps.selectedDirectory ||
           this.state.focusedItem !== nextState.focusedItem ||
           !Immutable.is(this.props.items, nextProps.items)
  }

  handleDoubleClick (item) {
    if (item.get('type') === 'directory') {
      this.props.setCurrentDirectory(item)
    } else if (item.get('type') === 'texture') {
      this.props.setCurrentTexture(item)
    }
  }

  handleClick (item) {
    this.setState({focusedItem: item.get('id')})
  }

  render () {
    if (!this.props.items) {
      return null
    }

    const groupedDirectories = this.props.items.groupBy(x => x.parentId)

    const traverseDirectories = (id, depth = 0) => {
      const children = groupedDirectories.get(id)
      if (!children) {
        return null
      }
      return children.map((directory, i) => {
        let classes = 'tree-item'
        if (directory.get('id') === this.props.selectedDirectory) {
          classes += ' selected'
        }
        if (directory.get('id') === this.state.focusedItem) {
          classes += ' focused'
        }
        return (
          <div key={i} className={classes}>
            <div className='tree-row' style={{paddingLeft: (24 * depth) + 8 + 'px'}} onClick={this.handleClick.bind(this, directory)} onDoubleClick={this.handleDoubleClick.bind(this, directory)}>
              <i className='tree-icon icon'>file_directory</i>
              {directory.get('name')}
            </div>
            {traverseDirectories(directory.get('id'), depth + 1)}
          </div>
        )
      }).toArray()
    }

    return (
      <div className='directory-tree'>
        <div className='tree-content' tabIndex='0'>
          {traverseDirectories(null)}
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  let currentWorkspace = state.workspace.get('currentWorkspace')
  let items
  if (currentWorkspace) {
    items = state.workspace.getIn(['workspaces', currentWorkspace, 'items'])
    if (items) {
      items = items.filter(x => x.type === 'directory').sort(itemAddressCompare)
    }
  }
  return {
    selectedDirectory: state.workspace.getIn(['workspaces', currentWorkspace, 'selectedDirectory']),
    items: items
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({setCurrentDirectory, setCurrentTexture}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
