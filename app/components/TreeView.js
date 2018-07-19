import React from 'react'

import { uniqueId } from 'lodash'
import VirtualList from 'react-virtual-list'

import ImmutablePureComponent from './ImmutablePureComponent'
import TreeItem from './TreeItem'
import TreeHeader from './TreeHeader'

const ItemHeight = 20

const columnNames = ['File', 'Offset Start', 'Offset End', 'Address Start', 'Address End', 'Size', 'Format', 'Width', 'Height', 'Palette Address']

const VirtualTreeView = ({
  virtual,
  width,
  handleFocus,
  handleDoubleClick,
  focusedItem,
  deleteItem
}) => {
  return (
    <div style={{...virtual.style, minWidth: width + 'px', minHeight: '100%'}}>
      {virtual.items.map(item => {
        return (
          <TreeItem
            key={item.get('id')}
            item={item}
            focused={item.get('id') === focusedItem}
            handleFocus={handleFocus}
            handleDoubleClick={handleDoubleClick}
            deleteItem={deleteItem}
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
      horizontalScroll: 0,
      focusedItem: null
    }
    this.scrollContainer = React.createRef()
  }
  componentWillMount () {
    this.id = uniqueId('workspace_content_')
  }
  componentDidMount () {
    this.VirtualList = VirtualList({
      container: this.scrollContainer.current
    })(VirtualTreeView)
    this.setState({
      VirtualList: true
    })
    document.addEventListener('paste', this.handlePaste)
  }
  componentWillUnmount () {
    document.removeEventListener('paste', this.handlePaste)
  }
  componentWillReceiveProps (nextProps) {
    if (this.props.directoryId !== nextProps.directoryId) {
      this.setState({focusedItem: null})
    }
    if (this.props.textureId !== nextProps.textureId) {
      // If selected texture has changed, focus it
      this.setState({focusedItem: nextProps.textureId})
    }
  }
  componentWillUpdate (nextProps, nextState) {
    const scrollContainer = this.scrollContainer.current
    if (this.props.directoryId !== nextProps.directoryId) {
      // We scroll to top when directory changes
      scrollContainer.scrollTop = 0
    } else if (this.state.focusedItem !== nextState.focusedItem && nextState.focusedItem) {
      // When focused item changes, scroll the new one into view
      let index = nextProps.items.findIndex((item) => item.get('id') === nextState.focusedItem)
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
  focusItem = (item) => {
    this.setState({focusedItem: item.get('id')})
    if (item.get('type') === 'texture' && !this.props.doubleClickSelect) {
      this.selectItem(item)
    }
  }
  selectItem = (item) => {
    if (item.get('type') === 'directory') {
      this.props.setCurrentDirectory(item)
    } else if (item.get('type') === 'texture') {
      this.props.setCurrentTexture(item)
    }
  }
  handleScroll = (event) => {
    this.setState({horizontalScroll: event.target.scrollLeft})
  }
  handleKeyDown = (event) => {
    const { focusedItem } = this.state
    const { items } = this.props
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
              this.props.deleteItem(focusedItem)
              break
            case 67: // C
              if (event.ctrlKey) {
                this.props.copyItemToClipboard(this.props.profileId, focusedItem)
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
  handlePaste = (event) => {
    var clipboardData, pastedData
    // paste is attached to document, so we need to make sure that this element is focused
    if (document.activeElement === this.scrollContainer.current) {
      clipboardData = event.clipboardData || window.clipboardData
      pastedData = clipboardData.getData('Text')
      try {
        var itemObject = JSON.parse(pastedData)
        if ('type' in itemObject) {
          let type = itemObject.type
          if (type === 'texture' || type === 'directory') {
            this.props.addItemObject(this.props.profileId, itemObject, this.props.directoryId)
            event.preventDefault()
          }
        }
      } catch (err) {
      }
    }
  }
  render () {
    let style = ''
    this.props.sizes.forEach((item, i) => {
      style += `#${this.id} .tree-col:nth-child(${i + 1}) {width: ${item}px}`
    })
    let width = this.props.sizes.reduce((a, b) => a + b, 0)
    return (
      <div className='tree-view' id={this.id}>
        <style>{style}</style>
        <TreeHeader
          style={{marginLeft: -this.state.horizontalScroll + 'px'}}
          sizes={this.props.sizes}
          columns={columnNames}
          setTreeSize={this.props.setTreeSize}
        />
        <div className='tree-content' tabIndex='0' onScroll={this.handleScroll} onKeyDown={this.handleKeyDown} ref={this.scrollContainer}>
          {this.state.VirtualList ? <this.VirtualList
            width={width}
            items={this.props.items ? this.props.items.toArray() : []}
            itemHeight={ItemHeight}
            handleFocus={this.focusItem}
            handleDoubleClick={this.selectItem}
            focusedItem={this.state.focusedItem}
            deleteItem={this.props.deleteItem}
          /> : null}
        </div>
      </div>
    )
  }
}

export default TreeView
