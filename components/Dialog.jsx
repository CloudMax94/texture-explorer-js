import React from 'react'

class Dialog extends React.Component {
  componentDidMount () {
    this.oldFocus = document.activeElement
    this.closeButton.focus()
  }
  onClose = () => {
    if (this.oldFocus) {
      this.oldFocus.focus()
    }
    this.props.onClose()
  }
  render () {
    const { onClose, title, children } = this.props
    return (
      <div className='dialog-wrap'>
        <div className='dialog'>
          <div className='dialog-close' onClick={onClose}>×</div>
          <header>{title}</header>
          <section>{children}</section>
          <menu>
            <button onClick={onClose} ref={(closeButton) => { this.closeButton = closeButton }}>Close</button>
          </menu>
        </div>
      </div>
    )
  }
}
export default Dialog
