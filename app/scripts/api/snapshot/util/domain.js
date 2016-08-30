/*globals document*/
define(function() {
    return {
        getDomain: function() {
            return document.domain;
        },
        setDomain: function(newDomain) {
            document.domain = newDomain;
        }
    };
});