import React from 'react'
import Menu from './Menu.jsx'

import ImmutablePureComponent from './ImmutablePureComponent.jsx'

class ApplicationMenu extends ImmutablePureComponent {
  render () {
    if (!this.props.menu) {
      return null
    }
    return (
      <div className='application-menu'>
        <Menu data={this.props.menu} />
      </div>
    )
  }
}

export default ApplicationMenu
