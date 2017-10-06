import React from 'react'
import { connect } from 'react-redux'
import { each } from 'lodash'

import Rows from './Rows.jsx'
import Columns from './Columns.jsx'
import PanelGroup from './PanelGroup.jsx'
import TextureViewer from './TextureViewer.jsx'
import Overview from './Overview.jsx'

class Container extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }
  render () {
    const panelItems = {
      itemSettings: {
        name: 'Item Settings',
        item: (<span>Ah!</span>)
      },
      itemPreview: {
        name: 'Image Preview',
        item: (
          <TextureViewer />
        )
      },
      settings: {
        name: 'Settings',
        item: (<span>Se!</span>)
      },
      overview: {
        name: 'Directory Tree',
        item: (
          <Overview />
        )
      },
      profileManager: {
        name: 'Profile Manager',
        item: (<span>Eh!</span>)
      },
      finder: {
        name: 'Texture Finder',
        item: (<span />)
      },
      dummy: {
        name: 'Dummy',
        item: (<span>De!</span>)
      }
    }
    const content = this.props.containers[this.props.index].map((panelNames, i) => {
      const panels = []
      each(panelNames, (name) => {
        panels.push(panelItems[name])
      })
      return <PanelGroup key={i} index={i} container={this.props.index} panels={panels} />
    })
    let wrap = null
    const style = {}
    if (this.props.direction === 'horizontal') {
      style.height = this.props.containerSizes[this.props.index] + 'px'
      wrap = (
        <Columns>{content}</Columns>
      )
    } else {
      style.flexBasis = this.props.containerSizes[this.props.index] + 'px'
      wrap = (
        <Rows>{content}</Rows>
      )
    }
    if (content.length === 0) {
      style.display = 'none'
    }
    return (
      <div className='container' style={style}>{wrap}</div>
    )
  }
}

function mapStateToProps (state) {
  return {
    containers: state.ui.getIn(['settings', 'layout']).toJS(),
    containerSizes: state.ui.getIn(['settings', 'containerSizes']).toJS()
  }
}

export default connect(mapStateToProps)(Container)
