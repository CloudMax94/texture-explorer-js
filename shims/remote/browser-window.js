module.exports = {
    getFocusedWindow: function(){
        return {
            reloadIgnoringCache: function() {
                location.reload(true);
            },
            toggleDevTools: function() {

            },
            isFullScreen: function() {

            },
            setFullScreen: function(bool) {

            }
        };
    }
};