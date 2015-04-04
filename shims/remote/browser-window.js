/*jslint node:true, browser: true */
"use strict";

module.exports = {
    getFocusedWindow: function(){
        return {
            reloadIgnoringCache: function() {
                location.reload(true);
            },
            toggleDevTools: function() {
                this.setFullScreen(!this.isFullscreen);
            },
            isFullScreen: function() {
                return document.webkitIsFullScreen;
            },
            setFullScreen: function(bool) {
                if (bool) {
                    var docElm = document.documentElement;
                    if (docElm.requestFullscreen) {
                        docElm.requestFullscreen();
                    }
                    else if (docElm.mozRequestFullScreen) {
                        docElm.mozRequestFullScreen();
                    }
                    else if (docElm.webkitRequestFullScreen) {
                        docElm.webkitRequestFullScreen();
                    }
                    else if (docElm.msRequestFullscreen) {
                        docElm.msRequestFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                    else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    }
                    else if (document.webkitCancelFullScreen) {
                        document.webkitCancelFullScreen();
                    }
                    else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                }
            }
        };
    }
};