import React from 'react'
import { openFile } from '../../lib/fileHandler'

import { BLOB_UNSET } from '../../constants/workspace'

import textureManipulator from '../../lib/textureManipulator'
import ImmutablePureComponent from '../ImmutablePureComponent'

class TextureViewer extends ImmutablePureComponent {
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
      textureManipulator.pngToPixelData(pngBuffer, (pixelData, imageFormat) => {
        const { format, address } = this.props
        const buffer = textureManipulator.pixelDataToRaw(pixelData, format)
        this.props.insertData(buffer, address)
      })
    })
  }
  render () {
    const { blob } = this.props
    if (!blob) {
      return null
    }
    return (
      <div className='texture-viewer'>
        <img src={blob} onDragOver={this.handleDragOver} onDragEnd={this.handleDragEnd} onDrop={this.handleDrop} />
      </div>
    )
  }
}

export default TextureViewer
