/*jslint node:true, browser: true, esnext: true */

class Tree {
    constructor() {
        this.preview = null;
        this.workspace = null;
        var treeElement = this.element = document.createElement('tree-view');
        treeElement.dataset.columns = "File, Offset, Start, End, Size, Format, Width, Height, Palette Address";
        treeElement.addEventListener('sort', (event) => {
            console.log('sorting by column '+event.detail.column+'. Ascending: '+event.detail.ascending);
            this.workspace.sort(event.detail.column, event.detail.ascending);
        }, false);
        treeElement.addEventListener('rowSelected', (event) => {
            var selected = event.detail.element.object;
            if (selected.type == 'texture' && this.preview !== null) {
               this.preview.texture = selected;
            }
        }, false);
    }
    setWorkspace(workspace) {
        this.workspace = workspace;
        document.getElementById('workspace').appendChild(this.element);
        this.element.innerHTML = '';
        this.element.appendChild(workspace.root.ele);
    }
    attachPreview(newPreview) {
        this.preview = newPreview;
    }
    show() {
        var nodes = document.getElementById('workspace').childNodes;
        for (var i = 0; i < nodes.length;i++) {
            nodes[i].classList.remove('active');
        }
        this.element.classList.add('active');
    }

}

module.exports = Tree;
