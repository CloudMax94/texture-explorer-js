module.exports = {
    require: function(component){
        var remoteComponents = {
            'browser-window':   require('./remote/browser-window'),
            'dialog':           require('./remote/dialog'),
            'menu':             require('./remote/menu'),
            'menu-item':        require('./remote/menu-item'),
        }
        return remoteComponents[component];
    },
    getGlobal: function(g) {
        if (g == 'argv') {
            return {_:[]};
        }
        return null;
    },
    getCurrentWindow: function() {
        return require('./remote/browser-window').getFocusedWindow();
    }
};