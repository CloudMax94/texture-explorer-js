import React from 'react'

import ImmutablePureComponent from '../ImmutablePureComponent'

class Finder extends ImmutablePureComponent {
  static dependencies = {
    actions: [],
    state: []
  }
  render () {
    return <span className='disabled-text'>Coming Soon</span>
  }
}

export default Finder
