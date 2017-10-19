import React from 'react'
import { findDOMNode } from 'react-dom'
import { DragSource, DropTarget } from 'react-dnd'

import { remote } from 'electron'

import ImmutablePureComponent from './ImmutablePureComponent'

const { MenuItem, Menu } = remote

const tabType = 'tabType'

const tabSource = {
  beginDrag (props) {
    return {
      panelId: props.panelId,
      panelGroupId: props.panelGroupId
    }
  }
}

const tabTarget = {
  canDrop (props, monitor) {
    const item = monitor.getItem()
    return item.panelGroupId !== props.panelGroupId
  },

  drop (props, monitor, component) {
    if (monitor.didDrop()) {
      return
    }
    const item = monitor.getItem()
    props.movePanelToPanelGroup(item.panelId, props.panelGroupId)
  }
}

const groupTarget = {
  canDrop (props, monitor) {
    const item = monitor.getItem()
    return monitor.isOver({ shallow: true }) &&
           (item.panelGroupId !== props.panelGroupId || props.panels.size > 1)
  },

  drop (props, monitor, component) {
    if (monitor.didDrop()) {
      return
    }

    const item = monitor.getItem()

    const rect = findDOMNode(component).getBoundingClientRect()
    const offset = monitor.getClientOffset()
    let pos
    if (props.layoutDirection === 'horizontal') {
      pos = (offset.x - rect.left) / (rect.right - rect.left)
    } else {
      pos = (offset.y - rect.top) / (rect.bottom - rect.top)
    }

    props.movePanelNextToPanelGroup(item.panelId, props.panelGroupId, pos >= 0.5)
  }
}

class PanelTab extends React.Component {
  render () {
    const { className, onClick, onContextMenu, children, connectDragSource } = this.props
    return connectDragSource(<div className={className} onClick={onClick} onContextMenu={onContextMenu}>{children}</div>)
  }
}

const DraggablePanelTab = DragSource(tabType, tabSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))(PanelTab)

class PanelGroup extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.state = {dropAfter: false}
  }

  setCurrentPanel (panelId) {
    this.props.setCurrentPanel(this.props.panelGroupId, panelId)
  }

  handleGroupContext = (event) => {
    const { movePanelGroupToDock, panelGroupId } = this.props
    event.preventDefault()
    const menu = new Menu()

    menu.append(new MenuItem({
      label: 'Move Group to Top Dock',
      click: () => {
        movePanelGroupToDock(panelGroupId, 0)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Left Dock',
      click: () => {
        movePanelGroupToDock(panelGroupId, 1)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Right Dock',
      click: () => {
        movePanelGroupToDock(panelGroupId, 2)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Bottom Dock',
      click: () => {
        movePanelGroupToDock(panelGroupId, 3)
      }
    }))

    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  }

  handleTabContext (panelId, event) {
    const { movePanelToDock } = this.props
    event.preventDefault()
    event.stopPropagation()
    const menu = new Menu()

    menu.append(new MenuItem({
      label: 'Move Panel to Top Dock',
      click: () => {
        movePanelToDock(panelId, 0)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Panel to Left Dock',
      click: () => {
        movePanelToDock(panelId, 1)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Panel to Right Dock',
      click: () => {
        movePanelToDock(panelId, 2)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Panel to Bottom Dock',
      click: () => {
        movePanelToDock(panelId, 3)
      }
    }))

    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  }

  handleDragDirection = (event) => {
    var rect = event.currentTarget.getBoundingClientRect()
    let pos
    if (this.props.layoutDirection === 'horizontal') {
      pos = (event.clientX - rect.left) / (rect.right - rect.left)
    } else {
      pos = (event.clientY - rect.top) / (rect.bottom - rect.top)
    }
    this.setState({dropAfter: pos >= 0.5})
  }

  render () {
    const {
      panels,
      panelGroupId,
      layoutDirection,
      currentPanel,
      connectDropTargetPanel,
      connectDropTargetHeader,
      isOverHeader,
      isOverPanel
    } = this.props
    const panel = this.props.children
    return connectDropTargetPanel(
      <div className='panel' onDragOver={this.handleDragDirection} onDragEnter={this.handleDragDirection}>
        {connectDropTargetHeader(
          <div className='panel-header' onContextMenu={this.handleGroupContext}>
            {panels.map((panelName, panelId) => {
              let classes = 'panel-tab'
              if (currentPanel === panelId) {
                classes += ' selected'
              }
              return <DraggablePanelTab
                key={panelId}
                panelId={panelId}
                panelGroupId={panelGroupId}
                className={classes}
                layoutDirection={layoutDirection}
                onClick={this.setCurrentPanel.bind(this, panelId)}
                onContextMenu={this.handleTabContext.bind(this, panelId)}
              >{panelName}</DraggablePanelTab>
            }).toList()}
            {isOverHeader ? <div className='panel-tab-drop' /> : null}
          </div>
        )}
        <div className='panel-content'>
          <div className={'panel-item'}>{panel}</div>
        </div>
        {isOverPanel ? <div className={
          'panel-drop-highlight' +
          (this.state.dropAfter ? ' panel-drop-after' : '') +
          (layoutDirection === 'vertical' ? ' panel-drop-vertical' : '')
        } /> : null}
      </div>
    )
  }
}

export default DropTarget(tabType, groupTarget, (connect, monitor) => ({
  connectDropTargetPanel: connect.dropTarget(),
  isOverPanel: monitor.isOver({ shallow: true }) && monitor.canDrop()
}))(
  DropTarget(tabType, tabTarget, (connect, monitor) => ({
    connectDropTargetHeader: connect.dropTarget(),
    isOverHeader: monitor.isOver() && monitor.canDrop()
  }))(PanelGroup)
)
