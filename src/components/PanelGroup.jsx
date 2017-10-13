import React from 'react'

import { remote } from 'electron'

import ImmutablePureComponent from './ImmutablePureComponent'

const { MenuItem, Menu } = remote

class PanelGroup extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.state = {
      selected: 0
    }
  }

  setCurrentTab (i) {
    this.setState({selected: i})
  }

  handleGroupContext = (event) => {
    event.preventDefault()
    const menu = new Menu()

    menu.append(new MenuItem({
      label: 'Move Group to Top Dock',
      click: () => {
        this.props.movePanelGroupToDock(this.props.dockId, this.props.index, 0)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Left Dock',
      click: () => {
        this.props.movePanelGroupToDock(this.props.dockId, this.props.index, 1)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Right Dock',
      click: () => {
        this.props.movePanelGroupToDock(this.props.dockId, this.props.index, 2)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Bottom Dock',
      click: () => {
        this.props.movePanelGroupToDock(this.props.dockId, this.props.index, 3)
      }
    }))

    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  }

  handleTabContext (index, event) {
    event.preventDefault()
    event.stopPropagation()
    const menu = new Menu()

    menu.append(new MenuItem({
      label: 'Move Pane to Top Dock',
      click: () => {
        this.props.movePanelToDock(this.props.dockId, this.props.index, index, 0)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Pane to Left Dock',
      click: () => {
        this.props.movePanelToDock(this.props.dockId, this.props.index, index, 1)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Pane to Right Dock',
      click: () => {
        this.props.movePanelToDock(this.props.dockId, this.props.index, index, 2)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Pane to Bottom Dock',
      click: () => {
        this.props.movePanelToDock(this.props.dockId, this.props.index, index, 3)
      }
    }))

    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  }

  render () {
    const panels = this.props.children
    if (panels.size < 1) {
      return null
    }
    if (this.state.selected > panels.size) {
      this.setCurrentTab(0)
    }
    return (
      <div className='panel'>
        <div className='panel-header' onContextMenu={this.handleGroupContext}>
          {panels.map((panel, i) => {
            if (this.state.selected === null || this.state.selected > panels.size) {
              this.state.selected = i
            }
            let classes = 'panel-tab'
            if (this.state.selected === i) {
              classes += ' selected'
            }
            return <div key={i} index={i} className={classes} onClick={this.setCurrentTab.bind(this, i)} onContextMenu={this.handleTabContext.bind(this, i)}>{panel.key}</div>
          })}
        </div>
        <div className='panel-content'>
          {panels.map((panel, i) => {
            const style = {}
            if (this.state.selected !== i) {
              style.display = 'none'
            }
            return (
              <div className={'panel-item'} key={i} style={style}>{panel}</div>
            )
          })}
        </div>
      </div>
    )
  }
}

export default PanelGroup
