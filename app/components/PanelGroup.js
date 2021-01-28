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
  handleClick = (event) => {
    this.props.onClick(this.props.panelId)
  }

  handleContextMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    this.props.onContextMenu(this.props.panelId, [event.clientX, event.clientY])
  }

  render () {
    const { className, children, connectDragSource, overflown } = this.props
    let style = null
    if (overflown) {
      style = {visibility: 'hidden'}
    }
    return connectDragSource(<div className={className} style={style} onClick={this.handleClick} onContextMenu={this.handleContextMenu}>{children}</div>)
  }
}

const DraggablePanelTab = DragSource(tabType, tabSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))(PanelTab)

class PanelGroup extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.state = {
      dropAfter: false,
      overflow: 0
    }
  }

  componentDidMount () {
    if (window.ResizeObserver) {
      this.observer = new ResizeObserver(entries => {
        let entry = entries[0]
        let header = entry.target
        let end = 0
        let overflow = 0
        for (let tab of header.children) {
          let tabRect = tab.getBoundingClientRect()
          end += tabRect.width
          if (end > entry.contentRect.width) {
            break
          }
          overflow++
        }
        if (this.state.overflow !== overflow) {
          this.setState({overflow})
        }
      })
      this.observer.observe(findDOMNode(this).querySelector('.panel-tabs'))
    } else {
      this.setState({overflow: Infinity})
    }
  }

  componentWillUnmount () {
    if (this.observer) {
      this.observer.disconnect()
    }
  }

  setCurrentPanel = (panelId) => {
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

  handleTabContext = (panelId, position) => {
    const { movePanelToDock, popoutPanel } = this.props
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

    if (['overview'].indexOf(panelId) === -1) {
      menu.append(new MenuItem({type: 'separator'}))
      menu.append(new MenuItem({
        label: 'Pop out Panel',
        click: () => {
          popoutPanel(panelId)
        }
      }))
    }

    menu.popup(remote.getCurrentWindow(), ...position)
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

  renderTab = (label, panelId) => {
    const {panelGroupId, currentPanel, layoutDirection} = this.props
    let classes = 'panel-tab'
    if (currentPanel === panelId) {
      classes += ' selected'
    }
    let index = this.props.panels.keySeq().indexOf(panelId)
    return <DraggablePanelTab
      key={panelId}
      panelId={panelId}
      panelGroupId={panelGroupId}
      className={classes}
      layoutDirection={layoutDirection}
      onClick={this.setCurrentPanel}
      onContextMenu={this.handleTabContext}
      overflown={index >= this.state.overflow}
    >{label}</DraggablePanelTab>
  }

  renderOverflownTab = (label, panelId) => {
    const {panelGroupId, currentPanel, layoutDirection} = this.props
    let classes = 'panel-tab-overflown'
    if (currentPanel === panelId) {
      classes += ' selected'
    }
    return <DraggablePanelTab
      key={panelId}
      panelId={panelId}
      panelGroupId={panelGroupId}
      className={classes}
      layoutDirection={layoutDirection}
      onClick={this.setCurrentPanel}
      onContextMenu={this.handleTabContext}
    >{label}</DraggablePanelTab>
  }

  renderOverflow = () => {
    const {panels, currentPanel} = this.props
    let classes = 'panel-tab-overflow'
    let overflownPanels = panels.slice(this.state.overflow)
    if (overflownPanels.keySeq().find(key => key === currentPanel)) {
      classes += ' selected'
    }
    return (
      <div className={classes}>
        ⋮
        <div className='panel-tab-menu'>
          {overflownPanels.map(this.renderOverflownTab).toList()}
        </div>
      </div>
    )
  }

  render () {
    const {
      panels,
      layoutDirection,
      connectDropTargetPanel,
      connectDropTargetHeader,
      isOverHeader,
      isOverPanel
    } = this.props
    const panel = this.props.children
    const tabsStyle = {}
    if (this.state.overflow === Infinity) {
      tabsStyle.whiteSpace = 'nowrap'
    }
    return connectDropTargetPanel(
      <div className='panel' onDragOver={this.handleDragDirection} onDragEnter={this.handleDragDirection}>
        {connectDropTargetHeader(
          <div className='panel-header' onContextMenu={this.handleGroupContext}>
            <div className='panel-tabs' style={tabsStyle}>
              {panels.map(this.renderTab).toList()}
            </div>
            {isOverHeader ? <div className='panel-tab-drop' /> : null}
            {this.state.overflow < panels.size ? this.renderOverflow() : null}
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
