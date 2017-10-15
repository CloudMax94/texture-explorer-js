import React from 'react'

import { remote } from 'electron'

import ImmutablePureComponent from './ImmutablePureComponent'

const { MenuItem, Menu } = remote

class PanelGroup extends ImmutablePureComponent {
  setCurrentPanel (panelId) {
    this.props.setCurrentPanel(this.props.panelGroupId, panelId)
  }

  handleGroupContext = (event) => {
    event.preventDefault()
    const menu = new Menu()

    menu.append(new MenuItem({
      label: 'Move Group to Top Dock',
      click: () => {
        this.props.movePanelGroupToDock(this.props.panelGroupId, 0)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Left Dock',
      click: () => {
        this.props.movePanelGroupToDock(this.props.panelGroupId, 1)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Right Dock',
      click: () => {
        this.props.movePanelGroupToDock(this.props.panelGroupId, 2)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Bottom Dock',
      click: () => {
        this.props.movePanelGroupToDock(this.props.panelGroupId, 3)
      }
    }))

    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  }

  handleTabContext (panelId, event) {
    event.preventDefault()
    event.stopPropagation()
    const menu = new Menu()

    menu.append(new MenuItem({
      label: 'Move Pane to Top Dock',
      click: () => {
        this.props.movePanelToDock(panelId, 0)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Pane to Left Dock',
      click: () => {
        this.props.movePanelToDock(panelId, 1)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Pane to Right Dock',
      click: () => {
        this.props.movePanelToDock(panelId, 2)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Pane to Bottom Dock',
      click: () => {
        this.props.movePanelToDock(panelId, 3)
      }
    }))

    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  }

  render () {
    const { panels, currentPanel } = this.props
    const panel = this.props.children
    return (
      <div className='panel'>
        <div className='panel-header' onContextMenu={this.handleGroupContext}>
          {panels.map((panelName, panelId) => {
            let classes = 'panel-tab'
            if (currentPanel === panelId) {
              classes += ' selected'
            }
            return <div key={panelId} className={classes} onClick={this.setCurrentPanel.bind(this, panelId)} onContextMenu={this.handleTabContext.bind(this, panelId)}>{panelName}</div>
          }).toList()}
        </div>
        <div className='panel-content'>
          <div className={'panel-item'}>{panel}</div>
        </div>
      </div>
    )
  }
}

export default PanelGroup
