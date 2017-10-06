import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Immutable from 'immutable'
import { throttle } from 'lodash'
import { setTreeSize } from '../actions/interface'

class TreeHandle extends React.Component {
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

function mapStateToProps (state) {
  return {}
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({setTreeSize}, dispatch)
}

const ConnectedTreeHandle = connect(mapStateToProps, mapDispatchToProps)(TreeHandle)

class TreeHeader extends React.Component {
  shouldComponentUpdate (nextProps) {
    return this.props.columns !== nextProps.columns ||
      !Immutable.is(this.props.sizes, nextProps.sizes)
  }

  render () {
    return (
      <div className='tree-header'>
        {this.props.columns.map((col, i) => {
          const style = {width: this.props.sizes.get(i) + 'px'}
          return (
            <div key={i} className='tree-header-col' style={style}>
              {col}
              <ConnectedTreeHandle index={i} size={this.props.sizes.get(i)} />
            </div>
          )
        })}
      </div>
    )
  }
}

export default TreeHeader
