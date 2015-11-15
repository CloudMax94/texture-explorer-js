const React = require('react');

const Columns = React.createClass({
    render() {
        return (
            <div className="columns">{this.props.children}</div>
        );
    },
});
module.exports = Columns;
