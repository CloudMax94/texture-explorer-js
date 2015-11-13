'use strict';

var React = require('react');
var Reflux  = require('reflux');

var TreeView = require('./TreeView.jsx');
var TreeHeader = require('./TreeHeader.jsx');

var workspaceStore = require('../stores/workspace');
var interfaceStore = require('../stores/interface');
var workspaceActions = require('../actions/workspace');

var Workspace = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            sizes: interfaceStore.getTreeSizes(),
            workspaces: workspaceStore.getWorkspaces(),
            current: workspaceStore.getCurrentWorkspace()
        };
    },
    onWorkspaceStoreChange() {
        this.setState({
            workspaces: workspaceStore.getWorkspaces(),
            current: workspaceStore.getCurrentWorkspace()
        });
    },
    onInterfaceStoreChange(data) {
        if (data !== 'tree') return;
        this.setState({
            sizes: interfaceStore.getTreeSizes()
        });
    },
    componentDidMount() {
        this.listenTo(workspaceStore, this.onWorkspaceStoreChange);
        this.listenTo(interfaceStore, this.onInterfaceStoreChange);
    },
    handleTabClick(workspace) {
        workspaceActions.setCurrentWorkspace(workspace);
    },
    render() {
        var tabs = this.state.workspaces.map((workspace, i) => {
            var classes = [
                'workspace-tab'
            ];
            if (workspace === this.state.current) {
                classes.push('selected');
            }
            return (
                <div key={i} className={classes.join(' ')} onClick={this.handleTabClick.bind(this, workspace)}>
                    <span className='btnText'>{workspace.get('name')}</span>
                    <span className='closeBtn'>x</span>
                </div>
            );
        });
        return (
            <div className='workspace'>
                <div className='workspace-tabs'>
                    {tabs}
                </div>
                <div className='workspace-content'>
                    <div className='tree-view'>
                        <TreeHeader sizes={this.state.sizes} columns={['File', 'Offset', 'Start', 'End', 'Size', 'Format', 'Width', 'Height', 'Palette Address']}/>
                        <TreeView sizes={this.state.sizes} workspace={this.state.current} root={this.state.current?this.state.current.get('selectedDirectory'):null}/>
                    </div>
                </div>
            </div>
        );
    },
});
module.exports = Workspace;
