'use strict';

var React           = require('react');
var Reflux          = require('reflux');
var Menu            = require('./Menu.jsx');
var interfaceStore  = require('../stores/interface');

var ApplicationMenu = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            menu: interfaceStore.getApplicationMenu()
        };
    },
    oninterfaceStoreChange() {
        this.setState({
            menu: interfaceStore.getApplicationMenu()
        });
    },
    componentDidMount() {
        this.listenTo(interfaceStore, this.oninterfaceStoreChange);
    },
    render() {
        if (!this.state.menu)
            return null;
        return (
            <div className='application-menu'>
                <Menu data={this.state.menu}/>
            </div>
        );
    },
});
module.exports = ApplicationMenu;
