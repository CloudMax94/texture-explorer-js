import React from 'react'
import { uniqueId } from 'lodash'

import { remote } from 'electron'
import { openFile } from '../../utils/fileHandler'

import ImmutablePureComponent from '../ImmutablePureComponent'

const { dialog } = remote

class ProfileManager extends ImmutablePureComponent {
  static dependencies = {
    actions: [
      'setProfile',
      'importProfile',
      'deleteProfile',
      'renameProfile',
      'saveProfile',
      'exportProfile',
      'createProfile',
      'prompt'
    ],
    state: [
      'profileList',
      ['currentProfileId', 'profileId'],
      ['currentProfileName', 'profileName'],
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
    this.props.prompt({
      title: 'Delete Profile',
      message: `Do you want to delete "${this.props.profileList.get(this.props.profileId)}"?`,
      buttons: [
        {
          text: 'OK',
          callback: () => {
            this.props.deleteProfile(this.props.profileId)
          }
        },
        {
          text: 'Cancel'
        }
      ]
    })
  }
  handleCreate = (event) => {
    this.props.prompt({
      title: 'New Profile',
      type: 'text',
      value: 'New Profile',
      buttons: [
        {
          text: 'OK',
          callback: (value) => {
            if (value) {
              this.props.createProfile(this.props.workspaceKey, value)
            }
          }
        },
        {
          text: 'Cancel'
        }
      ]
    })
  }
  handleSave = (event) => {
    this.props.saveProfile(this.props.profileId)
  }
  handleExport = (event) => {
    this.props.exportProfile(this.props.profileId)
  }
  handleRename = (event) => {
    this.props.prompt({
      title: 'Rename Profile',
      type: 'text',
      value: this.props.profileName,
      buttons: [
        {
          text: 'OK',
          callback: (value) => {
            this.props.renameProfile(this.props.profileId, value)
          }
        },
        {
          text: 'Cancel'
        }
      ]
    })
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
            <button disabled={!profileList} onClick={this.handleCreate}>New</button>
            <button disabled={!profileList} onClick={this.handleImport}>Import</button>
          </div>
          <div className='button-row'>
            <button disabled={profileId === null} onClick={this.handleSave}>Save</button>
            <button disabled={profileId === null} onClick={this.handleRename}>Rename</button>
            <button disabled={profileId === null} onClick={this.handleExport}>Export</button>
          </div>
          <div className='button-row'>
            <button disabled={profileId === null} onClick={this.handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    )
  }
}

export default ProfileManager
