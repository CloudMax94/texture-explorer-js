const React = require('react');

const Group = React.createClass({
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
