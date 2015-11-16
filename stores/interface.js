require('../lib/menu');

const Reflux  = require('reflux');
const _       = require('lodash');

const actions = require('../actions/interface');

const defaultSettings = {
    layout: [
        [],
        [['overview']],
        [['itemSettings'], ['itemPreview']],
        [['settings', 'profileManager', 'finder']],
    ],
    panels: {
        overview: {
            hidden: false,
        },
        itemSettings: {
            hidden: false,
        },
        itemPreview: {
            hidden: false,
        },
        settings: {
            hidden: false,
        },
        profileManager: {
            hidden: false,
        },
        finder: {
            hidden: false,
        },
        dummy: {
            hidden: false,
        },
    },
    containerSizes: [160, 300, 300, 160],
    treeSizes: [300, 120, 120, 120, 120, 120, 120, 120, 120],
};

let settings = _.assign({}, defaultSettings);
let status = null;
let menu = null;

const store = Reflux.createStore({
    onInterfaceChange() {
        localStorage.setItem('interfaceSettings', JSON.stringify(settings));
    },
    loadInterfaceSettings() {
        let data = localStorage.getItem('interfaceSettings');
        if (data !== null) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return false;
            }
            settings = _.assign(settings, data);
        }
    },
    init() {
        this.loadInterfaceSettings();

        this.listenTo(actions.setApplicationMenu, (newMenu) => {
            menu = newMenu;
            this.trigger();
        });
        this.listenTo(actions.setStatus, (newStatus) => {
            status = newStatus;
            this.trigger();
        });
        this.listenTo(actions.resetPanels, () => {
            settings = _.assign(settings, {
                layout: defaultSettings.layout,
            });
            this.trigger();
        });
        this.listenTo(actions.movePanelToContainer, (container, groupIndex, index, newContainer) => {
            const panel = settings.layout[container][groupIndex].splice(index, 1)[0];
            settings.layout[newContainer].push([panel]);
            if (settings.layout[container][groupIndex].length === 0) {
                settings.layout[container].splice(groupIndex, 1);
            }
            this.onInterfaceChange();
            this.trigger();
        });
        this.listenTo(actions.movePanelGroupToContainer, (container, index, newContainer) => {
            const group = settings.layout[container].splice(index, 1)[0];
            settings.layout[newContainer].push(group);
            this.onInterfaceChange();
            this.trigger();
        });
        this.listenTo(actions.setContainerSize, (container, size) => {
            settings.containerSizes[container] = size;
            this.onInterfaceChange();
            this.trigger();
        });
        this.listenTo(actions.setTreeSize, (column, size) => {
            settings.treeSizes[column] = size;
            this.onInterfaceChange();
            this.trigger('tree');
        });
    },
    getApplicationMenu() {
        return menu;
    },
    getStatus() {
        return status;
    },
    getContainers() {
        return settings.layout.slice();
    },
    getContainerSize(container) {
        return settings.containerSizes[container];
    },
    getTreeSizes() {
        return settings.treeSizes.slice();
    },
});

module.exports = store;
