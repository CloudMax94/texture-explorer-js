const React = require('react');

const Rows = React.createClass({
    render() {
        return (
            <div className="rows">{this.props.children}</div>
        );
    },
});
module.exports = Rows;
