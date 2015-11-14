'use strict';

const React   = require('react/addons');
const Reflux  = require('reflux');
const _       = require('lodash');
const fs      = require('fs');
const path    = require('path');

const fileHandler     = require('../lib/fileHandler');
const argv            = require('remote').getGlobal('argv');

const workspaceActions = require('../actions/workspace');

const Columns         = require('./Columns.jsx');
const Container       = require('./Container.jsx');
const Handle          = require('./Handle.jsx');
const Workspaces      = require('./Workspaces.jsx');
const ApplicationMenu = require('./ApplicationMenu.jsx');
const StatusBar       = require('./StatusBar.jsx');
const Dialog          = require('./Dialog.jsx');

const App = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
        };
    },
    componentDidMount() {
        _.each(argv._, (filePath) => {
            fs.exists(filePath, (exists) => {
                if (exists) {
                    fileHandler.openFile(filePath, (data) => {
                        workspaceActions.createWorkspace({
                            data: data,
                            path: filePath,
                            name: path.basename(filePath),
                        });
                    });
                }
            });
        });
    },
    handleDragOver(event) {
        event.preventDefault();
        console.log('handleDragOver');
    },
    handleDragEnd(event) {
        event.preventDefault();
        console.log('handleDragEnd');
    },
    handleDrop(event) {
        const file = event.dataTransfer.files[0];
        const reader = new FileReader();
        event.preventDefault();
        reader.onloadend = (e) => {
            workspaceActions.createWorkspace({
                data: new Buffer(new Uint8Array(e.target.result)),
                path: file.path,
                name: file.name,
            });
        };
        reader.readAsArrayBuffer(file);
    },
    render() {
        return (
            <div className="app" onDragOver={this.handleDragOver} onDragEnd={this.handleDragEnd} onDrop={this.handleDrop}>
                <ApplicationMenu/>
                <Container index={0} direction="horizontal"/>
                <Handle index={0}/>
                <Columns>
                    <Container index={1} direction="vertical"/>
                    <Handle index={1}/>
                    <Workspaces/>
                    <Handle index={2} reverse={true}/>
                    <Container index={2} direction="vertical"/>
                </Columns>
                <Handle index={3} reverse={true}/>
                <Container index={3} direction="horizontal"/>
                <StatusBar/>
            </div>
        );
    },
});
module.exports = App;
