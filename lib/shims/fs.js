module.exports = {
    readFile(path, callback) {
        var val = window.localStorage.getItem(path);
        if (val === null) {
            callback(new Error("ENOENT, open '"+path+"'"), null);
        } else {
            callback(null, val);
        }

    },
    writeFile(path, data, callback) {
        window.localStorage.setItem(path, data);
        if (callback)
            callback();
    },
    exists(path, callback) {
        callback(false);
    }
};
