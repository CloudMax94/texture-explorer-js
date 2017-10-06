import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { insertData } from '../actions/workspace'
import { openFile } from '../lib/fileHandler'

import textureManipulator from '../lib/textureManipulator'

class TextureViewer extends React.Component {
  handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }
  handleDragEnd = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }
  handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    openFile(event.dataTransfer.files[0], ({data}) => {
      const pngBuffer = Buffer.from(data)
      textureManipulator.pngToPixelData(pngBuffer, (pixelData, format) => {
        const texture = this.props.workspace.getIn(['items', this.props.workspace.get('selectedTexture')])
        const buffer = textureManipulator.pixelDataToRaw(pixelData, texture.get('format'))
        this.props.insertData(buffer, texture.get('address'))
      })
    })
  }
  render () {
    if (!this.props.workspace || !this.props.workspace.get('selectedTexture')) {
      return null
    }

    const texture = this.props.workspace.getIn(['items', this.props.workspace.get('selectedTexture')])
    const blob = texture.get('blob')

    return (
      <div className='texture-viewer'>
        <div className='texture-viewer-inner'>
          <img src={blob} onDragOver={this.handleDragOver} onDragEnd={this.handleDragEnd} onDrop={this.handleDrop} />
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    workspace: state.workspace.getIn(['workspaces', state.workspace.get('currentWorkspace')])
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({insertData}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(TextureViewer)
