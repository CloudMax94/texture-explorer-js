/*jslint node:true, browser: true, esnext: true */

module.exports = class Popup {
    constructor(options) {
        var ele = this.element = document.createElement('dialog');
        var wrap = document.createElement('div');
        wrap.classList.add('dialog-wrap');
        if (options.closeBtn) {
            var closeBtn = document.createElement('div');
            closeBtn.classList.add('dialog-close');
            closeBtn.innerHTML = '×';
            closeBtn.onclick = () => {
                this.close();
            };
            wrap.appendChild(closeBtn);
        }
        if (options.title) {
            var header = document.createElement('header');
            header.innerHTML = options.title;
            wrap.appendChild(header);
        }
        if (options.content) {
            var content = document.createElement('section');
            content.innerHTML = options.content;
            wrap.appendChild(content);
        }
        if (options.buttons) {
            var buttons = document.createElement('menu');
            for (var i in options.buttons) {
                var btnData = options.buttons[i];
                var button = document.createElement('button');
                button.innerHTML = btnData.text;
                if (btnData.click) {
                    button.onclick = (event) => {
                        btnData.click(event, this);
                    };
                }
                buttons.appendChild(button);
            }
            wrap.appendChild(buttons);
        }
        ele.appendChild(wrap);
        ele.addEventListener('click', function(event) {
            var x = event.screenX;
            var y = event.screenY;
            console.log(event.target.tagName);
            if(event.target.tagName === 'DIALOG' && !(
                (event.target.offsetLeft <= x) && (x <= event.target.offsetLeft+event.target.offsetWidth) &&
                (event.target.offsetTop <= y) && (y <= event.target.offsetTop+event.target.offsetHeight)
                )) {
                console.log("clicked outside popup");
            } else {
                console.log("clicked on popup");
            }
        });
    }
    show() {
        document.body.appendChild(this.element);
        this.element.showModal();
    }
    hide() {
        this.element.close();
    }
    close() {
        this.hide();
        this.element.remove();
    }
};
