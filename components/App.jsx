/*jslint node:true, browser: true */
'use strict';

var React   = require('react/addons');
var Reflux  = require('reflux');
var _       = require('lodash');
var fs      = require('fs');
var path    = require('path');

var fileHandler     = require('../lib/fileHandler');
var argv            = require('remote').getGlobal('argv');

var interfaceStore   = require('../stores/interface');
var workspaceActions = require('../actions/workspace');

var Rows            = require('./Rows.jsx');
var Columns         = require('./Columns.jsx');
var Container       = require('./Container.jsx');
var Handle          = require('./Handle.jsx');
var Workspaces      = require('./Workspaces.jsx');
var ApplicationMenu = require('./ApplicationMenu.jsx');
var StatusBar       = require('./StatusBar.jsx');
var Dialog           = require('./Dialog.jsx');

var App = React.createClass({
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
        event.preventDefault();
        var file = event.dataTransfer.files[0];
        var reader = new FileReader();
        reader.onloadend = (event) => {
            workspaceActions.createWorkspace({
                data: new Buffer(new Uint8Array(event.target.result)),
                path: file.path,
                name: file.name
            });
        };
        reader.readAsArrayBuffer(file);
    },
    render() {
        return (
            <div className='app' onDragOver={this.handleDragOver} onDragEnd={this.handleDragEnd} onDrop={this.handleDrop}>
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
