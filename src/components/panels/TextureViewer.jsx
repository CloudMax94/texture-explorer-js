import React from 'react'
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
      mode: 0
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

  handleScroll = (event) => {
    console.log(event)
  }

  render () {
    const { blob, connectDropTarget } = this.props
    if (!blob) {
      return null
    }
    return connectDropTarget(
      <div className={'texture-viewer texture-viewer-mode-' + this.state.mode}>
        <img src={blob}
          onClick={this.handleClick}
          onScroll={this.handleScroll}
        />
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
