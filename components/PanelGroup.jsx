import React from 'react'

import { remote } from 'electron'

import ImmutablePureComponent from './ImmutablePureComponent.jsx'

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
      label: 'Move Group to Top Container',
      click: () => {
        this.props.movePanelGroupToContainer(this.props.container, this.props.index, 0)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Left Container',
      click: () => {
        this.props.movePanelGroupToContainer(this.props.container, this.props.index, 1)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Right Container',
      click: () => {
        this.props.movePanelGroupToContainer(this.props.container, this.props.index, 2)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Group to Bottom Container',
      click: () => {
        this.props.movePanelGroupToContainer(this.props.container, this.props.index, 3)
      }
    }))

    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  }

  handleTabContext (index, event) {
    event.preventDefault()
    event.stopPropagation()
    const menu = new Menu()

    menu.append(new MenuItem({
      label: 'Move Pane to Top Container',
      click: () => {
        this.props.movePanelToContainer(this.props.container, this.props.index, index, 0)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Pane to Left Container',
      click: () => {
        this.props.movePanelToContainer(this.props.container, this.props.index, index, 1)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Pane to Right Container',
      click: () => {
        this.props.movePanelToContainer(this.props.container, this.props.index, index, 2)
      }
    }))

    menu.append(new MenuItem({
      label: 'Move Pane to Bottom Container',
      click: () => {
        this.props.movePanelToContainer(this.props.container, this.props.index, index, 3)
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
          <div className='panel-tabs'>
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
