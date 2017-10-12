import React from 'react'

import ImmutablePureComponent from './ImmutablePureComponent'

class Overview extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.state = {
      focusedItem: null
    }
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
      return children.toList().map((directory, i) => {
        let classes = 'tree-item'
        if (directory.get('id') === this.props.selectedDirectoryId) {
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
      })
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

export default Overview
