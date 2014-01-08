/*global window, document */
define(['jquery', 
        'underscore',
        'api/snapshot/util/uuid',
        'api/snapshot/SimCapiMessage',
        'check',
        'api/snapshot/SimCapiValue'
], function($, _, uuid, SimCapiMessage, check, SimCapiValue){

$.noConflict();
_.noConflict();

var Transporter = function(options) {
    // current version of Transporter
    var version = 0.4;

    // Ensure that options is initialized. This is just making code cleaner by avoiding lots of
    // null checks
    options = options || {};

    var self = this;

    // The mapping of watched 'attributes'
    var outgoingMap = options.outgoingMap || {};

    //The list of change listeners
    var changeListeners = [];

    // Authentication handshake used for communicating to viewer
    var handshake = {
        requestToken : options.requestToken || uuid(),
        authToken : options.authToken || null,
        version : version
    };

    // True if and only if we have a pending on ready message.
    var pendingOnReady = options.pendingOnReady || false;

    // holds callbacks that may be needed
    var callback = {
        check : null,
        getData: null
    };

    //current get data requests
    var getRequests = {};
    //current set data requests
    var setRequests = {};

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
        case SimCapiMessage.TYPES.CHECK_RESPONSE:
            handleCheckResponse(message);
            break;
        case SimCapiMessage.TYPES.GET_DATA_RESPONSE:
            handleGetDataResponse(message);
            break;
        case SimCapiMessage.TYPES.SET_DATA_RESPONSE:
            handleSetDataResponse(message);
            break;
        }
    };

    this.addChangeListener = function(changeListener){
      changeListeners.push(changeListener);
    };

    this.removeAllChangeListeners = function(){
      changeListeners = [];
    };

    /*
     *   Handles the get data message
     */
    var handleGetDataResponse = function(message){
        if(message.handshake.authToken === handshake.authToken){
            if(message.values.responseType === 'success'){
                getRequests[message.values.simId][message.values.key].onSuccess(
                        message.values.key,
                        message.values.value
                    );
            }
            else if(message.values.responseType === 'error'){
                getRequests[message.values.simId][message.values.key].onError(
                        message.values.key,
                        message.values.value
                    );
            }
            delete getRequests[message.values.simId][message.values.key];
        }
    };

    /*
     *   Handles the set data message
     */
    var handleSetDataResponse = function(message){
        if(message.handshake.authToken === handshake.authToken){
            if(message.values.responseType === 'success'){
                setRequests[message.values.simId][message.values.key].onSuccess(
                        message.values.key,
                        message.values.value
                    );    
            }
            else if(message.values.responseType === 'error'){
                setRequests[message.values.simId][message.values.key].onError(
                        message.values.key,
                        message.values.value
                    );
            }
            delete setRequests[message.values.simId][message.values.key];
        }
    };


    /*
     * Sends the GET_DATA Request
     */
    var getDataRequest = function(simId, key, onSuccess, onError){

        onSuccess = onSuccess || function(){};
        onError = onError || function(){};

        var getDataRequestMsg = new SimCapiMessage({
            type: SimCapiMessage.TYPES.GET_DATA_REQUEST,
            handshake: handshake,
            values:{
                key: key,
                simId: simId
            }
        });

        if(!getRequests[simId] || !getRequests[simId][key]){
            //return false indicating that there is the same request
            //in progress
            return false;
        }

        getRequests[simId] = getRequests[simId] || {};
        getRequests[simId][key] = {
            onSuccess: onSuccess,
            onError: onError
        };

        // send the message to the viewer
        self.sendMessage(getDataRequestMsg);

        return true;
    };

    /*
     * Sends the GET_DATA Request
     */
    var setDataRequest = function(simId, key, value, onSuccess, onError){
        onSuccess = onSuccess || function(){};
        onError = onError || function(){};

        var setDataRequestMsg = new SimCapiMessage({
            type: SimCapiMessage.TYPES.GET_DATA_REQUEST,
            handshake: handshake,
            values:{
                key: key,
                value: value,
                simId: simId
            }
        });

        if(!setRequests[simId] || !setRequests[simId][key]){
            //return false indicating that there is the same request
            //in progress
            return false;
        }

        setRequests[simId] = setRequests[simId] || {};
        setRequests[simId][key] = {
            onSuccess: onSuccess,
            onError: onError
        };        

        // send the message to the viewer
        self.sendMessage(setDataRequestMsg);

        return true;
    };


    /*
     * Handles check complete event
     */
    var handleCheckResponse = function(message) {
      if (callback.check) {
        callback.check(message);
        callback.check = null;
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

            var changed = [];
            // enumerate through all received values @see SimCapiMessage.values
            _.each(message.values, function(capiValue, key){

                // check if the key exists in the mapping and is writeable
                if (capiValue && !capiValue.readonly) {

                    if(outgoingMap[key] && outgoingMap[key].value !== capiValue.value){
                      //By calling set value, we parse the string of capiValue.value
                      //to whatever type the outgoingMap has stored  
                      outgoingMap[key].setValue(capiValue.value);
                      changed.push(outgoingMap[key]);
                    } 
                }
            });

            //Ensure that changed object has something in it.
            if(changed.length !==0){
              _.each(changeListeners, function(changeListener){
                changeListener(changed);
              });
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

            // once everything is ready, we request a handshake from the viewer.
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
     * @since 0.4
     * Trigger a check event from the sim
     */
    this.triggerCheck = function(handlers) {
        if (callback.check) {
            throw new Error("You have already triggered a check event");
        }

        callback.check = handlers.complete || function() {};

        var triggerCheckMsg = new SimCapiMessage({
            type : SimCapiMessage.TYPES.CHECK_REQUEST,
            handshake : handshake
        });
        self.sendMessage(triggerCheckMsg);
    };

    /*
     * Send a VALUE_CHANGE message to the viewer with a dump of the model.
     */
    this.notifyValueChange = function() {

      if (handshake.authToken) {

        //retrieve the VALUE_CHANGE message
        
        var valueChangeMsg = new SimCapiMessage({
            type : SimCapiMessage.TYPES.VALUE_CHANGE,
            handshake : this.getHandshake()
        });

        // populate the message with the values of the entire model
        valueChangeMsg.values = outgoingMap;

        // send the message to the viewer
        self.sendMessage(valueChangeMsg);            
        return valueChangeMsg;            
      }
      return null;
    };

    this.setValue = function(simCapiValue){

      check(simCapiValue).isOfType(SimCapiValue);

      outgoingMap[simCapiValue.key] = simCapiValue;

      this.notifyValueChange();
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
      try{
        var message = JSON.parse(event.data);
        self.capiMessageHandler(message);
      }
      catch(e){
        //silently ignore - occuring in test
      }
        
    };

    // we have to wait until the dom is ready to attach anything or sometimes the js files
    // haven't finished loading and crap happens.
    $(document).ready(function() {
        // attach event listener for messages received from the viewer
        window.addEventListener('message', messageEventHandler);
    });
};



var _instance = null;
var getInstance = function(){
  if(!_instance){
    _instance = new Transporter();
  }

  return _instance;
};

// in reality, we want a singleton but not for testing.
return {
  getInstance: getInstance,
  Transporter: Transporter
};
});
