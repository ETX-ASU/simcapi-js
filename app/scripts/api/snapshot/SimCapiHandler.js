/*global window */
define(function (require){

    var _               = require('underscore');
    var $               = require('jquery');
    var check           = require('common/check');
    var SimCapiMessage  = require('api/snapshot/SimCapiMessage');
    var SimCapiValue    = require('api/snapshot/SimCapiValue');
    var SnapshotSegment = require('api/snapshot/SnapshotSegment');
    var SharedSimData   = require('api/snapshot/SharedSimData');
    var Math            = require('api/snapshot/util/Math.uuid');

    var SimCapiHandler = function(options) {

        //check(options.$container).isOfType($);

        var $container = options.$container;
        var self = this;
        var tokenToId = {};
        var idToToken = {};
        var isReady = {};

        // Most up to date state of iframe capi values;
        var snapshot = {};

        /*
         * A list of snapshots that have not been applied to a sim.
         * This can occur, when the sim is not ready.
         */
        var pendingApplySnapshot = [];

        var windowEventHandler = function(event) {
            var message = JSON.parse(event.data);

            self.capiMessageHandler(message);
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
            }
        };

        /*
         * Update the snapshot with new values recieved from the appropriate iframe.
         */
        var updateSnapshot = function(authToken, values) {
            if (authToken && tokenToId[authToken]) {

                var iframeId = tokenToId[authToken];

                // enumerate through all value changes and update accordingly
                _.each(values, function(capiValue, key){
                    snapshot[iframeId + '.' + key] = capiValue.value;
                });
            }
        };

        var handleOnReadyMessage = function(message) {
            if (message && message.handshake && message.handshake.authToken &&
                    tokenToId[message.handshake.authToken]) {

                isReady[message.handshake.authToken] = true;
                sendPendingApplySnapshot(tokenToId[message.handshake.authToken]);
            }
        };

        /*
         * Filter and send any pending apply snapshots that has not been sent to
         * the given iframe associated with the given authToken.
         */
        var sendPendingApplySnapshot = function(id) {
            var remaining = [];
            var segmentsToSend = [];

            // filter out the segments for the given iframe.
            _.each(pendingApplySnapshot, function(segment, index){
                if (segment.path[1] !== id) {
                    remaining.push(segment);
                } else {
                    segmentsToSend.push(segment);
                }
            });

            // update the remaining pending and send the segments.
            pendingApplySnapshot = remaining;

            if (segmentsToSend.length > 0) {
                self.setSnapshot(segmentsToSend);
            }
        };

        /*
         * Broadcast a handshake reply to all iframes. Only the iframe with the
         * same requestToken should accept the message. Other iframes should ignore
         * any HANDSHAKE_RESPONSE that has a different response.
         */
        var replyToHandshake = function(handshake) {
            if (handshake.requestToken) {

                // go through all iframes and send a reply if needed
                _.each($container.find('iframe'), function(iframe, index){
                    var $iframe = $(iframe);
                    var id = $iframe.attr('id');

                    if (!idToToken[id]) {
                        // generate a token for the iframe if we haven't already
                        var token = Math.uuid();
                        tokenToId[token] = id;
                        idToToken[id] = token;
                        isReady[token] = false;
                    }

                    // create handshake response message
                    var response = new SimCapiMessage();
                    response.type = SimCapiMessage.TYPES.HANDSHAKE_RESPONSE;
                    response.handshake = {
                        requestToken: handshake.requestToken,
                        authToken   : idToToken[id],
                        // Config object is used to pass relevant information to the sim
                        // like the 'real' authToken (from AELP_WS cookie), the lesson id, etc.
                        config      : SharedSimData.getInstance().getData()
                    };

                    // send the response
                    self.sendMessage(response, id, true);
                });
            }
        };

        // clears the state machine
        this.resetState = function() {
            snapshot = {};
            tokenToId = {};
            idToToken = {};
            isReady = {};
        };

        this.resetSnapshot = function() {
            snapshot = {};
        };

        /*
         * Send the snapshot.
         * @param snapshotSegments is an array of SnapshotSegments
         */
        this.setSnapshot = function(snapshotSegments) {

            check(snapshotSegments).isArray();

            // a map of (iframeid, CapiMessage)
            var messages = {};

            _.each(snapshotSegments, function(segment, index){

                check(segment).isOfType(SnapshotSegment);

                // the id of the iframe is the second element in the snapshot path.
                // eg stage.iframe1.blah
                var iframeId = segment.path[1];

                // check if the sim is ready
                if (isReady[idToToken[iframeId]]) {

                    // map each segment to separate iframe windows.
                    if (!messages[iframeId]) {
                        messages[iframeId] = new SimCapiMessage({
                            type: SimCapiMessage.TYPES.VALUE_CHANGE,
                            handshake: {
                                requestToken: null,
                                authToken: idToToken[iframeId]
                            }
                        });
                    }

                    var variable = _.rest(segment.path, 2).join('.');
                    messages[iframeId].values[variable] = new SimCapiValue({
                        type: SimCapiValue.TYPES.STRING,
                        value: segment.value
                    });

                } else {
                    // The sim for this id is not ready so we keep it pending until it sends
                    // an ON_READY message.
                    pendingApplySnapshot.push(segment);
                }
            });

            // send message to each respective iframes
            _.each(messages, function(message, iframeid){
                self.sendMessage(message, iframeid);
            });
        };

        // can't mock postMessage in ie9 so we wrap it and mock the wrap :D
        this.sendMessage = function(message, iframeid, allowVisible) {
            // allow visible is needed for the flash side of things when the iframe begins as hidden
            // but still need to perform a handshake.
            $container.find('#' + iframeid)[0].contentWindow.postMessage(JSON.stringify(message), '*');
        };

        /*
         * Returns the snapshot for the given path.
         */
        this.getSnapshot = function(snapshotSegment) {
            check(snapshotSegment).isOfType(SnapshotSegment);

            var result = {};

            // target path looks something like this : iframeid[.var]*
            var targetPath = _.rest(snapshotSegment.path, 1).join('.');

            // filter paths which are contained or equal to the targetPath. eg, iframe1.stuff is
            // contained in iframe1
            _.each(snapshot, function(value, path){
                if (path.indexOf(targetPath) !== -1) {
                    result[path] = value;
                }
            });

            return result;
        };
    };

    return SimCapiHandler;

});