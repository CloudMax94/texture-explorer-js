import React from 'react'

import { uniqueId } from 'lodash'
import VirtualList from 'react-virtual-list'

import ImmutablePureComponent from './ImmutablePureComponent.jsx'
import TreeItem from './TreeItem.jsx'
import TreeHeader from './TreeHeader.jsx'

const ItemHeight = 20

const columnNames = ['File', 'Offset', 'Start', 'End', 'Size', 'Format', 'Width', 'Height', 'Palette Address']

const VirtualTreeView = ({
  virtual,
  handleFocus,
  handleDoubleClick,
  focusedItem
}) => {
  return (
    <div style={virtual.style}>
      {virtual.items.map(item => {
        return (
          <TreeItem
            key={item.get('id')}
            item={item}
            focused={item.get('id') === focusedItem}
            handleFocus={handleFocus}
            handleDoubleClick={handleDoubleClick}
          />
        )
      })}
    </div>
  )
}

class TreeView extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.state = {
      focusedItem: null
    }
  }
  componentWillMount () {
    this.id = uniqueId('workspace_content_')
  }
  componentDidMount () {
    this.VirtualList = VirtualList({
      container: this.scrollContainer
    })(VirtualTreeView)
  }
  componentWillReceiveProps (nextProps) {
    if (this.props.directory !== nextProps.directory) {
      this.setState({focusedItem: null})
    }
  }
  componentWillUpdate (nextProps, nextState) {
    if (this.props.directory !== nextProps.directory) {
      // We scroll to top when directory changes
      this.scrollContainer.scrollTop = 0
    } else if (this.state.focusedItem !== nextState.focusedItem && nextState.focusedItem) {
      // When focused item changes, scroll the new one into view
      let index = nextProps.items.findIndex((item) => item.get('id') === nextState.focusedItem)
      if (index > -1) {
        let position = ItemHeight * index
        let { scrollTop, offsetHeight } = this.scrollContainer
        if (position < scrollTop) {
          this.scrollContainer.scrollTop = position
        } else if (position > scrollTop + offsetHeight - ItemHeight) {
          this.scrollContainer.scrollTop = position - offsetHeight + ItemHeight
        }
      }
    }
  }
  focusItem = (item) => {
    this.setState({focusedItem: item.get('id')})
  }
  selectItem = (item) => {
    if (item.get('type') === 'directory') {
      this.props.setCurrentDirectory(item)
    } else if (item.get('type') === 'texture') {
      this.props.setCurrentTexture(item)
    }
  }
  handleKeyDown = (event) => {
    const { focusedItem } = this.state
    const { items } = this.props
    if (items && focusedItem) {
      const currentIndex = items.findIndex((item) => item.get('id') === focusedItem)
      if (currentIndex > -1) {
        switch (event.keyCode) {
          case 13: // Enter
            this.selectItem(items.find((item) => item.get('id') === focusedItem))
            break
          case 38: // Up Arrow
            if (currentIndex > 0) {
              this.setState({focusedItem: items.getIn([currentIndex - 1, 'id'])})
            }
            break
          case 40: // Down Arrow
            if (currentIndex < items.size - 1) {
              this.setState({focusedItem: items.getIn([currentIndex + 1, 'id'])})
            }
            break
          case 46: // Delete
            if (items.size > 1) {
              if (currentIndex < items.size - 1) {
                this.setState({focusedItem: items.getIn([currentIndex + 1, 'id'])})
              } else {
                this.setState({focusedItem: items.getIn([items.size, 'id'])})
              }
            } else {
              this.setState({focusedItem: null})
            }
            this.props.deleteItem(focusedItem)
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
      case 40: // Down Arrow
        event.preventDefault()
        this.setState({focusedItem: items.getIn([0, 'id'])})
        break
    }
  }
  render () {
    let style = ''
    this.props.sizes.forEach((item, i) => {
      style += `#${this.id} .tree-col:nth-child(${i + 1}) {width: ${item}px}`
    })
    return (
      <div className='tree-view' id={this.id}>
        <style>{style}</style>
        <TreeHeader
          sizes={this.props.sizes}
          columns={columnNames}
          setTreeSize={this.props.setTreeSize}
        />
        <div className='tree-content' tabIndex='0' onKeyDown={this.handleKeyDown} ref={(scrollContainer) => { this.scrollContainer = scrollContainer }}>
          {this.props.items ? <this.VirtualList
            items={this.props.items.toArray()}
            itemHeight={ItemHeight}
            handleFocus={this.focusItem}
            handleDoubleClick={this.selectItem}
            focusedItem={this.state.focusedItem}
          /> : null}
        </div>
      </div>
    )
  }
}

export default TreeView
