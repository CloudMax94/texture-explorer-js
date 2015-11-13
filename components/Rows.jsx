'use strict';

var React = require('react');

var Rows = React.createClass({
    render() {
        return (
            <div className='rows'>{this.props.children}</div>
        );
    },
});
module.exports = Rows;
