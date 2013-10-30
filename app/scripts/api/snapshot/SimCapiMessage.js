define(function (require){

var SimCapiMessage = function(options) {

    // Ensure that options is initialized. This is just making code cleaner by avoiding lots of
    // null checks
    options = options || {};

    // The message type. Select from TYPES.
    this.type = options.type || null;

    /*
     * This is needed to create a handshake between stage and iframe. Without a handshake,
     * we can't identify the IFrame from which a message was sent.
     */
    this.handshake = options.handshake || {
        requestToken : null,
        authToken : null
    };

    /*
     * Values is a map containing (key, CapiValue) pairs.
     */
    this.values = options.values || {};
};

/*
 * Define message type enums as a class variable.
 * Next number is 7
 */
SimCapiMessage.TYPES = {
    HANDSHAKE_REQUEST : 1,
    HANDSHAKE_RESPONSE : 2,
    ON_READY : 3,
    VALUE_CHANGE : 4,
    CONFIG_CHANGE : 5,
    VALUE_CHANGE_REQUEST : 6
};

return SimCapiMessage;
});