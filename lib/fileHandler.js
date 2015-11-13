/*jslint node:true, browser: true, esnext: true */

var xml2js              = require('xml2js');
var path                = require('path');
var fs                  = require('fs');

function loadProfile(profilePath, callback) {
    console.log("loading profile");
    var profileExt = path.extname(profilePath);
    fs.readFile(profilePath, function(err, data) {
        if (err) {
            console.log(err);
            callback(null);
        } else {
            if (profileExt === '.json') {
                try {
                    var json = JSON.parse(data);
                } catch (e) {
                    console.error('There was an error parsing '+profilePath);
                    console.log(e);
                    return;
                }
                callback(json);
            } else if (profileExt === '.xml') {
                var parser = new xml2js.Parser({
                    tagNameProcessors: [function(name){
                        if (name == 'directory')    return 'directories';
                        else if (name == 'texture') return 'textures';
                        return name;
                    }],
                    attrNameProcessors: []
                });
                parser.parseString(data, function (err, result) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    callback(result.root);
                });
            }
        }
    });
}

function addToRecent(file) {
        var recent = localStorage.getItem('recent_files');
        if (recent !== null) {
            recent = JSON.parse(recent);
        } else {
            recent = [];
        }
        if (recent.indexOf(file) >= 0) {
            recent.splice(recent.indexOf(file),1);
        }
        recent.unshift(file);
        recent = recent.slice(0,5);
        localStorage.setItem('recent_files', JSON.stringify(recent));
}

function clearRecent() {
    localStorage.setItem('recent_files', JSON.stringify([]));
}

function openFile(filePath, callback) {
    fs.exists(filePath, (exists) => {
        if (exists) {
            fs.readFile(filePath, (err, data) => {
                if (err) throw err;
                addToRecent(filePath);
                callback(data);
            });
        }
    });
}

module.exports = {
    addToRecent,
    clearRecent,
    loadProfile,
    openFile
};
