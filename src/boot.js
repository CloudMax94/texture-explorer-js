(function () {
  require('babel-register')
  require('babel-polyfill')
  var React = require('react')
  var ReactDOM = require('react-dom')
  var Root = require('./containers/Root').default
  var configureStore = require('./stores/configureStore').configureStore
  ReactDOM.render(React.createElement(Root, {
    store: configureStore()
  }), document.getElementById('container'))
})()
