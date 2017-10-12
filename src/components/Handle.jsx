import React from 'react'
import { throttle } from 'lodash'

import ImmutablePureComponent from './ImmutablePureComponent'

class Handle extends ImmutablePureComponent {
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
    let offset = 0
    if (this.props.layoutDirection === 'vertical') {
      offset = event.clientY
    } else {
      offset = event.clientX
    }
    let diff = 0
    if (this.props.reverse !== true) {
      diff = offset - this.startPos
    } else {
      diff = this.startPos - offset
    }
    const newSize = this.startSize + diff
    this.props.onResize(newSize)
  }

  handleMouseUp = (event) => {
    window.removeEventListener('mousemove', this.handleMouseMove, false)
  }

  handleMouseDown = (event) => {
    if (this.props.layoutDirection === 'vertical') {
      this.startPos = event.clientY
    } else {
      this.startPos = event.clientX
    }
    this.startSize = this.props.size

    window.addEventListener('mousemove', this.handleMouseMove, false)
  }

  render () {
    return (
      <div className='handle'>
        <div className='handle-inner' onMouseDown={this.handleMouseDown} />
      </div>
    )
  }
}

export default Handle
