(function(){
    require("babel/register");
    var React = require('react');
    var ReactDOM = require('react-dom');
    var App = require('./components/App.jsx');
    ReactDOM.render(React.createElement(App), document.getElementById('container'));


    var sass = require('node-sass');
    var result = sass.render({
        file: __dirname + '/sass/style.scss',
        outFile: __dirname + '/assets/css/style.css',
        sourcemap: true,
        sourceMapEmbed: true,
        sourceMapContents: true,
        outputStyle: 'compact'
    }, function(error, result) {
        var css;
        if (error) {
            css = 'body:before {content: "';
            css += 'SASS Error: ' + error.message.replace(/"/g, '\\"') + ' \\A ';
            css += 'on line ' + error.line + ' column ' + error.column + ' in ' + error.file +  ' \\A ';
            css += '"; white-space: pre; display: block; padding: 0.5em; border: 2px solid red;}#container {display:none}';
        } else {
            css = result.css.toString();

        }
        var head = document.head || document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'data:text/css,' + encodeURIComponent(css);
        head.appendChild(link);
    });
})();
