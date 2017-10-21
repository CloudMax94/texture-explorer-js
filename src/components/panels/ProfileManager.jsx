import React from 'react'
import { uniqueId } from 'lodash'

import { remote } from 'electron'
import { openFile } from '../../lib/fileHandler'

import ImmutablePureComponent from '../ImmutablePureComponent'

const { dialog } = remote

class ProfileManager extends ImmutablePureComponent {
  static dependencies = {
    actions: [
      'setProfile',
      'importProfile',
      'deleteProfile',
      'saveProfile',
      'createProfile'
    ],
    state: [
      'profileList',
      ['currentProfileId', 'profileId'],
      ['currentWorkspaceId', 'workspaceId'],
      ['currentWorkspaceKey', 'workspaceKey']
    ]
  }
  componentWillMount () {
    this.id = uniqueId('profile_setting_')
  }
  handleProfileChange = (event) => {
    let profile = event.target.value
    this.props.setProfile(profile, this.props.workspaceId)
  }
  handleImport = (event) => {
    dialog.showOpenDialog(remote.getCurrentWindow(), {
      title: 'Open File',
      filters: [
        {name: remote.app.getName() + ' Profiles', extensions: ['xml', 'json']}
      ],
      properties: ['openFile']
    }, (files) => {
      if (files && files.length) {
        openFile(files[0], (data) => {
          this.props.importProfile(data, this.props.workspaceKey)
        })
      }
    })
  }
  handleDelete = (event) => {
    this.props.deleteProfile(this.props.profileId)
  }
  handleCreate = (event) => {
    this.props.createProfile(this.props.workspaceKey)
  }
  handleSave = (event) => {
    this.props.saveProfile(this.props.profileId)
  }
  render () {
    const { profileList, profileId, workspaceKey } = this.props
    return (
      <div className='profile-manager'>
        <div className='inputs'>
          <div className='input-columns'>
            <div>
              <label htmlFor={this.id + 'key'}>File Key:</label>
            </div>
            <div>
              <input id={this.id + 'key'} type='text' value={workspaceKey || ''} readOnly />
            </div>
          </div>
          <select disabled={!profileList || profileList.count() === 0} value={profileId !== null ? profileId : ''} onChange={this.handleProfileChange}>
            {profileId === null ? <option key='_none' /> : null}
            {profileList ? profileList.map((name, id) => {
              return <option key={id} value={id}>{name}</option>
            }).toList() : null}
          </select>
          <div className='button-row'>
            <button disabled={!profileList} onClick={this.handleCreate}>New Profile</button>
            <button disabled={!profileList} onClick={this.handleImport}>Import Profile</button>
          </div>
          <div className='button-row'>
            <button disabled={profileId === null} onClick={this.handleSave}>Save Profile</button>
            <button disabled={profileId === null} onClick={this.handleDelete}>Delete Profile</button>
          </div>
        </div>
      </div>
    )
  }
}

export default ProfileManager
