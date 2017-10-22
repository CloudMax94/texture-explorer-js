import React from 'react'
import Menu from './Menu'

import ImmutablePureComponent from './ImmutablePureComponent'

class ApplicationMenu extends ImmutablePureComponent {
  render () {
    return (
      <div className='application-menu'>
        {this.props.menu ? <Menu menu={this.props.menu} primary /> : null}
      </div>
    )
  }
}

export default ApplicationMenu
