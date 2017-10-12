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
    window.removeEventListener('mouseup', this.handleMouseMove)
    window.removeEventListener('mousemove', this.handleMouseMove)
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
    this.startSize = this.props.size

    window.addEventListener('mousemove', this.handleMouseMove, false)
  }

  render () {
    return (
      <div ref='handle' className='tree-handle' onMouseDown={this.handleMouseDown} />
    )
  }
}

class TreeHeader extends ImmutablePureComponent {
  render () {
    return (
      <div className='tree-header' style={this.props.style}>
        {this.props.columns.map((col, i) => {
          const style = {width: this.props.sizes.get(i) + 'px'}
          return (
            <div key={i} className='tree-header-col' style={style}>
              {col}
              <TreeHandle index={i} size={this.props.sizes.get(i)} setTreeSize={this.props.setTreeSize} />
            </div>
          )
        })}
      </div>
    )
  }
}

export default TreeHeader
