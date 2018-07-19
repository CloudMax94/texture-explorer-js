import React from 'react'

import { List, is } from 'immutable'

import ImmutablePureComponent from '../ImmutablePureComponent'

import VirtualList from 'react-virtual-list'

const ItemHeight = 20

class OverviewItem extends ImmutablePureComponent {
  handleClick = () => {
    this.props.onClick(this.props.directory)
  }
  handleDoubleClick = () => {
    this.props.onDoubleClick(this.props.directory)
  }
  render () {
    const {directory, depth, className, count} = this.props
    let countDisplay = count
    if (count === 0) {
      countDisplay = ''
    } else if (count > 99) {
      countDisplay = '*'
    }
    return (
      <div className={className}>
        <div className='tree-row' style={{paddingLeft: (24 * depth) + 8 + 'px'}} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick}>
          <i className='tree-icon icon' data-count={countDisplay}>file_directory</i>
          {directory.get('name')}
        </div>
      </div>
    )
  }
}

const VirtualOverview = ({virtual}) => {
  return (
    <div style={{...virtual.style, minHeight: '100%'}}>
      {virtual.items}
    </div>
  )
}

class Overview extends ImmutablePureComponent {
  static dependencies = {
    actions: [
      'setCurrentDirectory',
      'setCurrentTexture',
      'deleteItem',
      'copyItemToClipboard'
    ],
    state: [
      ['currentProfileId', 'profileId'],
      'groupedDirectories',
      'successorCount',
      'selectedDirectoryId'
    ]
  }

  constructor (props) {
    super(props)
    this.state = {
      focusedItem: null
    }
    this.scrollContainer = React.createRef()
  }

  componentDidMount () {
    this.VirtualList = VirtualList({
      container: this.scrollContainer.current
    })(VirtualOverview)
    this.setState({
      VirtualList: true
    })
  }

  componentWillUpdate (nextProps, nextState) {
    const scrollContainer = this.scrollContainer.current
    if (this.state.focusedItem !== nextState.focusedItem && nextState.focusedItem) {
      // When focused item changes, scroll the new one into view
      let index = List(this.getOrderedItems(nextProps.groupedDirectories)).findIndex((item) => item.get('id') === nextState.focusedItem)
      if (index > -1) {
        let position = ItemHeight * index
        let { scrollTop, clientHeight } = scrollContainer
        if (position < scrollTop) {
          scrollContainer.scrollTop = position
        } else if (position > scrollTop + clientHeight - ItemHeight) {
          scrollContainer.scrollTop = position - clientHeight + ItemHeight
        }
      }
    }
  }

  getOrderedItems = (groupedDirectories, id = null) => {
    let items = []
    const children = groupedDirectories.get(id)
    if (!children) {
      return items
    }
    children.toList().forEach((directory) => {
      items.push(directory, ...this.getOrderedItems(groupedDirectories, directory.get('id')))
    })
    return items
  }

  handleKeyDown = (event) => {
    const { focusedItem } = this.state
    const { profileId, deleteItem, copyItemToClipboard } = this.props
    const items = List(this.getOrderedItems(this.props.groupedDirectories))
    if (items && items.size) {
      if (focusedItem) {
        const currentIndex = items.findIndex((item) => item.get('id') === focusedItem)
        if (currentIndex > -1) {
          switch (event.keyCode) {
            case 13: // Enter
              this.selectItem(items.find((item) => item.get('id') === focusedItem))
              break
            case 38: // Up Arrow
              if (currentIndex > 0) {
                this.focusItem(items.get(currentIndex - 1))
              }
              break
            case 40: // Down Arrow
              if (currentIndex < items.size - 1) {
                this.focusItem(items.get(currentIndex + 1))
              }
              break
            case 46: // Delete
              if (items.size > 1) {
                if (currentIndex < items.size - 1) {
                  this.focusItem(items.get(currentIndex + 1))
                } else {
                  this.focusItem(items.get(items.size - 2))
                }
              } else {
                this.setState({focusedItem: null})
              }
              deleteItem(focusedItem)
              break
            case 67: // C
              if (event.ctrlKey) {
                copyItemToClipboard(profileId, focusedItem)
              }
              break
            default:
              return
          }
          event.preventDefault()
          return
        }
      }
      switch (event.keyCode) {
        case 38: // Up Arrow
          this.focusItem(items.get(items.size - 1))
          break
        case 40: // Down Arrow
          this.focusItem(items.get(0))
          break
        default:
          return
      }
      event.preventDefault()
    }
  }

  selectItem = (item) => {
    if (item.get('type') === 'directory') {
      this.props.setCurrentDirectory(item)
    } else if (item.get('type') === 'texture') {
      this.props.setCurrentTexture(item)
    }
  }

  focusItem = (item) => {
    this.setState({focusedItem: item.get('id')})
  }

  handleDoubleClick = (item) => {
    this.selectItem(item)
  }

  handleClick = (item) => {
    this.focusItem(item)
  }

  render () {
    const { groupedDirectories, successorCount } = this.props
    const items = []
    const traverseDirectories = (id, depth = 0) => {
      const children = groupedDirectories.get(id)
      if (!children) {
        return
      }
      children.toList().map((directory) => {
        let classes = 'tree-item'
        if (directory.get('id') === this.props.selectedDirectoryId) {
          classes += ' selected'
        }
        if (directory.get('id') === this.state.focusedItem) {
          classes += ' focused'
        }
        items.push(<OverviewItem key={directory.get('id')} className={classes} directory={directory} depth={depth} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick} count={successorCount.getIn([directory.get('id'), 'childTextures']) || 0} />)
        traverseDirectories(directory.get('id'), depth + 1)
      })
    }
    if (groupedDirectories) {
      traverseDirectories(null)
    }
    return (
      <div className='directory-tree'>
        <div className='tree-content' tabIndex='0' onKeyDown={this.handleKeyDown} ref={this.scrollContainer}>
          {this.state.VirtualList ? <this.VirtualList
            items={items}
            itemHeight={ItemHeight}
          /> : null}
        </div>
      </div>
    )
  }
}

export default Overview
