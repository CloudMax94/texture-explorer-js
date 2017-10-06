(function () {
  require('babel-register')
  require('babel-polyfill')
  var React = require('react')
  var ReactDOM = require('react-dom')
  var Root = require('./components/Root.jsx')
  var configureStore = require('./stores/configureStore').configureStore
  ReactDOM.render(React.createElement(Root, {
    store: configureStore()
  }), document.getElementById('container'))

  if (!process.browser) {
    var sass = require('node-sass')
    sass.render({
      file: require('path').join(__dirname, '/sass/style.scss'),
      sourcemap: true,
      sourceMapEmbed: true,
      sourceMapContents: true,
      outputStyle: 'compact'
    }, function (error, result) {
      var css
      if (error) {
        css = 'body:before {content: "'
        css += 'SASS Error: ' + error.message.replace(/"/g, '\\"') + ' \\A '
        css += 'on line ' + error.line + ' column ' + error.column + ' in ' + error.file + ' \\A '
        css += '"; white-space: pre; display: block; padding: 0.5em; border: 2px solid red;}#container {display:none}'
      } else {
        css = result.css.toString()
      }
      var head = document.head || document.getElementsByTagName('head')[0]
      var link = document.createElement('link')
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.href = 'data:text/css,' + encodeURIComponent(css)
      head.appendChild(link)
    })
  }
})()
