import React from 'react'
import ReactDOM from 'react-dom'

class Dialog extends React.Component {
  componentDidMount () {
    this.oldFocus = document.activeElement
    let node = ReactDOM.findDOMNode(this)
    if (node) {
      let ele = node.querySelector('input, button')
      if (ele) {
        ele.focus()
      }
    }
  }
  onClose = () => {
    if (this.oldFocus) {
      this.oldFocus.focus()
    }
    this.props.onClose()
  }
  render () {
    const { onClose, title, children, buttons } = this.props

    let buttonInput = []
    if (buttons) {
      for (let button of buttons) {
        buttonInput.push(
          <button key={button.get('text')} onClick={button.get('callback')}>{button.get('text')}</button>
        )
      }
    } else {
      buttonInput = <button onClick={onClose}>Close</button>
    }
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
              {buttonInput}
            </menu>
          </main>
        </div>
      </div>
    )
  }
}
export default Dialog
