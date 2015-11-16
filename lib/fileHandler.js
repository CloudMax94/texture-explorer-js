const xml2js = require('xml2js');
const path   = require('path');
const fs     = require('fs');
const _      = require('lodash');

const workspaceActions = require('../actions/workspace');

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
                    attrNameProcessors: [],
                    attrkey: 'data',
                });
                parser.parseString(data, function (err, result) {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    const relativeToAbsolute = function(item, parentAddress) {
                        if (!('address' in item.data)) {
                            item.data.address = '0x00000000';
                        }

                        item.data.address = '0x'+_.padLeft((parseInt(item.data.address, 16) + parseInt(parentAddress, 16)).toString(16), 8, 0).toUpperCase();
                        if (item.textures) {
                            item.textures.forEach((texture) => {
                                relativeToAbsolute(texture, item.data.address);
                            });
                        }
                        if (item.directories) {
                            item.directories.forEach((directory) => {
                                relativeToAbsolute(directory, item.data.address);
                            });
                        }
                    };

                    relativeToAbsolute(result.root, '0x0');
                    console.log(result.root);

                    console.log(JSON.stringify(result.root, null, 4));

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

                workspaceActions.createWorkspace({
                    data: data,
                    path: filePath,
                    name: path.basename(filePath),
                });
                if (callback) {
                    callback();
                }
            });
        }
    });
}

function saveFile(filePath, fileData, callback) {
    fs.writeFile(filePath, fileData, {}, (err) => {
        if (err) throw err;
        if (callback) {
            callback(err);
        }
    });
}

module.exports = {
    addToRecent,
    clearRecent,
    loadProfile,
    openFile,
    saveFile,
};
