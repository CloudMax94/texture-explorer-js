'use strict';

var React   = require('react');
var Reflux  = require('reflux');

var interfaceStore  = require('../stores/interface');

var StatusBar = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            status: interfaceStore.getStatus()
        };
    },
    oninterfaceStoreChange() {
        this.setState({
            status: interfaceStore.getStatus()
        });
    },
    componentDidMount() {
        this.listenTo(interfaceStore, this.oninterfaceStoreChange);
    },
    render() {
        return (
            <div className='status-bar'>{this.state.status}</div>
        );
    },
});
module.exports = StatusBar;
