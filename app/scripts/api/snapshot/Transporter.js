/**
 * @license
 * Adaptive E-Learning Sim Control API (CAPI).
 *
 * Copyright 2011 Smart Sparrow Pty. Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global window, document, setTimeout*/
define(function(require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var uuid = require('./util/uuid');
    var SimCapiMessage = require('./SimCapiMessage');
    var check = require('check');
    var SimCapiValue = require('./SimCapiValue');
    var SimCapiTypes = require('./SimCapiTypes');
    var ApiInterface = require('./ApiInterface');
    var LocalData = require('./LocalData');
    var domainUtil = require('./util/domain');

    var iframeUtil = require('./util/iframe');

    $.noConflict();
    _.noConflict();

    var Transporter = function(options) {
        // current version of Transporter
        var version = "<%= version %>";

        // Ensure that options is initialized. This is just making code cleaner by avoiding lots of
        // null checks
        options = options || {};

        var self = this;

        // The mapping of watched 'attributes'
        var outgoingMap = options.outgoingMap || {};

        //The mapping of capi values that were recieved and are waiting to be applied.
        var toBeApplied = options.toBeApplied || {};

        //The list of change listeners
        var changeListeners = {};
        var configChangeListeners = {};
        var initialSetupCompleteListeners = [];
        var handshakeListeners = [];

        // Authentication handshake used for communicating to viewer
        var handshake = {
            requestToken: options.requestToken || uuid(),
            authToken: options.authToken || null,
            version: version
        };

        // True if and only if we have a pending on ready message.
        var pendingOnReady = options.pendingOnReady || false;

        var pendingMessages = {
            forHandshake: [],
            forValueChange: []
        };

        //tracks if check has been triggered.
        var checkTriggered = false;

        // holds callbacks that may be needed
        var callback = {
            check: {
                complete: [],
                start: []
            },
            getData: null
        };

        /* can be used to uniquely identify messages */
        this.lastMessageId = 0;
        /* can be used to keep track of the success and error callbacks for a given message */
        this.messageCallbacks = {};

        /* stored callbacks for registerLocalDataListener */
        this.localDataChangedCallbacks = {};

        /*
         * Gets/SetsRequest callbacks
         * simId -> { key -> { onSucess -> function, onError -> function } }
         */
        var getRequests = {};
        var setRequests = {};

        /*
         *   Throttles the value changed message to 25 milliseconds
         */
        var currentTimeout = null;
        var timeoutAmount = 25;

        this.apiInterface = ApiInterface.create(this);

        this.getHandshake = function() {
            return handshake;
        };

        /*
         * Helper to route messages to appropriate handlers
         */
        this.capiMessageHandler = function(message) {
            if (!message.handshake) { return; }

            switch (message.type) {
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
                case SimCapiMessage.TYPES.CHECK_COMPLETE_RESPONSE:
                    handleCheckCompleteResponse(message);
                    break;
                case SimCapiMessage.TYPES.CHECK_START_RESPONSE:
                    handleCheckStartResponse(message);
                    break;
                case SimCapiMessage.TYPES.GET_DATA_RESPONSE:
                    handleGetDataResponse(message);
                    break;
                case SimCapiMessage.TYPES.SET_DATA_RESPONSE:
                    handleSetDataResponse(message);
                    break;
                case SimCapiMessage.TYPES.API_CALL_RESPONSE:
                    this.apiInterface.processResponse(message);
                    break;
                case SimCapiMessage.TYPES.INITIAL_SETUP_COMPLETE:
                    handleInitialSetupComplete(message);
                    break;
                case SimCapiMessage.TYPES.RESIZE_PARENT_CONTAINER_RESPONSE:
                    handleResizeParentContainerResponse(message);
                    break;
                case SimCapiMessage.TYPES.ALLOW_INTERNAL_ACCESS:
                    setDomainToShortform();
                    break;
                case SimCapiMessage.TYPES.REGISTERED_LOCAL_DATA_CHANGED:
                    handleLocalDataChange(message);
                    break;
            }
        };

        function removeChangeListener(id) {
            delete changeListeners[id];
        }

        this.addChangeListener = function(changeListener) {
            var id = uuid();
            changeListeners[id] = changeListener;
            return removeChangeListener.bind(this, id);
        };

        this.removeAllChangeListeners = function() {
            changeListeners = {};
        };

        function removeConfigChangeListener(id) {
            delete configChangeListeners[id];
        }

        this.addConfigChangeListener = function(changeListener) {
            var id = uuid();
            configChangeListeners[id] = changeListener;
            return removeConfigChangeListener.bind(this, id);
        };

        this.removeAllConfigChangeListeners = function() {
            configChangeListeners = {};
        };

        /*
         * @since 0.55
         * Allows sims to watch for when the initial setup has been applied to the sim.
         *
         */
        var initialSetupComplete = false;
        this.addInitialSetupCompleteListener = function(listener) {
            if (initialSetupComplete) {
                throw new Error('Initial setup already complete. This listener will never be called');
            }
            initialSetupCompleteListeners.push(listener);
        };
        this.removeAllInitialSetupCompleteListeners = function() {
            initialSetupCompleteListeners = [];
        };
        var handleInitialSetupComplete = function(message) {
            if (initialSetupComplete || message.handshake.authToken !== handshake.authToken) {
                return;
            }
            for (var i = 0; i < initialSetupCompleteListeners.length; ++i) {
                initialSetupCompleteListeners[i](message);
            }
            initialSetupComplete = true;
        };

        /*
         * @since 0.6
         * Can listen to check complete event
         *
         */
        this.addCheckCompleteListener = function(listener, once) {
            callback.check.complete.push({
                handler: listener,
                once: once
            });
        };

        this.addCheckStartListener = function(listener, once) {
            callback.check.start.push({
                handler: listener,
                once: once
            });
        };

        var handshakeComplete = false;
        this.addHandshakeCompleteListener = function(listener) {
            if (handshakeComplete) {
                listener(handshake);
                return;
            }
            handshakeListeners.push(listener);
        };

        /*
         *   Handles the get data message
         */
        var handleGetDataResponse = function(message) {
            if (message.handshake.authToken === handshake.authToken) {
                if (message.values.responseType === 'success') {
                    getRequests[message.values.simId][message.values.key].onSuccess({
                        key: message.values.key,
                        value: message.values.value,
                        exists: message.values.exists
                    });
                } else if (message.values.responseType === 'error') {
                    getRequests[message.values.simId][message.values.key].onError(message.values.error);
                }

                var nextQueuedRequest = getRequests[message.values.simId][message.values.key].inQueue;

                delete getRequests[message.values.simId][message.values.key];

                if (nextQueuedRequest) {
                    self.getDataRequest(message.values.simId, message.values.key, nextQueuedRequest.onSuccess, nextQueuedRequest.onError);
                }
            }
        };

        /*
         *   Handles the set data message
         */
        var handleSetDataResponse = function(message) {
            if (message.handshake.authToken === handshake.authToken) {
                if (message.values.responseType === 'success') {
                    setRequests[message.values.simId][message.values.key].onSuccess({
                        key: message.values.key,
                        value: message.values.value
                    });
                } else if (message.values.responseType === 'error') {
                    setRequests[message.values.simId][message.values.key].onError(message.values.error);
                }

                var nextQueuedRequest = setRequests[message.values.simId][message.values.key].inQueue;

                delete setRequests[message.values.simId][message.values.key];

                if (nextQueuedRequest) {
                    self.setDataRequest(message.values.simId, message.values.key, nextQueuedRequest.value, nextQueuedRequest.onSuccess, nextQueuedRequest.onError, nextQueuedRequest.options);
                }
            }
        };


        /*
         * Sends the GET_DATA Request
         */
        this.getDataRequest = function(simId, key, onSuccess, onError) {
            check(simId).isString();
            check(key).isString();

            onSuccess = onSuccess || function() {};
            onError = onError || function() {};

            if(!iframeUtil.isInIframe() || iframeUtil.isInAuthor()) {
                LocalData.getData(simId, key, onSuccess);
                return true;
            }

            var getDataRequestMsg = new SimCapiMessage({
                type: SimCapiMessage.TYPES.GET_DATA_REQUEST,
                handshake: handshake,
                values: {
                    key: key,
                    simId: simId
                }
            });

            getRequests[simId] = getRequests[simId] || {};

            if (getRequests[simId][key]) {
                getRequests[simId][key].inQueue = {
                    onSuccess: onSuccess,
                    onError: onError
                };

                return false;
            }

            getRequests[simId][key] = {
                onSuccess: onSuccess,
                onError: onError
            };

            if (!handshake.authToken) {
                pendingMessages.forHandshake.push(getDataRequestMsg);
            } else {
                // send the message to the viewer
                self.sendMessage(getDataRequestMsg);
            }

            return true;
        };

        /*
         * Sends the SET_DATA Request
         */
        this.setDataRequest = function(simId, key, value, onSuccess, onError, options) {

            check(simId).isString();
            check(key).isString();
            check(value).isString();

            onSuccess = onSuccess || function() {};
            onError = onError || function() {};

            if(!iframeUtil.isInIframe() || iframeUtil.isInAuthor()) {
                LocalData.setData(simId, key, value, onSuccess);
                return true;
            }

            var setDataRequestMsg = new SimCapiMessage({
                type: SimCapiMessage.TYPES.SET_DATA_REQUEST,
                handshake: handshake,
                values: {
                    key: key,
                    value: value,
                    simId: simId
                },
                options: options
            });

            setRequests[simId] = setRequests[simId] || {};

            if (setRequests[simId][key]) {
                setRequests[simId][key].inQueue = {
                    value: value,
                    onSuccess: onSuccess,
                    onError: onError,
                    options: options
                };

                return false;
            }

            setRequests[simId][key] = {
                onSuccess: onSuccess,
                onError: onError
            };

            if (!handshake.authToken) {
                pendingMessages.forHandshake.push(setDataRequestMsg);
            } else {
                // send the message to the viewer
                self.sendMessage(setDataRequestMsg);
            }

            return true;
        };


        /*
         * Handles check complete event
         */
        var handleCheckCompleteResponse = function(message) {
            handleCheckResponse('complete', message);

            checkTriggered = false;
        };

        /*
         * Handles check start event. Does not get invoked if the sim triggers the check event.
         */
        var handleCheckStartResponse = function(message) {
            handleCheckResponse('start', message);
        };

        var handleCheckResponse = function(eventName, message) {
            var toBeRemoved = [];

            for (var i in callback.check[eventName]) {
                if(!callback.check[eventName].hasOwnProperty(i)){ continue; }

                callback.check[eventName][i].handler(message);

                if (callback.check[eventName][i].once) {
                    toBeRemoved.push(callback.check[eventName][i]);
                }
            }

            for (var r in toBeRemoved) {
                if(!toBeRemoved.hasOwnProperty(r)){ continue; }
                callback.check[eventName].splice(callback.check[eventName].indexOf(toBeRemoved[r]), 1);
            }
        };

        /*
         * Handles configuration changes to sharedsimdata
         */
        var handleConfigChangeMessage = function(message) {
            if (message.handshake.authToken === handshake.authToken) {
                handshake.config = message.handshake.config;
                callConfigChangeListeners(handshake.config);
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
                _.each(message.values, function(capiValue, key) {

                    // check if the key exists in the mapping and is writeable
                    if (capiValue && !capiValue.readonly) {

                        if (outgoingMap[key] && outgoingMap[key].value !== capiValue.value) {
                            //By calling set value, we parse the string of capiValue.value
                            //to whatever type the outgoingMap has stored
                            outgoingMap[key].setValue(capiValue.value);
                            changed.push(outgoingMap[key]);
                        } else if (!outgoingMap[key]) {
                            //key hasn't been exposed yet. Could be a dynamic capi property.
                            toBeApplied[key] = capiValue.value;
                            changed.push(new SimCapiValue({ value: capiValue.value, key: key }));
                        }
                    }
                });

                //Ensure that changed object has something in it.
                if (changed.length !== 0) {
                    callChangeListeners(changed);
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

                    //trigger queue
                    for (var i = 0; i < pendingMessages.forHandshake.length; ++i) {
                        self.sendMessage(pendingMessages.forHandshake[i]);
                    }
                    pendingMessages.forHandshake = [];
                }


                callConfigChangeListeners(handshake.config);
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

                handshakeListeners.forEach(function(listener) {
                    listener(handshake);
                });
                handshakeComplete = true;
                handshakeListeners = [];

                // send initial value snapshot
                self.notifyValueChange();
            }
            if (!iframeUtil.isInIframe()) {
                handleInitialSetupComplete({
                    handshake: handshake
                });
            }
        };

        /*
         * @since 0.4
         * Trigger a check event from the sim
         */
        this.triggerCheck = function(handlers) {
            if (checkTriggered) {
                throw new Error("You have already triggered a check event");
            }

            checkTriggered = true;

            handlers = handlers || {};

            if (handlers.complete) {
                self.addCheckCompleteListener(handlers.complete, true);
            }

            var triggerCheckMsg = new SimCapiMessage({
                type: SimCapiMessage.TYPES.CHECK_REQUEST,
                handshake: handshake
            });

            pendingMessages.forValueChange.push(triggerCheckMsg);

            //Ensure that there are no more set value calls to be able to send the message.
            self.notifyValueChange();
        };

        this.requestParentContainerResize = function(options, onSuccess) {
            onSuccess = onSuccess || function() {};
            var messageId = ++self.lastMessageId;
            var message = new SimCapiMessage({
                type: SimCapiMessage.TYPES.RESIZE_PARENT_CONTAINER_REQUEST,
                handshake: handshake,
                values: {
                    messageId: messageId,
                    width: options.width,
                    height: options.height
                }
            });
            this.messageCallbacks[messageId] = {
                onSuccess: onSuccess
            };
            if (!handshake.authToken) {
                pendingMessages.forHandshake.push(message);
            } else {
                self.sendMessage(message);
            }
        };
        var handleResizeParentContainerResponse = function(message) {
            var messageId = message.values.messageId;
            var callbacks = self.messageCallbacks[messageId];
            delete self.messageCallbacks[messageId];
            if (message.values.responseType === 'success') {
                callbacks.onSuccess();
            }
        };
        var setDomainToShortform = function() {
            if (domainUtil.getDomain().indexOf("smartsparrow.com") === -1) { return; }
            domainUtil.setDomain("smartsparrow.com");
        };
        this.requestInternalViewerAccess = function() {
            var message = new SimCapiMessage({
                type: SimCapiMessage.TYPES.ALLOW_INTERNAL_ACCESS,
                handshake: this.getHandshake()
            });
            self.sendMessage(message);
        };

        var handleLocalDataChange = function(message) {
            if (self.localDataChangedCallbacks[message.values.simId] && self.localDataChangedCallbacks[message.values.simId][message.values.key]) {
                self.localDataChangedCallbacks[message.values.simId][message.values.key](message.values.value);
            }
        };

        function unregisterLocalDataListener(simId, key) {
            delete self.localDataChangedCallbacks[simId][key];
        }

        /*
         * Register the sim to be notified when local data changes
         */
        this.registerLocalDataListener = function(simId, key, callback) {
            check(simId).isString();
            check(key).isString();

            var message = new SimCapiMessage({
                type: SimCapiMessage.TYPES.REGISTER_LOCAL_DATA_CHANGE_LISTENER,
                handshake: this.getHandshake(),
                values: {
                    key: key,
                    simId: simId
                }
            });

            self.localDataChangedCallbacks[simId] = self.localDataChangedCallbacks[simId] || {};
            self.localDataChangedCallbacks[simId][key] = callback;

            self.sendMessage(message);

            return unregisterLocalDataListener.bind(this, simId, key);
        };

        /*
         * Send a VALUE_CHANGE message to the viewer with a dump of the model.
         */
        this.notifyValueChange = function() {

            if (handshake.authToken) {

                if (currentTimeout === null) {
                    currentTimeout = setTimeout(function() {
                        //retrieve the VALUE_CHANGE message
                        var valueChangeMsg = self.createValueChangeMsg();

                        // send the message to the viewer
                        self.sendMessage(valueChangeMsg);

                        currentTimeout = null;

                        //trigger queue
                        for (var i = 0; i < pendingMessages.forValueChange.length; ++i) {
                            self.sendMessage(pendingMessages.forValueChange[i]);
                        }
                        pendingMessages.forValueChange = [];

                    }, timeoutAmount);
                }
            }
            return null;
        };

        /*
         *   Creates the value change message
         */
        this.createValueChangeMsg = function() {
            //retrieve the VALUE_CHANGE message
            var valueChangeMsg = new SimCapiMessage({
                type: SimCapiMessage.TYPES.VALUE_CHANGE,
                handshake: self.getHandshake()
            });

            // populate the message with the values of the entire model
            valueChangeMsg.values = outgoingMap;

            return valueChangeMsg;
        };

        this.setValue = function(simCapiValue) {
            check(simCapiValue).isOfType(SimCapiValue);

            outgoingMap[simCapiValue.key] = simCapiValue;

            this.notifyValueChange();
        };

        this.expose = function(simCapiValue) {
            check(simCapiValue).isOfType(SimCapiValue);

            var key = simCapiValue.key;
            var overwriteValue = checkForExistingValues(key);

            if (overwriteValue !== undefined) {
                simCapiValue.setValue(overwriteValue);
                callChangeListeners([simCapiValue]);

                 if (simCapiValue.value instanceof Array && (simCapiValue.type === SimCapiTypes.TYPES.ARRAY || simCapiValue.type === SimCapiTypes.TYPES.ARRAY_POINT)) {
                     simCapiValue.value = simCapiValue.toString();
                 }
            }

            outgoingMap[key] = simCapiValue;

            this.notifyValueChange();
        };

        var checkForExistingValues = function(key) {
            var noMapValue = toBeApplied[key],
                existingValue = outgoingMap[key],
                overwriteValue;

            if (noMapValue) {
                overwriteValue = noMapValue;
                delete toBeApplied[key];
            } else if (existingValue) {
                overwriteValue = existingValue.value;
            }

            return overwriteValue;
        };


        /*
         * key - the key of the SimCapiValue to be removed
         */
        this.removeValue = function(key) {
            outgoingMap[key] = null;

            this.notifyValueChange();
        };

        // Helper to send message to viewer
        this.sendMessage = function(message) {
            // window.parent can be itself if it's not inside an iframe
            if (iframeUtil.isInIframe()) {
                window.parent.postMessage(JSON.stringify(message), '*');
            }
        };

        // Calls all the changeListeners
        var callChangeListeners = function(values) {
            _.each(changeListeners, function(changeListener) {
                changeListener(values);
            });
        };

        // Calls all the configChangeListeners
        var callConfigChangeListeners = function(config) {
            _.each(configChangeListeners, function(changeListener) {
                changeListener(config);
            });
        };

        // Returns the initial configuration passed in the handshake
        this.getConfig = function() {
            return handshake.config;
        };


        // handler for postMessages received from the viewer
        var messageEventHandler = function(event) {
            var message;
            try {
                message = JSON.parse(event.data);
            } catch (e) {}

            if (message) {
                self.capiMessageHandler(message);
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
    var getInstance = function() {
        if (!_instance) {
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
