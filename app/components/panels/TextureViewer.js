import React from 'react'
import { DropTarget } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { openFile } from '../../utils/fileHandler'

import { BLOB_UNSET } from '../../constants/workspace'

import {pngToPixelData, pixelDataToRaw} from '@cloudmodding/texture-manipulator'
import ImmutablePureComponent from '../ImmutablePureComponent'

class TextureViewer extends ImmutablePureComponent {
  static dependencies = {
    actions: ['updateItemBlob', 'insertData'],
    state: [
      ['selectedTexture', 'texture'],
      ['selectedTextureBlob', 'blob'],
      ['currentWorkspaceId', 'workspaceId']
    ]
  }

  shouldComponentUpdate (nextProps, nextState) {
    return true
  }

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
    const { texture, workspaceId, updateItemBlob, blob } = props
    if (texture) {
      if (!blob || blob.get('blobState') === BLOB_UNSET) {
        updateItemBlob(texture.get('id'), workspaceId)
      }
    }
  }

  handleClick = (event) => {
    this.setState({mode: (this.state.mode + 1) % 3})
  }

  handleWheel = (event) => {
    if (event.ctrlKey) {
      if (event.deltaY > 0) {
        this.setState({zoom: Math.max(this.state.zoom - 0.2, 1)})
      } else if (event.deltaY < 0) {
        this.setState({zoom: Math.min(this.state.zoom + 0.2, 10.0)})
      } else {
        return
      }
      event.preventDefault()
    }
  }

  render () {
    const { blob, connectDropTarget } = this.props

    if (!blob || !blob.get('blob')) {
      return null
    }
    return connectDropTarget(
      <div className={'texture-viewer texture-viewer-mode-' + this.state.mode} >
        <img src={blob.get('blob')} style={{zoom: this.state.zoom}} onWheel={this.handleWheel} onClick={this.handleClick} />
      </div>
    )
  }
}

const fileTarget = {
  drop ({ texture, insertData }, monitor) {
    if (monitor.didDrop()) {
      return
    }

    if (event.dataTransfer.files.length) {
      openFile(event.dataTransfer.files[0], async ({data}) => {
        const pngBuffer = Buffer.from(data)
        let [pixelData] = await pngToPixelData(pngBuffer)
        const buffer = pixelDataToRaw(pixelData, texture.get('format'))
        insertData(buffer, texture.get('address'))
      })
    }
  }
}

export default DropTarget(NativeTypes.FILE, fileTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget()
}))(TextureViewer)
