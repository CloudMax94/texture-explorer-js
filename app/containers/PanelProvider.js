import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as interfaceActions from '../actions/interface'
import * as workspaceActions from '../actions/workspace'
import * as profileActions from '../actions/profile'

import * as selectors from '../selectors'

import ImmutablePureComponent from '../components/ImmutablePureComponent'

import { Map } from 'immutable'

import Finder from '../components/panels/Finder'
import TextureViewer from '../components/panels/TextureViewer'
import Overview from '../components/panels/Overview'
import TextureSettings from '../components/panels/TextureSettings'
import DirectorySettings from '../components/panels/DirectorySettings'
import ProfileManager from '../components/panels/ProfileManager'
import Settings from '../components/panels/Settings'

const mapping = {
  'textureSettings': TextureSettings,
  'directorySettings': DirectorySettings,
  'itemPreview': TextureViewer,
  'overview': Overview,
  'profileManager': ProfileManager,
  'finder': Finder,
  'settings': Settings
}

function getPanelClass (panelId) {
  return mapping[panelId] || null
}

class PanelProvider extends ImmutablePureComponent {
  render () {
    let panelId = this.props.panel
    let Panel = getPanelClass(panelId)
    if (!Panel) {
      return null
    }
    return <Panel {...this.props.dependencies.toObject()} {...this.props.actions} />
  }
}

function mapStateToProps (state, ownProps) {
  const panelId = ownProps.panel
  let dependencies = Map()
  let Panel = getPanelClass(panelId)
  if (Panel) {
    let stateDeps = (Panel.dependencies || {}).state
    if (stateDeps) {
      for (let stateDep of stateDeps) {
        let propName = stateDep
        if (typeof stateDep === 'object') {
          propName = stateDep[1]
          stateDep = stateDep[0]
        }
        let selectorName = 'get' + stateDep.charAt(0).toUpperCase() + stateDep.slice(1)
        if (selectorName in selectors) {
          dependencies = dependencies.set(propName, selectors[selectorName](state))
        } else {
          console.warn(`Panel "${panelId}" tried to load non-existent state dependency "${stateDep}"`)
        }
      }
    }
  }
  return {dependencies}
}

const allActions = {
  ...interfaceActions,
  ...workspaceActions,
  ...profileActions
}

function mapDispatchToProps (dispatch, ownProps) {
  const panelId = ownProps.panel
  const dependencies = {}

  let Panel = getPanelClass(panelId)
  if (Panel) {
    let actionsDeps = (Panel.dependencies || {}).actions
    if (actionsDeps) {
      for (let actionDep of actionsDeps) {
        if (actionDep in allActions) {
          dependencies[actionDep] = allActions[actionDep]
        } else {
          console.warn(`Panel "${panelId}" tried to load non-existent action dependency "${actionDep}"`)
        }
      }
    }
  }
  return {
    actions: bindActionCreators(dependencies, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelProvider)
