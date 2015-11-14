'use strict';

const React           = require('react');
const Reflux          = require('reflux');
const _               = require('lodash');

const Rows            = require('./Rows.jsx');
const Columns         = require('./Columns.jsx');
const PanelGroup      = require('./PanelGroup.jsx');
const TextureViewer   = require('./TextureViewer.jsx');
const Overview        = require('./Overview.jsx');

const interfaceStore  = require('../stores/interface');

const Container = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState() {
        return {
            containers: interfaceStore.getContainers(),
            size: interfaceStore.getContainerSize(this.props.index),
        };
    },
    componentDidMount() {
        this.listenTo(interfaceStore, this.oninterfaceStoreChange);
    },
    shouldComponentUpdate(nextProps, nextState) {
        if (
            nextState.size !== this.state.size ||
            _.isEqual(nextState.containers, this.state.containers) !== true
        ) {
            return true;
        }
        return false;
    },
    oninterfaceStoreChange() {
        this.setState({
            containers: interfaceStore.getContainers(),
            size: interfaceStore.getContainerSize(this.props.index),
        });
    },
    render() {
        const panelItems = {
            itemSettings: {
                name: 'Item Settings',
                item: (<span>Ah!</span>),
            },
            itemPreview: {
                name: 'Image Preview',
                item: (
                    <TextureViewer/>
                ),
            },
            settings: {
                name: 'Settings',
                item: (<span>Se!</span>),
            },
            overview: {
                name: 'Directory Tree',
                item: (
                    <Overview/>
                ),
            },
            profileManager: {
                name: 'Profile Manager',
                item: (<span>Eh!</span>),
            },
            finder: {
                name: 'Texture Finder',
                item: (<span></span>),
            },
            dummy: {
                name: 'Dummy',
                item: (<span>De!</span>),
            },
        };
        const content = this.state.containers[this.props.index].map((panelNames, i) => {
            let panels = [];
            _.each(panelNames, (name) => {
                panels.push(panelItems[name]);
            });
            return <PanelGroup key={i} index={i} container={this.props.index} panels={panels}/>;
        });
        let wrap = null;
        let style = {};
        if (this.props.direction === 'horizontal') {
            style.height = this.state.size+'px';
            wrap = (
                <Columns>{content}</Columns>
            );
        } else {
            style.width = this.state.size+'px';
            wrap = (
                <Rows>{content}</Rows>
            );
        }
        if (content.length === 0) {
            style.display = 'none';
        }
        return (
            <div className="container" style={style}>{wrap}</div>
        );
    },
});
module.exports = Container;
