import React from 'react'
import { throttle } from 'lodash'

import ImmutablePureComponent from './ImmutablePureComponent'

class TreeHandle extends ImmutablePureComponent {
  componentWillMount () {
    this.handleMouseMove = throttle(this.handleMouseMove, 30)
  }

  componentDidMount () {
    window.addEventListener('mouseup', this.handleMouseUp)
  }

  componentWillUnmount () {
    window.removeEventListener('mouseup', this.handleMouseUp)
    window.removeEventListener('mousemove', this.handleMouseMove, false)
  }

  handleMouseMove = (event) => {
    const diff = event.clientX - this.startPos
    const newSize = this.startSize + diff
    this.props.setTreeSize(this.props.index, newSize)
  }

  handleMouseUp = (event) => {
    window.removeEventListener('mousemove', this.handleMouseMove, false)
  }

  handleMouseDown = (event) => {
    this.startPos = event.clientX
    this.startSize = this.props.size || 0

    window.addEventListener('mousemove', this.handleMouseMove, false)
  }

  render () {
    return (
      <div ref='handle' className='tree-handle' onMouseDown={this.handleMouseDown} />
    )
  }
}

class TreeHeader extends ImmutablePureComponent {
  renderColumn = (col, i) => {
    const size = Math.max(50, this.props.sizes.get(i) || 0)
    const style = {width: size + 'px'}
    return (
      <div key={i} className='tree-header-col' style={style}>
        {col}
        <TreeHandle index={i} size={size} setTreeSize={this.props.setTreeSize} />
      </div>
    )
  }
  render () {
    return (
      <div className='tree-header' style={this.props.style}>
        {this.props.columns.map(this.renderColumn)}
      </div>
    )
  }
}

export default TreeHeader
