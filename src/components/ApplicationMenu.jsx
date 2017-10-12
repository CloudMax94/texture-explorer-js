import React from 'react'
import Menu from './Menu'

import ImmutablePureComponent from './ImmutablePureComponent'

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
