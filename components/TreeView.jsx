import React from 'react'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { uniqueId } from 'lodash'
import VirtualList from 'react-virtual-list'
import { setCurrentDirectory, setCurrentTexture } from '../actions/workspace'

import TreeItem from './TreeItem.jsx'
import TreeHeader from './TreeHeader.jsx'

const VirtualTreeView = ({
  virtual,
  itemHeight,
  handleFocus,
  handleDoubleClick,
  focusedItem,
  scrollContainer
}) => (
  <div style={virtual.style}>
    {virtual.items.map(item => {
      return (
        <TreeItem
          key={item.get('id')}
          item={item}
          focused={item.get('id') === focusedItem}
          handleFocus={handleFocus}
          handleDoubleClick={handleDoubleClick}
          scrollContainer={scrollContainer}
        />
      )
    })}
  </div>
)

class TreeView extends React.Component {
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
    if (focusedItem) {
      let currentIndex
      switch (event.keyCode) {
        case 13: // Enter
          event.preventDefault()
          this.selectItem(items.find((item) => item.get('id') === focusedItem))
          break
        case 38: // Up Arrow
          event.preventDefault()
          currentIndex = items.findIndex((item) => item.get('id') === focusedItem)
          if (currentIndex > 0) {
            this.setState({focusedItem: items.getIn([currentIndex - 1, 'id'])})
          }
          break
        case 40: // Down Arrow
          event.preventDefault()
          currentIndex = items.findIndex((item) => item.get('id') === focusedItem)
          if (currentIndex < items.size - 1) {
            this.setState({focusedItem: items.getIn([currentIndex + 1, 'id'])})
          }
          break
      }
    } else {
      switch (event.keyCode) {
        case 38: // Up Arrow
        case 40: // Down Arrow
          this.setState({focusedItem: items.getIn([0, 'id'])})
          break
      }
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
        <TreeHeader sizes={this.props.sizes} columns={['File', 'Offset', 'Start', 'End', 'Size', 'Format', 'Width', 'Height', 'Palette Address']} />
        <div className='tree-content' tabIndex='0' onKeyDown={this.handleKeyDown} ref={(scrollContainer) => { this.scrollContainer = scrollContainer }}>
          {this.props.items ? <this.VirtualList
            items={this.props.items.toArray()}
            itemHeight={20}
            itemBuffer={1} // We have a buffer for the scrollIntoView code on <TreeItem />
            handleFocus={this.focusItem}
            handleDoubleClick={this.selectItem}
            focusedItem={this.state.focusedItem}
            scrollContainer={this.scrollContainer}
          /> : null}
        </div>
      </div>
    )
  }
}

function mapStateToProps (state, ownProps) {
  return {}
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({setCurrentDirectory, setCurrentTexture}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(TreeView)
