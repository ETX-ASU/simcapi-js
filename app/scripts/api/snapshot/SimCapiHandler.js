/*global window */
define([
    'underscore',
    'jquery',
    'check',
    './SimCapiMessage',
    './SimCapiValue',
    './SnapshotSegment',
    './SharedSimData',
    './util/uuid',
    './server/ApiInterface',
    './SimCapiBindingManager',
    './SimCapiAppManager',
    './AppTypes'
], function(_, $, check, SimCapiMessage, SimCapiValue, SnapshotSegment, SharedSimData, uuid, ApiInterface,
        SimCapiBindingManager, SimCapiAppManager, AppTypes) {

    var SimCapiHandler = function(options) {

        var $container = options.$container;
        var $beagleContainer = options.$beagleContainer;
        var ignoreHidden = options.ignoreHidden || false;
        var self = this;

        var appManager = new SimCapiAppManager();

        options.callback = options.callback || {};
        var callback = {
            check: options.callback.check,
            onSnapshotChange: options.callback.onSnapshotChange,
            onGetDataRequest: options.callback.onGetDataRequest,
            onSetDataRequest: options.callback.onSetDataRequest,
            onApiCallRequest: options.callback.onApiCallRequest
        };

        // Most up to date state of iframe capi values;
        var snapshot = {};

        // Most up to date descriptors of iframe properties.
        var descriptors = {};

        /*
         * A queue of messages to be sent to sims.
         * Messages are added to this when the sim is not ready.
         * Queues are iframe specific
         */
        var pendingMessages = {};

        /*
         * A set of tokens that are pending on check responses
         */
        var pendingCheckResponses = {};

        this.apiInterface = new ApiInterface.create(this, callback.onApiCallRequest);

        var windowEventHandler = function(event) {
            var message;
            try {
                message = JSON.parse(event.data);
                self.capiMessageHandler(message);
            } catch (error) {
                // do nothing if data is not json
            }
        };

        // attach event listener to postMessages
        window.addEventListener('message', windowEventHandler);

        /*
         * A router to call appropriate functions for handling different types of CapiMessages.
         */
        this.capiMessageHandler = function(message) {
            switch (message.type) {
                case SimCapiMessage.TYPES.HANDSHAKE_REQUEST:
                    replyToHandshake(message.handshake);
                    break;
                case SimCapiMessage.TYPES.ON_READY:
                    handleOnReadyMessage(message);
                    break;
                case SimCapiMessage.TYPES.VALUE_CHANGE:
                    updateSnapshot(message.handshake.authToken, message.values);
                    break;
                case SimCapiMessage.TYPES.CHECK_REQUEST:
                    handleCheckTrigger(message);
                    break;
                case SimCapiMessage.TYPES.GET_DATA_REQUEST:
                    handleGetData(message);
                    break;
                case SimCapiMessage.TYPES.SET_DATA_REQUEST:
                    handleSetData(message);
                    break;
                case SimCapiMessage.TYPES.API_CALL_REQUEST:
                    this.apiInterface.processRequest(message);
                    break;
            }
        };

        /*
         * @since 0.5
         * Handles the get data
         */
        var handleGetData = function(message) {
            // create a message
            var responseMessage = new SimCapiMessage();
            responseMessage.type = SimCapiMessage.TYPES.GET_DATA_RESPONSE;
            responseMessage.handshake = {
                authToken: message.handshake.authToken,
                config: SharedSimData.getInstance().getData()
            };

            if (callback.onGetDataRequest) {
                callback.onGetDataRequest({
                    key: message.values.key,
                    simId: message.values.simId,
                    onSuccess: function(key, value, exists) {
                        //broadcast response
                        responseMessage.values = {
                            simId: message.values.simId,
                            key: message.values.key,
                            value: value,
                            exists: exists,
                            responseType: "success"
                        };

                        self.sendMessage(responseMessage);
                    },
                    onError: function(error) {
                        //broadcast response
                        responseMessage.values = {
                            simId: message.values.simId,
                            key: message.values.key,
                            error: error,
                            responseType: "error"
                        };

                        self.sendMessage(responseMessage);
                    }
                });
            }
        };

        /*
         * @since 0.5
         * Handles the set data
         */
        var handleSetData = function(message) {
            var responseMessage = new SimCapiMessage();
            responseMessage.type = SimCapiMessage.TYPES.SET_DATA_RESPONSE;
            responseMessage.handshake = {
                authToken: message.handshake.authToken,
                config: SharedSimData.getInstance().getData()
            };

            if (callback.onSetDataRequest) {
                callback.onSetDataRequest({
                    key: message.values.key,
                    value: message.values.value,
                    simId: message.values.simId,
                    onSuccess: function() {
                        //broadcast response
                        responseMessage.values = {
                            simId: message.values.simId,
                            key: message.values.key,
                            value: message.values.value,
                            responseType: "success"
                        };

                        self.sendMessage(responseMessage);
                    },
                    onError: function(error) {
                        //broadcast response
                        responseMessage.values = {
                            simId: message.values.simId,
                            key: message.values.key,
                            error: error,
                            responseType: "error"
                        };

                        self.sendMessage(responseMessage);
                    }
                });
            }
        };

        /*
         * @since 0.4
         * Handles the check trigger
         */
        var handleCheckTrigger = function(message) {
            pendingCheckResponses[message.handshake.authToken] = true;

            // only trigger check event when we aren't waiting for a response
            if (Object.keys(pendingCheckResponses).length >= 1) {
                if (callback.check) {
                    callback.check();
                }
            }
        };

        /*
         * @since 0.6
         * Replaced notifyCheckResponse
         * Notify clients that check has been completed
         */
        this.notifyCheckCompleteResponse = function() {
            // create a message
            var message = new SimCapiMessage();
            message.type = SimCapiMessage.TYPES.CHECK_COMPLETE_RESPONSE;
            message.handshake = {
                // Config object is used to pass relevant information to the sim
                // like the lesson id, etc.
                config: SharedSimData.getInstance().getData()
            };

            // reset the pending check responses
            var remainingResponses = pendingCheckResponses;
            pendingCheckResponses = {};

            // broadcast check complete response to each sim
            _.each(remainingResponses, function(value, authToken) {
                message.handshake.authToken = authToken;
                self.sendMessage(message);
            });
        };

        /*
         * @since 0.6
         * Notify clients that check has been clicked
         */
        this.notifyCheckStartResponse = function() {
            //create message
            var message = new SimCapiMessage();
            message.type = SimCapiMessage.TYPES.CHECK_START_RESPONSE;
            message.handshake = {
                config: SharedSimData.getInstance().getData()
            };

            // broadcast check start response to each sim

            _.each(appManager.getApps(), function(app) {
                var appUUID = app.getUUID();
                message.handshake.authToken = appUUID;
                pendingCheckResponses[appUUID] = true;
                self.sendMessage(message);
            });
        };

        /*
         * Update the snapshot with new values received from the appropriate iframe.
         */
        var updateSnapshot = function(appUUID, values) {
            var app = appManager.getAppByUUID(appUUID);
            if (appUUID && app) {
                var capiPrefix = app.getCapiPrefix();

                // enumerate through all value changes and update accordingly
                _.each(values, function(simCapiValue, key) {
                    var capiPropertyName = capiPrefix + '.' + key;
                    if (simCapiValue === null) {
                        delete snapshot[capiPropertyName];
                        delete descriptors[capiPropertyName];
                        SimCapiBindingManager.removeBinding(capiPropertyName);
                    } else {
                        snapshot[capiPropertyName] = simCapiValue.value;
                        descriptors[capiPropertyName] = simCapiValue;
                        if (simCapiValue.bindTo) {
                            SimCapiBindingManager.addBinding(appUUID, capiPropertyName, simCapiValue.bindTo);
                        }
                    }
                });

                // this is used in the platform to do work when things change
                if (callback.onSnapshotChange) {
                    callback.onSnapshotChange();
                }
            }
        };

        var handleOnReadyMessage = function(message) {
            var appUUID = message && message.handshake && message.handshake.authToken;
            var app = appManager.getAppByUUID(appUUID);
            if (appUUID && app) {
              app.setReady(true);
              sendPendingMessages(appUUID);
            }
        };

        /*
         * Filter and send any pending apply snapshots that has not been sent to
         * the given iframe associated with the given authToken.
         */
        var sendPendingMessages = function(appUUID) {
            _.each(pendingMessages[appUUID], self.sendMessage, self);
            delete pendingMessages[appUUID];
        };


        var getContainer = function(appType) {
          return appType === AppTypes.BEAGLE ? $beagleContainer: $container;
        };

        var getIFrames = function(appType) {
          var $iframes = getContainer(appType).find('iframe');
          if (appType === AppTypes.SIM && ignoreHidden) {
            $iframes = $iframes.filter(':visible');
          }
          return $iframes;
        };


        var doHandshakeResponse = function(requestToken, appUUID) {
            var response = new SimCapiMessage();
            response.type = SimCapiMessage.TYPES.HANDSHAKE_RESPONSE;
            response.handshake = {
                requestToken: requestToken,
                authToken: appUUID,
                config: SharedSimData.getInstance().getData()
            };
            self.sendMessage(response);
        };

        var extractIdFromBeagleIframeId = function(iframeId) {
            return iframeId.split('_').splice(1).join('_');
        };

        /*
         * Broadcast a handshake reply to all iframes. Only the iframe with the
         * same requestToken should accept the message. Other iframes should ignore
         * any HANDSHAKE_RESPONSE that has a different response.
         */
        var replyToHandshake = function(handshake) {
            if (handshake.requestToken) {
                _.each(getIFrames(AppTypes.SIM), function(iframe) {
                    var $iframe = $(iframe);
                    var app = appManager.getApp(AppTypes.SIM, $iframe.attr('id'), $iframe.data('qid'));
                    if (!app.hasMetadata()) {
                        app.setMetadata({
                            transportVersion: handshake.version,
                            iframe: iframe
                        });
                        app.setReady(false);
                    }
                    doHandshakeResponse(handshake.requestToken, app.getUUID());
                });

                _.each(getIFrames(AppTypes.BEAGLE), function(iframe) {
                    var $iframe = $(iframe);
                    var appId = extractIdFromBeagleIframeId($iframe.attr('id'));
                    var app = appManager.getApp(AppTypes.BEAGLE, appId);
                    if (!app.hasMetadata()) {
                        app.setMetadata({
                            transportVersion: handshake.version,
                            iframe: iframe
                        });
                        app.setReady(false);
                    }
                    doHandshakeResponse(handshake.requestToken, app.getUUID());
                });
            }
        };

        var matchesPath = function(target, path) {
            if (target.length <= path.length) {
                // e.g. targetPath = ['iframe', 'propertyA']; anything starting with iframe.propertyA.* will be added
                for (var i = 0; i < target.length; i++) {
                    if (target[i].length > 0 && target[i] !== path[i]) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };

        // clears the state machine
        this.resetState = function() {
            this.resetSnapshot();
            appManager.reset();
        };

        this.resetSnapshot = function() {
            snapshot = {};
            descriptors = {};
        };

        // Delete the given iframe from the list of known sims.
        this.removeIFrame = function(appId, questionId, appType) {
            var app = appManager.getApp(appType, appId, questionId);
            var appUUID = app.getUUID();

            SimCapiBindingManager.removeAppBindings(appUUID);
            self.resetSnapshotForApp(app);
            appManager.removeApp(app);
        };

        this.resetSnapshotForApp = function(app) {
            var capiPrefix = app.getCapiPrefix();

            _.each(snapshot, function(value, fullpath) {
                if (fullpath.indexOf(capiPrefix) !== -1) {
                    delete snapshot[fullpath];
                    delete descriptors[fullpath];
                }
            });
        };

        /*
         * Send the snapshot.
         * @param snapshotSegments is an array of SnapshotSegments
         */
        this.setSnapshot = function(snapshotSegments, questionId) {
            check(snapshotSegments).isArray();

            var messages = _.reduce(snapshotSegments, function(messages, segment, index) {
                check(segment).isOfType(SnapshotSegment);

                // the id of the iframe is the second element in the snapshot path.
                // eg stage.iframe1.blah
                var appType = segment.path[0] === 'stage' ? AppTypes.SIM : AppTypes.BEAGLE;
                var iframeId = segment.path[1];
                var app = appManager.getApp(appType, iframeId, questionId);
                var appUUID = app.getUUID();

                // map each segment to separate iframe windows.
                if (!messages[appUUID]) {
                    messages[appUUID] = new SimCapiMessage({
                        type: SimCapiMessage.TYPES.VALUE_CHANGE,
                        handshake: {
                            requestToken: null,
                            authToken: appUUID
                        }
                    });
                }

                var variable = _.drop(segment.path, 2).join('.');
                messages[appUUID].values[variable] = new SimCapiValue({
                    key: variable,
                    type: SimCapiValue.TYPES.STRING,
                    value: segment.value
                });
            });

            _.each(messages, this.sendMessage, this);
        };

        // can't mock postMessage in ie9 so we wrap it and mock the wrap :D
        this.sendMessage = function(message) {
            var appUUID = message.handshake.authToken;
            var app = appManager.getAppByUUID(appUUID);

            if (message.type !== SimCapiMessage.TYPES.HANDSHAKE_RESPONSE && !app.isReady()) {
                pendingMessages[appUUID] = pendingMessages[appUUID] || [];
                pendingMessages[appUUID].push(message);
                return;
            }

            var success = this.sendMessageToFrame(message);
            if (!success) {
                self.resetSnapshotForApp(app);
            }
        };

        // NOTE: Do not try to stub window.postMessage due to IE9 not allowing it
        // Tests should run in all supported browsers
        // This method should almost never be used directly, use send message instead.
        this.sendMessageToFrame = function(message) {
            var appUUID = message.handshake.authToken;

            var app = appManager.getAppByUUID(appUUID);
            if (!app) {
              return false;
            }

            var $frame = app.getIFrame();
            if (!$frame) {
                return false;
            }

            $frame.contentWindow.postMessage(JSON.stringify(message), '*');
            return true;
        };

        var pathFilterHelper = function(snapshotSegment, obj) {
            check(snapshotSegment).isOfType(SnapshotSegment);

            var matchingKeys = _(obj).keys().filter(function(v) {
              return _.startsWith(v, snapshotSegment.fullPath);
            }).value();

            return _.pick(obj, matchingKeys);
        };

        /*
         * Returns the snapshot for the given path.
         */
        this.getSnapshot = function(snapshotSegment) {
            return pathFilterHelper(snapshotSegment, snapshot);
        };

        /*
         * Returns descriptors for the properties that match the given path.
         * A descriptor is a SimCapiValue.
         */
        this.getDescriptors = function(snapshotSegment) {
            return pathFilterHelper(snapshotSegment, descriptors);
        };

        /*
         * Requests value change message
         * @since 0.1
         */
        this.requestValueChange = function(compositeId) {
//            var appUUID = compositeIdToUUID[compositeId];
//            var simVersion = getSimVersion(appUUID);
//
//            if (!(simVersion && simVersion >= 0.1)) {
//                throw new Error("Method requestValueChange is not supported by sim");
//            }
//
//            var message = new SimCapiMessage();
//            message.type = SimCapiMessage.TYPES.VALUE_CHANGE_REQUEST;
//            message.handshake = {
//                authToken: appUUID,
//                config: SharedSimData.getInstance().getData()
//            };
//            this.sendMessage(message);
        };

        /*
         * Notify clients that configuration is updated. (eg. the question has changed)
         */
        this.notifyConfigChange = function() {
            _(appManager.getReadyApps()).each(function(app) {
                var message = new SimCapiMessage();
                message.type = SimCapiMessage.TYPES.CONFIG_CHANGE;
                message.handshake = {
                    authToken: app.getUUID(),
                    config: SharedSimData.getInstance().getData()
                };
                this.sendMessage(message);
            }, this);
        };

        /*
         * @since 0.55
         * Notify clients that initial setup has been completely sent to them
         */
        this.notifyInitializationComplete = function(appType, iframeId, questionId) {
            var app = appManager.getApp(appType, iframeId, questionId);

            var message = new SimCapiMessage();
            message.type = SimCapiMessage.TYPES.INITIAL_SETUP_COMPLETE;
            message.handshake = {
                authToken: app.getUUID()
            };
            this.sendMessage(message);
        };


        /*
         * @since 0.90
         */
        this.getBeagleAppDescriptors = function() {
            var snapshot = {};

            _.each(appManager.getBeagleApps(), function(v) {
              var snapshotSegment = new SnapshotSegment(v.getCapiPrefix());
              _.extend(snapshot, self.getDescriptors(snapshotSegment));
            }, self);

            return snapshot;
        };
    };

    return SimCapiHandler;
});
