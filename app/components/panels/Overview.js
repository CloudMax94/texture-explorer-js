import React from 'react'
import { List } from 'immutable'
import ImmutablePureComponent from '../ImmutablePureComponent'
import { DragSource, DropTarget } from 'react-dnd'
import VirtualList from 'react-virtual-list'

import { remote } from 'electron'
const { MenuItem, Menu } = remote

const ItemHeight = 20

class OverviewItem extends ImmutablePureComponent {
  handleClick = () => {
    this.props.onClick(this.props.directory)
  }
  handleDoubleClick = () => {
    this.props.onDoubleClick(this.props.directory)
  }
  handleContext = (event) => {
    const { onClick, onDoubleClick, directory, deleteItem, downloadItem } = this.props

    event.preventDefault()
    event.stopPropagation()

    onClick(directory)

    const menu = new Menu()

    menu.append(new MenuItem({
      label: 'Open',
      click: () => {
        onDoubleClick(directory)
      }
    }))

    menu.append(new MenuItem({type: 'separator'}))

    menu.append(new MenuItem({
      label: 'Download',
      click: () => {
        downloadItem(directory.get('id'))
      }
    }))

    menu.append(new MenuItem({type: 'separator'}))

    menu.append(new MenuItem({
      label: 'Delete',
      click: () => {
        deleteItem(directory.get('id'))
      }
    }))

    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  }
  render () {
    const {directory, depth, className, count, connectDropTarget, connectDragSource} = this.props
    let countDisplay = count
    if (count === 0) {
      countDisplay = ''
    } else if (count > 99) {
      countDisplay = '*'
    }
    return (
      connectDropTarget(connectDragSource(
        <div className={className}>
          <div className='tree-row' style={{paddingLeft: (24 * depth) + 8 + 'px'}} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick} onContextMenu={this.handleContext}>
            <i className='tree-icon icon' data-count={countDisplay}>file_directory</i>
            {directory.get('name')}
          </div>
        </div>
      ))
    )
  }
}

const DraggableOverviewItem = DropTarget('TREE_ITEM', {
  drop (props, monitor, component) {
    if (monitor.didDrop()) {
      return
    }
    const item = monitor.getItem()
    let sourceId = item.id
    let destinationId = props.directory.get('id')
    props.moveItem(sourceId, destinationId)
  }
}, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget()
}))(
  DragSource('TREE_ITEM', {
    beginDrag (props) {
      return {
        id: props.directory.get('id')
      }
    }
  }, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))(OverviewItem)
)

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
      'downloadItem',
      'moveItem',
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

  isFocusedItem = (item) => item.get('id') === this.state.focusedItem

  handleKeyDown = (event) => {
    const { focusedItem } = this.state
    const { profileId, deleteItem, copyItemToClipboard, groupedDirectories } = this.props
    if (groupedDirectories && groupedDirectories.size) {
      const items = List(this.getOrderedItems(groupedDirectories))
      if (focusedItem) {
        const currentIndex = items.findIndex(this.isFocusedItem)
        if (currentIndex > -1) {
          switch (event.keyCode) {
            case 13: // Enter
              this.selectItem(items.find(this.isFocusedItem))
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

  handleMoveItem = (itemId, destinationId) => {
    const {profileId} = this.props
    this.props.moveItem(profileId, itemId, destinationId)
  }

  traverseDirectories = (id, depth = 0) => {
    const {successorCount, deleteItem, downloadItem, groupedDirectories, selectedDirectoryId} = this.props
    const children = groupedDirectories.get(id)
    if (!children) {
      return
    }
    let items = []
    for (let directory of children.values()) {
      let classes = 'tree-item'
      if (directory.get('id') === selectedDirectoryId) {
        classes += ' selected'
      }
      if (directory.get('id') === this.state.focusedItem) {
        classes += ' focused'
      }
      items.push(
        <DraggableOverviewItem key={directory.get('id')} className={classes} directory={directory} depth={depth} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick} count={successorCount.getIn([directory.get('id'), 'childTextures']) || 0} deleteItem={deleteItem} downloadItem={downloadItem} moveItem={this.handleMoveItem} />
      )
      let children = this.traverseDirectories(directory.get('id'), depth + 1)
      if (children) {
        items.push(...children)
      }
    }
    return items
  }

  render () {
    const { groupedDirectories } = this.props
    let items = []
    if (groupedDirectories) {
      items = items.concat(this.traverseDirectories(null))
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
