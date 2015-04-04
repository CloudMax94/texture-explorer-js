/*jslint node:true, browser: true */
"use strict";

module.exports = {
    readFile: function(path, callback) {
        var val = window.localStorage.getItem(path);
        if (val === null) {
            callback(new Error("ENOENT, open '"+path+"'"), null);
        } else {
            callback(null, val);
        }

    },
    writeFile: function(path, data, callback) {
        window.localStorage.setItem(path, data);
        if (callback)
            callback();
    }
};