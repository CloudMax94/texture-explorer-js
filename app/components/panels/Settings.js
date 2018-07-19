import React from 'react'

import ImmutablePureComponent from '../ImmutablePureComponent'

class Settings extends ImmutablePureComponent {
  static dependencies = {
    actions: [
      'setSetting'
    ],
    state: [
      'settings'
    ]
  }

  onDoubleClickChange = (event) => {
    this.props.setSetting('doubleClickSelect', event.target.checked)
  }

  render () {
    const {settings} = this.props
    return <div>
      <div className='inputs'>
        <label className='checkbox-label'><input type='checkbox' checked={settings.get('doubleClickSelect')} onChange={this.onDoubleClickChange} />Double click / Enter to select texture</label>
      </div>
    </div>
  }
}

export default Settings
