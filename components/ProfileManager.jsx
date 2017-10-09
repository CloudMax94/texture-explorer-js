import React from 'react'

import ImmutablePureComponent from './ImmutablePureComponent.jsx'

class ProfileManager extends ImmutablePureComponent {
  handleProfileChange = (event) => {
    let profile = event.target.value
    this.props.setProfile(profile, this.props.workspaceId)
  }
  render () {
    const { profileList } = this.props
    let disabled = !profileList
    return (
      <div className='profile-manager'>
        <select disabled={disabled} value={this.props.profileId} onChange={this.handleProfileChange}>
          {!disabled ? profileList.map((name, id) => {
            return <option key={id} value={id}>{name}</option>
          }) : null}
        </select>
      </div>
    )
  }
}

export default ProfileManager
