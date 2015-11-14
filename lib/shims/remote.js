var url = require('url');
var _   = require('lodash');

module.exports = {
    require(component){
        var remoteComponents = {
            'browser-window':   require('./remote/browser-window'),
            'dialog':           require('./remote/dialog'),
            'menu':             require('./remote/menu'),
            'menu-item':        require('./remote/menu-item'),
        };
        if (component in remoteComponents)
            return remoteComponents[component];
        else
            console.error("Unsupported remote component '"+component+"'.");
    },
    getGlobal(g) {
        if (g == 'argv') {
            var url_parts = url.parse(window.location.href, true);
            var query = url_parts.query;
            var query_ = [];
            _.each(query, function(val, key){
                if (val === '') {
                    delete query[key];
                    query_.push(key);
                }
            });
            query._ = query_;
            return query;
        }
        return null;
    },
    getCurrentWindow() {
        return require('./remote/browser-window').getFocusedWindow();
    }
};
