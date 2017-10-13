import React from 'react'

import ImmutablePureComponent from '../ImmutablePureComponent'

class ProfileManager extends ImmutablePureComponent {
  handleProfileChange = (event) => {
    let profile = event.target.value
    this.props.setProfile(profile, this.props.workspaceId)
  }
  handleSave = (event) => {
    this.props.saveProfile(this.props.profileId)
  }
  render () {
    const { profileList } = this.props
    let disabled = !profileList
    return (
      <div className='profile-manager'>
        <div className='inputs'>
          <select disabled={disabled} value={this.props.profileId} onChange={this.handleProfileChange}>
            {!disabled ? profileList.map((name, id) => {
              return <option key={id} value={id}>{name}</option>
            }) : null}
          </select>
          <button disabled={disabled} onClick={this.handleSave}>Save Profile</button>
        </div>
      </div>
    )
  }
}

export default ProfileManager
