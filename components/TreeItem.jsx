import React from 'react'
import { padStart } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setCurrentDirectory, setCurrentTexture } from '../actions/workspace'
import textureManipulator from '../lib/textureManipulator'
import ImmutablePureComponent from './ImmutablePureComponent.jsx'

class TreeItem extends ImmutablePureComponent {
  handleDoubleClick = (event) => {
    event.preventDefault()
    const item = this.props.item
    if (item.get('type') === 'directory') {
      this.props.setCurrentDirectory(item)
    } else if (item.get('type') === 'texture') {
      this.props.setCurrentTexture(item)
    }
  }

  handleClick = (event) => {
    event.preventDefault()
    this.props.handleFocus(this.props.item)
  }

  render () {
    const item = this.props.item
    const columns = [
      item.get('name')
    ]
    columns.push(...[
      '0x' + padStart(this.props.offset.toString(16), 8, 0).toUpperCase(), // should be relative!
      '0x' + padStart(item.get('address').toString(16), 8, 0).toUpperCase()
    ])
    if (item.get('type') === 'texture') {
      const size = item.get('width') * item.get('height') * textureManipulator.getFormat(item.get('format')).sizeModifier()
      columns.push(...[
        '0x' + padStart((item.get('address') + size).toString(16), 8, 0).toUpperCase(),
        '0x' + padStart(size.toString(16), 6, 0).toUpperCase(),
        item.get('format'),
        item.get('width'),
        item.get('height')
      ])
      if (textureManipulator.getFormat(item.get('format')).hasPalette()) {
        columns.push('0x' + padStart(item.get('palette').toString(16), 8, 0).toUpperCase())
      }
    } else if (item.get('type') === 'directory') {
      columns.push(...[
        '0x' + padStart((item.get('address') + item.get('length')).toString(16), 8, 0).toUpperCase(),
        '0x' + padStart(item.get('length').toString(16), 6, 0).toUpperCase()
      ])
    }
    const classes = 'tree-item ' + this.props.className
    return (
      <div className={classes}>
        {columns.map((data, i) => {
          let icon = null
          const style = {}
          if (this.props.sizes) {
            style.width = this.props.sizes.get(i) + 'px'
          }
          if (i === 0) {
            if (item.get('type') === 'directory') {
              icon = <i className='tree-icon icon'>file_directory</i>
            } else if (item.get('type') === 'texture') {
              if (item.get('blob')) {
                icon = <i className='tree-icon' style={{backgroundImage: 'url(' + item.get('blob') + ')'}}>&nbsp;</i>
              } else {
                icon = <i className='tree-icon icon'>file_media</i>
              }
            }
          }
          return (
            <div key={i} className='tree-col' style={style} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick}>{icon}{data}</div>
          )
        })}
      </div>
    )
  }
}

function mapStateToProps (state, ownProps) {
  let workspace = state.workspace.getIn(['workspaces', state.workspace.get('currentWorkspace')])
  let parentAddress = workspace.getIn(['items', ownProps.item.get('parentId'), 'address'])
  let offset = ownProps.item.get('address') - parentAddress
  return {
    offset
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({setCurrentDirectory, setCurrentTexture}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(TreeItem)
