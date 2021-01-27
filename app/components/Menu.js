import React from 'react'
import { acceleratorToText } from '../utils/accelerator'

class MenuItem extends React.Component {
  handleClick = (event) => {
    this.props.onClick(this.props.item)
    event.preventDefault()
    event.stopPropagation()
  }

  handleMouseEnter = () => {
    this.props.onHover(this.props.item)
  }

  render () {
    const {item, active, onClose} = this.props
    if (item.type === 'separator') {
      return (
        <div className='menu-separator' onMouseEnter={this.handleMouseEnter} />
      )
    }

    const classes = [
      'menu-item'
    ]
    if (!item.enabled) {
      classes.push('disabled')
    }
    let subMenu = null
    if (item.submenu) {
      classes.push('parent')
      subMenu = (
        <Menu menu={item.submenu} active={active} onClose={onClose} />
      )
    }

    if (active) {
      classes.push('active-menu')
    }

    let label = item.label.replace(/&&/g, '&')
    let index = label.indexOf('&')
    if (index >= 0) {
      let character = label.substr(index + 1, 1)
      label = [
        label.substr(0, index),
        <span key='access-key' className='menu-access-key'>{character}</span>,
        label.substr(index + 2)
      ]
    }

    return (
      <div
        className={classes.join(' ')}
        data-accelerator={acceleratorToText(item.accelerator)}
        onClick={this.handleClick} onMouseEnter={this.handleMouseEnter}
      >
        <span className='menu-item-label'>{label}</span>
        {subMenu}
      </div>
    )
  }
}

class Menu extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      holding: false,
      activeItem: null
    }
  }

  componentDidMount () {
    document.addEventListener('keydown', this.handleNavigation)
    document.addEventListener('keydown', this.checkForAltKey)
    document.addEventListener('keyup', this.checkForAltKey)
    document.addEventListener('mousedown', this.checkForAltKey)
  }

  componentWillReceiveProps (nextProps) {
    if (!nextProps.primary && !nextProps.active && this.props.active) {
      // Not a primary menu, and it is being deactivated, reset active item
      this.setState({activeItem: null})
    }
  }

  componentWillUnmount () {
    document.removeEventListener('keydown', this.handleNavigation)
    document.removeEventListener('keydown', this.checkForAltKey)
    document.removeEventListener('keyup', this.checkForAltKey)
    document.removeEventListener('mousedown', this.checkForAltKey)
  }

  checkForAltKey = (event) => {
    if (this.props.primary) {
      if (!event.altKey && this.state.holding) {
        // If alt key no longer pressed
        this.setState({
          holding: false
        })
      }
    }
  }

  navigateBack = () => {
    let index = this.state.activeItem
    if (index === null) {
      index = 0
    }
    let startIndex = index
    while (true) {
      index--
      if (index === -1) {
        index = this.props.menu.items.length - 1
      }
      if (index === startIndex) {
        if (this.state.activeItem === null) {
          break
        }
        return
      }
      let item = this.props.menu.items[index]
      if (item.enabled === false) {
        continue
      }
      if (item.type !== 'separator') {
        break
      }
    }
    this.setState({
      activeItem: index
    })
  }

  navigateForward = () => {
    let index = this.state.activeItem
    if (index === null) {
      index = this.props.menu.items.length - 1
    }
    let startIndex = index
    while (true) {
      index++
      if (index === this.props.menu.items.length) {
        index = 0
      }
      if (index === startIndex) {
        if (this.state.activeItem === null) {
          break
        }
        return
      }
      let item = this.props.menu.items[index]
      if (item.enabled === false) {
        continue
      }
      if (item.type !== 'separator') {
        break
      }
    }
    this.setState({
      activeItem: index
    })
  }

  handleNavigation = (event) => {
    if (this.props.primary) {
      if (!this.state.holding && event.which === 18) {
        this.setState({holding: true})
        event.preventDefault()
      } else if (this.state.activeItem !== null) {
        switch (event.which) {
          case 27: // Escape
            this.setState({
              activeItem: null
            })
            event.preventDefault()
            break
          case 37: // Left Arrow
            this.navigateBack()
            event.preventDefault()
            break
          case 39: // Right Arrow
            this.navigateForward()
            event.preventDefault()
            break
        }
      }
    } else {
      // Not primary menu
      if (!this.props.active) {
        return
      }
      switch (event.which) {
        case 13: // Enter
          if (this.state.activeItem !== null) {
            this.handleClick(this.props.menu.items[this.state.activeItem])
          }
          event.preventDefault()
          break
        case 38: // Up Arrow
          this.navigateBack()
          event.preventDefault()
          break
        case 40: // Down Arrow
          this.navigateForward()
          event.preventDefault()
          break
      }
    }
    if (this.state.holding || !this.props.primary) {
      // Primary menu can navigate with access keys only when holding
      this.props.menu.items.some((item, i) => {
        if (item.type === 'separator') {
          return
        }
        let label = item.label.replace(/&&/g, '&')
        let index = label.indexOf('&')
        if (index >= 0) {
          let accessKey = label.substr(index + 1, 1).charCodeAt(0)
          if (event.which === accessKey) {
            this.handleClick(item)
            event.preventDefault()
            event.stopPropagation()
            event.stopImmediatePropagation()
          }
        }
      })
    }
  }

  handleClick = (item) => {
    if (this.props.primary) {
      let index = this.props.menu.items.indexOf(item)
      this.setState({
        activeItem: index
      })
    } else if (item.enabled && item.click) {
      if (this.props.onClose) {
        this.props.onClose()
      }
      item.click()
    }
  }

  handleHover = (item) => {
    if (!this.props.primary || this.state.activeItem !== null) {
      if (item.type === 'separator' || item.enabled === false) {
        this.setState({
          activeItem: null
        })
      } else {
        let index = this.props.menu.items.indexOf(item)
        if (this.state.activeItem !== index) {
          this.setState({
            activeItem: index
          })
        }
      }
    }
  }

  handleMouseLeave = () => {
    if (!this.props.primary) {
      this.setState({
        activeItem: null
      })
    }
  }

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose()
    }
    if (this.props.primary) {
      this.setState({
        activeItem: null
      })
    }
  }

  renderItem = (item, i) => (
    <MenuItem key={i} item={item} active={this.state.activeItem === i} onClick={this.handleClick} onHover={this.handleHover} onClose={this.handleClose} />
  )

  render () {
    const {menu} = this.props
    const {holding} = this.state

    if (!menu) {
      return null
    }

    const classes = ['menu']

    if (holding) {
      classes.push('menu-holding')
    }

    return [
      this.props.primary && this.state.activeItem !== null ? <div key='backdrop' className='menu-backdrop' onClick={this.handleClose} /> : null,
      <div key='menu' className={classes.join(' ')} onMouseLeave={this.handleMouseLeave}>
        {menu.items.map(this.renderItem)}
      </div>
    ]
  }
}

export default Menu
