import React from 'react'

import TreeItem from './TreeItem.jsx'
import TreeHeader from './TreeHeader.jsx'

class TreeView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      focusedItem: null
    }
  }
  focusItem = (item) => {
    this.setState({focusedItem: item.get('id')})
  }
  render () {
    let children = null
    if (this.props.items) {
      children = this.props.items.map((item, i) => {
        let className = ''
        if (i === this.state.focusedItem) {
          className = 'focused'
        }
        return (
          <TreeItem
            key={i}
            item={item}
            className={className}
            handleFocus={this.focusItem}
            sizes={this.props.sizes}
          />
        )
      }).toArray()
    }

    return (
      <div className='tree-view'>
        <TreeHeader sizes={this.props.sizes} columns={['File', 'Offset', 'Start', 'End', 'Size', 'Format', 'Width', 'Height', 'Palette Address']} />
        <div className='tree-content' tabIndex='0'>
          {children}
        </div>
      </div>
    )
  }
}

export default TreeView
