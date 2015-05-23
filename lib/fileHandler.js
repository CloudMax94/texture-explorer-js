/*jslint node:true, browser: true, esnext: true */

var _                   = require('lodash');
var xml2js              = require('xml2js');
var path                = require('path');
var fs                  = require('fs');
var argv                = require('remote').getGlobal('argv');

var workspaces          = require('./container');

function fixProfile(root) {
    workspaces.current.initialize(root);
    console.log('fix profile');
    console.log(workspaces.current);
    workspaces.current.tree.setWorkspace(workspaces.current);
    workspaces.current.tree.show();
}
function loadProfile() {
    console.log("loading profile");
    var profilePath = path.join(__dirname, '../', '/profiles/NZLE15/default/fileList.json');
    var profileExt = path.extname(profilePath);
    fs.readFile(profilePath, function(err, data) {
        if (err) {
            console.log(err);
            fixProfile(null);
        } else {
            if (profileExt === '.json') {
                try {
                    var json = JSON.parse(data);
                    fixProfile(json);
                } catch (e) {
                    console.error('There was an error parsing '+profilePath);
                    console.log(e);
                    return;
                }
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
                    fixProfile(result.root);
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

function readFile(file) {
    var reader = new FileReader();
    console.log(file);
    reader.onloadend = function(event) {
        addToRecent(file.path);
        var workspace = workspaces.new();
        workspace.setFile(new Buffer(new Uint8Array(event.target.result)), {
            path: file.path,
            name: file.name
        });
        loadProfile();
    };
    reader.readAsArrayBuffer(file);
}

function openFile(filePath) {
    fs.exists(filePath, function(exists) {
        if (exists) {
            fs.readFile(filePath, function (err, data) {
                if (err) throw err;
                addToRecent(filePath);
                var workspace = workspaces.new();
                workspace.setFile(data, {
                    path: filePath,
                    name: path.basename(filePath)
                });
                loadProfile();
            });
        }
    });
}

_.each(argv._, function(filePath){
    openFile(filePath);
});

document.ondragover = function() {
    this.className = 'hover';
    return false;
};
document.ondragend = function() {
    this.className = '';
    return false;
};
document.ondrop = function(event) {
    this.className = '';
    event.preventDefault();

    var file = event.dataTransfer.files[0];
    readFile(file);
    return false;
};

module.exports = {
    addToRecent,
    clearRecent,
    loadProfile,
    readFile,
    openFile
};
