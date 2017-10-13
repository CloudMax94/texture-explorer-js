import React from 'react'
import Menu from './Menu'

import ImmutablePureComponent from './ImmutablePureComponent'

class ApplicationMenu extends ImmutablePureComponent {
  render () {
    return (
      <div className='application-menu'>
        {this.props.menu ? <Menu data={this.props.menu} /> : null}
      </div>
    )
  }
}

export default ApplicationMenu
