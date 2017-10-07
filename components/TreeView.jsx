import React from 'react'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { uniqueId } from 'lodash'
import { setCurrentDirectory, setCurrentTexture } from '../actions/workspace'

import TreeItem from './TreeItem.jsx'
import TreeHeader from './TreeHeader.jsx'

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
    let children = null
    if (this.props.items) {
      children = this.props.items.map((item, i) => {
        return (
          <TreeItem
            key={item.get('id')}
            item={item}
            focused={item.get('id') === this.state.focusedItem}
            handleFocus={this.focusItem}
            handleDoubleClick={this.selectItem}
          />
        )
      }).toArray()
    }

    let style = ''
    this.props.sizes.forEach((item, i) => {
      style += `#${this.id} .tree-col:nth-child(${i + 1}) {
        width: ${item}px;
      }`
    })

    return (
      <div className='tree-view' id={this.id}>
        <style>{style}</style>
        <TreeHeader sizes={this.props.sizes} columns={['File', 'Offset', 'Start', 'End', 'Size', 'Format', 'Width', 'Height', 'Palette Address']} />
        <div className='tree-content' tabIndex='0' onKeyDown={this.handleKeyDown}>
          {children}
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
