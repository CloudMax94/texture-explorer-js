const React = require('react');

const Rows = React.createClass({
    propTypes: {
        children: React.PropTypes.arrayOf(React.PropTypes.element),
    },
    render() {
        return (
            <div className="rows">{this.props.children}</div>
        );
    },
});
module.exports = Rows;
