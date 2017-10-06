import React from 'react'
import { acceleratorToText } from '../lib/accelerator'

class Menu extends React.Component {
  handleClick (item) {
    if (item.click) {
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

    let subMenu = null
    if (item.submenu) {
      classes.push('parent')
      subMenu = (
        <Menu data={item.submenu} />
      )
    }
    return (
      <div key={key} className={classes.join(' ')} data-accelerator={acceleratorToText(item.accelerator)} onClick={this.handleClick.bind(this, item)}>
        {item.label}
        {subMenu}
      </div>
    )
  }

  render () {
    if (!this.props.data) {
      return null
    }
    const menuItems = this.props.data.items.map((item, i) => {
      return this.renderItem(item, i)
    })
    return (
      <div className='menu'>
        {menuItems}
      </div>
    )
  }
}

export default Menu
