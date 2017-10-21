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
          <header>
            {title}
            <div className='dialog-close' tabIndex='0' onClick={onClose}>×</div>
          </header>
          <main>
            <section>{children}</section>
            <menu>
              <button onClick={onClose} ref={(closeButton) => { this.closeButton = closeButton }}>Close</button>
            </menu>
          </main>
        </div>
      </div>
    )
  }
}
export default Dialog
