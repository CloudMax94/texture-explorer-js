import React from 'react'

class Dialog extends React.Component {
  render () {
    return (
      <div className='dialog'>
        <div className='dialog-wrap'>
          <div className='dialog-close'>×</div>
          <header>About Texture Explorer.js</header>
          <section>Website: cloudmodding.com<br />
            Created by CloudMax 2015.
          </section>
          <menu>
            <button>Close</button>
          </menu>
        </div>
      </div>
    )
  }
}
export default Dialog
