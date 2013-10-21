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
    var check          = require('check');

    var SimCapi = function(options) {
        // current version of SimCapi
        var version = 0.1;

        // Ensure that options is initialized. This is just making code cleaner by avoiding lots of
        // null checks
        options = options || {};

        var self = this;

        // The mapping of watched 'attributes'
        var outgoingMap = options.outgoingMap || {};

        // Authentication handshake used for communicating to viewer
        var handshake = {
            requestToken : options.requestToken || Math.uuid(),
            authToken : options.authToken || null,
            version : version
        };

        // True if and only if we have a pending on ready message.
        var pendingOnReady = options.pendingOnReady || false;

        /*
        * Sets reference to the current connector.
        */
        this.setConnector = function(connector){
            self._connector = connector;
        };

        this.getHandshake = function(){
            return handshake;
        };

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
            case SimCapiMessage.TYPES.CONFIG_CHANGE:
                handleConfigChangeMessage(message);
                break;
            case SimCapiMessage.TYPES.VALUE_CHANGE_REQUEST:
                handleValueChangeRequestMessage(message);
                break;
            }
        };

        /*
         * Handles configuration changes to sharedsimdata
         */
        var handleConfigChangeMessage = function(message) {
            if (message.handshake.authToken === handshake.authToken) {
                handshake.config = message.handshake.config;
            }
        };
        
        /*
         * Handles request to report about value changes
         */
        var handleValueChangeRequestMessage = function(message) {
            if (message.handshake.authToken === handshake.authToken) {
                self.notifyValueChange();
            }
        };
        
        /*
         * Handles value change messages and update the model accordingly. If the
         * authToken doesn't match our authToken, we ignore the message.
         */
        var handleValueChangeMessage = function(message) {
            if (message.handshake.authToken === handshake.authToken) {
                if(self._connector){
                    self._connector.handleValueChange(message);
                }
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
                self.notifyValueChange();
            }
        };

        /*
         * Send a VALUE_CHANGE message to the viewer with a dump of the model.
         */
        this.notifyValueChange = function() {

          if (handshake.authToken && self._connector) {

            //retrieve the VALUE_CHANGE message
            var valueChangeMsg = self._connector.createValueChangeMessage();
            
            // send the message to the viewer
            self.sendMessage(valueChangeMsg);            
            return valueChangeMsg;            
          }
          return null;
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
