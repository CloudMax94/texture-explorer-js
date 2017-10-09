import React from 'react'
import ReactDOM from 'react-dom'
import { throttle } from 'lodash'

import ImmutablePureComponent from './ImmutablePureComponent.jsx'

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
    const ele = ReactDOM.findDOMNode(this.refs.handle)
    const direction = window.getComputedStyle(ele.parentElement).getPropertyValue('flex-direction')

    let offset = 0
    if (direction === 'column') {
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
    const ele = ReactDOM.findDOMNode(this.refs.handle)
    const direction = window.getComputedStyle(ele.parentElement).getPropertyValue('flex-direction')
    if (direction === 'column') {
      this.startPos = event.clientY
    } else {
      this.startPos = event.clientX
    }
    this.startSize = this.props.size

    window.addEventListener('mousemove', this.handleMouseMove, false)
  }

  render () {
    return (
      <div ref='handle' className='handle'>
        <div className='handle-inner' onMouseDown={this.handleMouseDown} />
      </div>
    )
  }
}

export default Handle
