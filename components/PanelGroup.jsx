'use strict';

var React = require('react');

var remote = require('remote');
var MenuItem = remote.require('menu-item');
var MenuClass = remote.require('menu');
var interfaceActions = require('../actions/interface');


var PanelGroup = React.createClass({
    getInitialState() {
        return {selected: 0};
    },
    handleGroupContext(event) {
        event.preventDefault();
        var menu = new MenuClass;

        menu.append(new MenuItem({
            label: 'Move Group to Top Container',
            click: () => {
                interfaceActions.movePanelGroupToContainer(this.props.container, this.props.index, 0);
            }
        }));

        menu.append(new MenuItem({
            label: 'Move Group to Left Container',
            click: () => {
                interfaceActions.movePanelGroupToContainer(this.props.container, this.props.index, 1);
            }
        }));

        menu.append(new MenuItem({
            label: 'Move Group to Right Container',
            click: () => {
                interfaceActions.movePanelGroupToContainer(this.props.container, this.props.index, 2);
            }
        }));

        menu.append(new MenuItem({
            label: 'Move Group to Bottom Container',
            click: () => {
                interfaceActions.movePanelGroupToContainer(this.props.container, this.props.index, 3);
            }
        }));

        menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY);
    },
    handleTabContext(index, event) {
        event.preventDefault();
        event.stopPropagation();
        var menu = new MenuClass;

        menu.append(new MenuItem({
            label: 'Move Pane to Top Container',
            click: () => {
                interfaceActions.movePanelToContainer(this.props.container, this.props.index, index, 0);
            }
        }));

        menu.append(new MenuItem({
            label: 'Move Pane to Left Container',
            click: () => {
                interfaceActions.movePanelToContainer(this.props.container, this.props.index, index, 1);
            }
        }));

        menu.append(new MenuItem({
            label: 'Move Pane to Right Container',
            click: () => {
                interfaceActions.movePanelToContainer(this.props.container, this.props.index, index, 2);
            }
        }));

        menu.append(new MenuItem({
            label: 'Move Pane to Bottom Container',
            click: () => {
                interfaceActions.movePanelToContainer(this.props.container, this.props.index, index, 3);
            }
        }));

        menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY);
    },
    setCurrentTab(i) {
        this.setState({selected: i});
    },
    render() {
        if (this.state.selected > this.props.panels.length) {
            this.setCurrentTab(0);
        }
        return (
            <div className='panel'>
                <div className='panel-header' onContextMenu={this.handleGroupContext}>
                    <div className='panel-tabs'>
                        {this.props.panels.map((panel, i) => {
                            if (this.state.selected === null || this.state.selected > this.props.panels.length) {
                                this.state.selected = i;
                            }
                            var classes = 'panel-tab';
                            if (this.state.selected === i) {
                                classes += ' selected';
                            }
                            return <div key={i} index={i} className={classes} onClick={this.setCurrentTab.bind(this, i)} onContextMenu={this.handleTabContext.bind(this, i)}>{panel.name}</div>;
                        })}
                    </div>
                </div>
                <div className='panel-content'>
                    {this.props.panels.map((panel, i) => {
                        var style = {};
                        if (this.state.selected !== i) {
                            style.display = 'none';
                        }
                        return (
                            <div className={'panel-item'} key={i} style={style}>{panel.item}</div>
                        );
                    })}
                </div>
            </div>
        );
    },
});
module.exports = PanelGroup;
