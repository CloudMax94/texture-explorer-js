require("babel/register");
var React = require('react');
document.addEventListener("DOMContentLoaded", function(event) {
    var App = require('./components/App.jsx');
    React.render(React.createElement(App), document.getElementById('container'));
});
