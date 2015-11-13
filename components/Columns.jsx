'use strict';

var React = require('react');

var Columns = React.createClass({
    render() {
        return (
            <div className='columns'>{this.props.children}</div>
        );
    },
});
module.exports = Columns;
