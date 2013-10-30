/*global window */
define([
  'underscore',
  'jquery',
  'check',
  'api/snapshot/SimCapiMessage',
  'api/snapshot/SimCapiValue',
  'api/snapshot/SnapshotSegment',
  'api/snapshot/SharedSimData',
  'api/snapshot/util/uuid'
],function (_, $, check, SimCapiMessage, SimCapiValue, SnapshotSegment, SharedSimData, uuid){

$.noConflict();
_.noConflict();

var SimCapiHandler = function(options) {

    var $container = options.$container;
    var ignoreHidden = options.ignoreHidden || false;
    var self = this;
    var tokenToId = {}; // token -> iframeid
    var idToToken = {}; // iframeid -> token
    var isReady = {}; // token -> true/false

    // Most up to date state of iframe capi values;
    var snapshot = {};
    // Most up to date descriptors of iframe properties.
    var descriptors = {};

    /*
     * Tranporter versions:
     * 0.2 - Rewrite of the client slide implementation
     * 0.1 - Added support for SimCapiMessage.TYPES.VALUE_CHANGE_REQUEST message allowing the handler to provoke the sim into sending all of its properties.
     */
    var idToSimVersion = {}; // iframeid -> version of Sim Capi used by iframe
    
    /*
     * A list of snapshots that have not been applied to a sim.
     * This can occur, when the sim is not ready.
     */
    var pendingApplySnapshot = [];

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
        }
    };
    
    /*
     * Update the snapshot with new values recieved from the appropriate iframe.
     */
    var updateSnapshot = function(authToken, values) {
        if (authToken && tokenToId[authToken]) {

            var iframeId = tokenToId[authToken];

            // enumerate through all value changes and update accordingly
            _.each(values, function(simCapiValue, key){
                snapshot[iframeId + '.' + key] = simCapiValue.value;
                descriptors[iframeId + '.' + key] = simCapiValue;
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

            var frames = $container.find('iframe');
            if (ignoreHidden) {
                frames = $container.find('iframe:visible');
            }
            
            // go through all iframes and send a reply if needed
            _.each(frames, function(iframe, index){
                var $iframe = $(iframe);
                var id = $iframe.attr('id');

                if (!idToToken[id]) {
                    // generate a token for the iframe if we haven't already
                    var token = uuid();
                    tokenToId[token] = id;
                    idToToken[id] = token;
                    isReady[token] = false;
                    idToSimVersion[id] = handshake.version ? handshake.version : 0;
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
                self.sendMessage(response, id);
            });
        }
    };

    // clears the state machine
    this.resetState = function() {
        this.resetSnapshot();
        tokenToId = {};
        idToToken = {};
        isReady = {};
        idToSimVersion = {};
    };

    this.resetSnapshot = function() {
        snapshot = {};
        descriptors = {};
    };
    
    // Delete the given iframe from the list of known sims.
    this.removeIFrame = function(iframeid) {
      var token = idToToken[iframeid];
      delete tokenToId[token]; // token -> iframeid
      delete idToToken[iframeid]; // iframeid -> token
      delete isReady[token]; // token -> true/false
      delete idToSimVersion[iframeid]; // iframeid -> simVersion

      _.each(snapshot, function(value, fullpath) {
          if (fullpath.indexOf(iframeid + '.') !== -1) {
              delete snapshot[iframeid];
              delete descriptors[iframeid];
          }
      });
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
                    key: variable,
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
        $.each(messages, function(iframeid, message){
            self.sendMessage(message, iframeid);
        });
    };

    // can't mock postMessage in ie9 so we wrap it and mock the wrap :D
    this.sendMessage = function(message, iframeid) {
        // allow visible is needed for the flash side of things when the iframe begins as hidden
        // but still need to perform a handshake.
        var frame = $container.find('#' + iframeid)[0]; 
        if (ignoreHidden) {
            frame = $container.find('#' + iframeid + ':visible')[0];
        }
        if (frame) {
            frame.contentWindow.postMessage(JSON.stringify(message), '*');
        } else {
            // the frame has been removed
            var token = idToToken[iframeid];
            delete tokenToId[token]; // token -> iframeid
            delete idToToken[iframeid]; // iframeid -> token
            delete isReady[token]; // token -> true/false

            _.each(snapshot, function(value, fullpath) {
                if (fullpath.indexOf('stage.' + iframeid) !== -1) {
                    delete snapshot[iframeid];
                    delete descriptors[iframeid];
                }
            });
        }
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
    
    /*
     * Returns descriptors for the properties that match the given path.
     * A descriptor is a SimCapiValue.
     */
    this.getDescriptors = function(snapshotSegment) {
        check(snapshotSegment).isOfType(SnapshotSegment);

        var result = {};

        // target path looks something like this : iframeid[.var]*
        var targetPath = _.rest(snapshotSegment.path, 1).join('.');

        // filter paths which are contained or equal to the targetPath. eg, iframe1.stuff is
        // contained in iframe1
        _.each(descriptors, function(value, path){
            if (path.indexOf(targetPath) !== -1) {
                result[path] = value;
            }
        });

        return result;
    };
    
    /*
     * Requests value change message 
     * @since 0.1
     */
    this.requestValueChange = function(iframeId) {
        if (!(idToSimVersion[iframeId] && idToSimVersion[iframeId] >= 0.1)) {
            throw new Error("Method requestValueChange is not supported by sim");
        }
        
        // create a message
        var message = new SimCapiMessage();
        message.type = SimCapiMessage.TYPES.VALUE_CHANGE_REQUEST;
        message.handshake = {
            authToken   : idToToken[iframeId],
            // Config object is used to pass relevant information to the sim
            // like the 'real' authToken (from AELP_WS cookie), the lesson id, etc.
            config      : SharedSimData.getInstance().getData()
        };

        this.sendMessage(message, iframeId);
    };
    
    /*
     * Notify clients that configuration is updated. (eg. the question has changed)
     */
    this.notifyConfigChange = function() {
        _.each(isReady, _.bind(function(ready, token) {
            if (ready) {
                // create handshake response message
                var message = new SimCapiMessage();
                message.type = SimCapiMessage.TYPES.CONFIG_CHANGE;
                message.handshake = {
                    authToken   : token,
                    // Config object is used to pass relevant information to the sim
                    // like the 'real' authToken (from AELP_WS cookie), the lesson id, etc.
                    config      : SharedSimData.getInstance().getData()
                };
                
                this.sendMessage(message, tokenToId[token]);
            }
        }, this));
    };
    
    /*
     * Returns version of Transporter, used by the iframe
     */
    this.getTransporterVersion = function (iframeId) {
        return idToSimVersion[iframeId];
    };
};

return SimCapiHandler;

});
