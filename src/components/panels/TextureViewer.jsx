import React from 'react'
import { findDOMNode } from 'react-dom'
import { DropTarget } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { openFile } from '../../lib/fileHandler'

import { BLOB_UNSET } from '../../constants/workspace'

import textureManipulator from '../../lib/textureManipulator'
import ImmutablePureComponent from '../ImmutablePureComponent'

class TextureViewer extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.state = {
      mode: 0,
      zoom: 1
    }
  }

  componentWillMount () {
    this.blobUpdate(this.props)
  }

  componentWillReceiveProps (nextProps) {
    this.blobUpdate(nextProps)
  }

  blobUpdate (props) {
    const { itemId, workspaceId, updateItemBlob, blobState } = props
    if (itemId) {
      if (blobState === BLOB_UNSET) {
        updateItemBlob(itemId, workspaceId)
      }
    }
  }

  handleClick = (event) => {
    this.setState({mode: (this.state.mode + 1) % 3})
  }

  handleWheel = (event) => {
    if (event.deltaY > 0) {
      this.setState({zoom: Math.max(this.state.zoom - 0.2, 1)})
    } else if (event.deltaY < 0) {
      this.setState({zoom: Math.min(this.state.zoom + 0.2, 10.0)})
    }
  }

  render () {
    const { blob, connectDropTarget } = this.props
    if (!blob) {
      return null
    }
    return connectDropTarget(
      <div className={'texture-viewer texture-viewer-mode-' + this.state.mode} >
        <img src={blob} style={{zoom: this.state.zoom}} onWheel={this.handleWheel} onClick={this.handleClick} />
      </div>
    )
  }
}

const fileTarget = {
  drop ({ format, address, insertData }, monitor) {
    if (monitor.didDrop()) {
      return
    }

    if (event.dataTransfer.files.length) {
      openFile(event.dataTransfer.files[0], ({data}) => {
        const pngBuffer = Buffer.from(data)
        textureManipulator.pngToPixelData(pngBuffer, (pixelData, imageFormat) => {
          const buffer = textureManipulator.pixelDataToRaw(pixelData, format)
          insertData(buffer, address)
        })
      })
    }
  }
}

export default DropTarget(NativeTypes.FILE, fileTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget()
}))(TextureViewer)
