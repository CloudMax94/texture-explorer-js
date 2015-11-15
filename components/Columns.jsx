const React = require('react');

const Columns = React.createClass({
    propTypes: {
        children: React.PropTypes.arrayOf(React.PropTypes.element),
    },
    render() {
        return (
            <div className="columns">{this.props.children}</div>
        );
    },
});
module.exports = Columns;
