const React = require('react');

const Group = React.createClass({
    propTypes: {
        title: React.PropTypes.string,
        children: React.PropTypes.element,
    },
    render() {
        return (
            <div className="group">
                <fieldset>
                    <legend>{this.props.title}</legend>
                    {this.props.children}
                </fieldset>
            </div>
        );
    },
});
module.exports = Group;
