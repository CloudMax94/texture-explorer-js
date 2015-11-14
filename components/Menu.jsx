'use strict';

const React = require('react');

const MenuItem = React.createClass({
    render() {
        if (!this.props.data) {
            return null;
        }

        if (this.props.data.type === 'separator') {
            return (
                <div className="menu-separator"></div>
            );
        }

        let classes = [
            'menu-item',
        ];

        var subMenu = null;
        if (this.props.data.submenu) {
            classes.push('parent');
            subMenu = (
                <Menu data={this.props.data.submenu}/>
            );
        }
        let accelerator = null;
        if (this.props.data.globalKeyObject) {
            accelerator = this.props.data.globalKeyObject.text;
        }
        return (
            <div className={classes.join(' ')} data-accelerator={accelerator} onClick={this.props.data.click}>
                {this.props.data.label}
                {subMenu}
            </div>
        );
    },
});

const Menu = React.createClass({
    render() {
        if (!this.props.data) {
            return null;
        }
        const menuItems = this.props.data.items.map(function (item, i) {
            return (
                <MenuItem key={i} data={item} />
            );
        });
        return (
            <div className="menu">
                {menuItems}
            </div>
        );
    },
});
module.exports = Menu;
