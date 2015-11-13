'use strict';

var React = require('react');
var Reflux  = require('reflux');
var _ = require('lodash');

var TreeView = require('./TreeView.jsx');

var workspaceStore  = require('../stores/workspace');

var Overview = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            workspace: workspaceStore.getCurrentWorkspace()
        };
    },
    onWorkspaceStoreChange() {
        this.setState({
            workspace: workspaceStore.getCurrentWorkspace()
        });
    },
    componentDidMount() {
        this.listenTo(workspaceStore, this.onWorkspaceStoreChange);
    },
    render() {
        return (
            <TreeView
                workspace={this.state.workspace}
                root={this.state.workspace?this.state.workspace.get('root'):null}
                list={true}
            />
        );
    },
});
module.exports = Overview;
