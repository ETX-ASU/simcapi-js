/*global window, document */
/*
 * How to use SimCapi:
 *
 * // Get an instance of simcapi
 * var s = SimCapi.getInstance();
 *
 * // Register your model properties. (The model must be a Backbone.Model.
 * // Yeah this sucks and should change)
 * s.watch("massE", {parent:model, type: SimCapi.TYPES.NUMBER, readonly: false});
 *
 * // tell the viewer that the sim is ready
 * s.notifyOnReady();
 *
 * Adaptive E-Learning api.
 * (c) Smart Sparrow
 */
define(function(require){

    var $              = require('jquery');
    var _              = require('underscore');
    var Math           = require('api/snapshot/util/Math.uuid');
    var SimCapiMessage = require('api/snapshot/SimCapiMessage');
    var SimCapiValue   = require('api/snapshot/SimCapiValue');
    var check          = require('common/check');

    var SimCapi = function(options) {

        // Ensure that options is initialized. This is just making code cleaner by avoiding lots of
        // null checks
        options = options || {};

        var self = this;

        // The mapping of watched 'attributes'
        var outgoingMap = options.outgoingMap || {};

        // Authentication handshake used for communicating to viewer
        var handshake = {
            requestToken : options.requestToken || Math.uuid(),
            authToken : options.authToken || null
        };

        // True if and only if we have a pending on ready message.
        var pendingOnReady = options.pendingOnReady || false;

        /*
         * Helper to route messages to approvidate handlers
         */
        this.capiMessageHandler = function(message) {
            switch(message.type) {
            case SimCapiMessage.TYPES.HANDSHAKE_RESPONSE:
                handleHandshakeResponse(message);
                break;
            case SimCapiMessage.TYPES.VALUE_CHANGE:
                handleValueChangeMessage(message);
                break;
            }
        };

        /*
         * Handles value change messages and update the model accordingly. If the
         * authToken doesn't match our authToken, we ignore the message.
         */
        var handleValueChangeMessage = function(message) {
            if (message.handshake.authToken === handshake.authToken) {

                // enumerate through all received values @see SimCapiMessage.values
                _.each(message.values, function(capiValue, key){

                    var attrParams = outgoingMap[key];

                    // check if the key exists in the mapping and is writeable
                    if (attrParams && !attrParams.readonly) {
                        // attempt to set update the model value
                        setValue(outgoingMap[key], key, capiValue.value);
                    }
                });
            }
        };

        /*
         * Helper to update the value of a model based on it's type.
         */
        var setValue = function(attrParams, key, value) {
            switch (attrParams.type) {
            case SimCapi.TYPES.NUMBER:
                check(parseFloat(value)).isNumber();
                attrParams.parent.set(key, parseFloat(value));
                break;
            case SimCapi.TYPES.STRING:
                attrParams.parent.set(key, value);
                break;
            case SimCapi.TYPES.BOOLEAN:
                attrParams.parent.set(key, (value === "true" ? true : false));
                break;                
            default:
                attrParams.parent.set(key, value);
                break;
            }
        };

        /*
         * Handles handshake response by storing the authtoken and sending an ON_READY message
         * if the requestToken matches our token. When the requestToken does not match,
         * the message wasn't intended for us so we just ignore it.
         */
        var handleHandshakeResponse = function(message) {
            if (message.handshake.requestToken === handshake.requestToken) {
                handshake.authToken = message.handshake.authToken;
                handshake.config = message.handshake.config;

                if (pendingOnReady) {
                    self.notifyOnReady();
                }
            }
        };

        /*
         * Send a HANDSHAKE_REQUEST message.
         */
        var requestHandshake = function() {
            var handshakeRequest = new SimCapiMessage({
                type: SimCapiMessage.TYPES.HANDSHAKE_REQUEST,
                handshake: handshake
            });

            self.sendMessage(handshakeRequest);
        };

        /*
         * Send an ON_READY message to the viewer.
         */
        this.notifyOnReady = function() {
            if (!handshake.authToken) {
                pendingOnReady = true;

                // once everything is ready, we request and handshake from the viewer.
                requestHandshake();

            } else {
                var onReadyMsg = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.ON_READY,
                    handshake: handshake
                });

                // send the message to the viewer
                self.sendMessage(onReadyMsg);
                pendingOnReady = false;

                // send initial value snapshot
                notifyValueChange();
            }
        };

        /*
         * Send a VALUE_CHANGE message to the viewer with a dump of the model.
         */
        var notifyValueChange = function() {

            // initialize a VALUE_CHANGE message
            var valueChangeMsg = new SimCapiMessage({
                type : SimCapiMessage.TYPES.VALUE_CHANGE,
                handshake : handshake
            });

            // populate the message with the values of the entire model
            _.each(outgoingMap, function(attrParams, attrName) {
              
                valueChangeMsg.values[attrName] = new SimCapiValue({
                    // everything is going to be a string from the viewer's perspective
                    type    : attrParams.type,
                    value   : null,
                    readOnly: attrParams.readonly
                });
              
                // Not passing attributes that don't exist in the ref model
                if (attrParams.parent.has(attrName)) {
                    var value = attrParams.parent.get(attrName);
                    if (value) {
                        valueChangeMsg.values[attrName].value = value.toString();
                    }
                }
            });

            // send the message to the viewer
            self.sendMessage(valueChangeMsg);

        };

        // Helper to send message to viewer
        this.sendMessage = function(message) {
            // window.parent can be itself if it's not inside an iframe
            if (window !== window.parent) {
                window.parent.postMessage(JSON.stringify(message), '*');
            }
        };

        // Returns the initial configuration passed in the handshake
        this.getConfig = function() {
            return handshake.config;
        };

        /*
         * Allows the 'attributes' to be watched.
         * @param varName - The 'attribute name'
         * @param params : {
         *      parent : What the 'attribute' belongs to. Must also have a 'get' and 'set function.
         *      type : Type of the 'attribute'. @see SimCapi.TYPES below.
         *      readonly : True if and only if, the attribute can be changed.
         * }
         */
        this.watch = function(varName, params) {
            outgoingMap[varName] = params;

            // listen to the model by attaching event handler on the parent
            params.parent.on('change:' + varName, function(){
                notifyValueChange();
            });
        };

        // handler for postMessages received from the viewer
        var messageEventHandler = function(event) {
            var message = JSON.parse(event.data);
            self.capiMessageHandler(message);
        };

        // we have to wait until the dom is ready to attach anything or sometimes the js files
        // haven't finished loading and crap happens.
        $(document).ready(function() {
            // attach event listener for messages received from the viewer
            window.addEventListener('message', messageEventHandler);
        });
    };

    /*
     * Attribute types.
     */
    SimCapi.TYPES = {
        NUMBER  : 1,
        STRING  : 2,
        ARRAY   : 3,
        BOOLEAN : 4
    };

    var _instance = null;
    var getInstance = function() {
        if(!_instance) {
            _instance = new SimCapi();
        }
        return _instance;
    };

    // in reality, we want a singleton but not for testing.
    return {
        getInstance : getInstance,
        SimCapi     : SimCapi,
        TYPES       : SimCapi.TYPES
    };
});