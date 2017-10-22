import React from 'react'
import { acceleratorToText } from '../lib/accelerator'

class Menu extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      navigating: false,
      activeMenu: null
    }
  }

  componentDidMount () {
    /*
    document.addEventListener('keydown', this.handleNavigation)

    document.addEventListener('keydown', this.checkForAltKey)
    document.addEventListener('keyup', this.checkForAltKey)
    document.addEventListener('mousedown', this.checkForAltKey)
    */
  }

  componentWillUnmount () {
    /*
    document.removeEventListener('keydown', this.handleNavigation)

    document.removeEventListener('keydown', this.checkForAltKey)
    document.removeEventListener('keyup', this.checkForAltKey)
    document.removeEventListener('mousedown', this.checkForAltKey)
    */
  }

  checkForAltKey = (event) => {
    if (this.props.primary) {
      if (!event.altKey && this.state.navigating && !this.state.activeMenu) {
        // If alt key no longer pressed, cancel navigation!
        this.setState({
          navigating: false
        })
      }
    }
  }

  handleNavigation = (event) => {
    if (this.props.primary) {
      if (!this.state.navigating && event.which === 18) {
        event.preventDefault()
        this.setState({navigating: true})
      } else if (this.state.navigating || this.state.activeMenu) {
        event.preventDefault()

        if (event.which === 27) { // Escape
          this.setState({
            navigating: false,
            activeMenu: null,
            activeItem: null
          })
        } else if (event.which === 38) { // Up Arrow
          let index = (this.state.activeItem || 0) - 1
          if (index < 0) {
            index = this.state.activeMenu.items.length - 1
          }
          this.setState({
            activeItem: index
          })
        } else if (event.which === 40) { // Down Arrow

        } else if (event.which === 37) { // Left Arrow
          let newMenu = this.state.activeMenu
          this.props.menu.items.some((item, i) => {
            if (item.submenu === this.state.activeMenu) {
              let index = i - 1
              if (index === -1) {
                index = this.props.menu.items.length - 1
              }
              newMenu = this.props.menu.items[index].submenu
              return true
            }
          })
          this.setState({
            activeMenu: newMenu,
            activeItem: null
          })
        } else if (event.which === 39) { // Right Arrow
          let newMenu = this.state.activeMenu
          this.props.menu.items.some((item, i) => {
            if (item.submenu === this.state.activeMenu) {
              let index = i + 1
              if (index === this.props.menu.items.length) {
                index = 0
              }
              newMenu = this.props.menu.items[index].submenu
              return true
            }
          })
          this.setState({
            activeMenu: newMenu,
            activeItem: null
          })
        } else {
          let items = this.props.menu.items
          if (this.state.activeMenu) {
            items = this.state.activeMenu.items
          }
          this.props.menu.items.some((item) => {
            let label = item.label.replace(/&&/g, '&')
            let index = label.indexOf('&')
            if (index >= 0) {
              let accessKey = label.substr(index + 1, 1).charCodeAt(0)
              if (event.which === accessKey) {
                this.setState({activeMenu: item.submenu})
                return true
              }
            }
          })
        }
      }
    }
  }

  handleClick (item) {
    if (item.enabled && item.click) {
      item.click()
    }
  }

  renderItem (item, key) {
    if (item.type === 'separator') {
      return (
        <div key={key} className='menu-separator' />
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
        <Menu menu={item.submenu} />
      )
    }

    if (this.state.activeMenu === item.submenu) {
      classes.push('active-menu')
    }

    let accessKey
    let label = item.label.replace(/&&/g, '&')
    let index = label.indexOf('&')
    if (index >= 0) {
      let character = label.substr(index + 1, 1)
      accessKey = character.charCodeAt(0)
      label = [
        label.substr(0, index),
        <span key='access-key' className='menu-access-key'>{character}</span>,
        label.substr(index + 2)
      ]
    }

    return (
      <div key={key}
        className={classes.join(' ')}
        data-accelerator={acceleratorToText(item.accelerator)}
        onClick={this.handleClick.bind(this, item)}
      >
        <span>{label}</span>
        {subMenu}
      </div>
    )
  }

  render () {
    if (!this.props.menu) {
      return null
    }
    const menuItems = this.props.menu.items.map((item, i) => {
      return this.renderItem(item, i)
    })

    const classes = [
      'menu'
    ]

    if (this.state.navigating) {
      classes.push('menu-navigating')
    }

    return (
      <div className={classes.join(' ')}>
        {menuItems}
      </div>
    )
  }
}

export default Menu
