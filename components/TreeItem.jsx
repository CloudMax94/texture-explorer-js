import React from 'react'
import { padStart } from 'lodash'
import { connect } from 'react-redux'
import textureManipulator from '../lib/textureManipulator'
import ImmutablePureComponent from './ImmutablePureComponent.jsx'

class TreeItem extends ImmutablePureComponent {
  handleDoubleClick = (event) => {
    event.preventDefault()
    this.props.handleDoubleClick(this.props.item)
  }

  handleClick = (event) => {
    event.preventDefault()
    this.props.handleFocus(this.props.item)
  }

  render () {
    const { item, offset, focused } = this.props
    const columns = [
      item.get('name')
    ]
    columns.push(...[
      (offset < 0 ? '-' : '') + '0x' + padStart(Math.abs(offset).toString(16), 8, 0).toUpperCase(),
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
    const classes = 'tree-item ' + (focused ? 'focused' : '')
    return (
      <div className={classes} ref={(ele) => { this.ele = ele }}>
        {columns.map((data, i) => {
          let icon = null
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
            <div key={i} className='tree-col' onClick={this.handleClick} onDoubleClick={this.handleDoubleClick}>{icon}{data}</div>
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

export default connect(mapStateToProps)(TreeItem)
