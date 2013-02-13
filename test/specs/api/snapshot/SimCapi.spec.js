/*global window */
define(function(require){

    var SimCapi = require('api/snapshot/SimCapi').SimCapi;
    var SimCapiValue = require('api/snapshot/SimCapiValue');
    var SimCapiMessage = require('api/snapshot/SimCapiMessage');

    describe('SimCapi', function() {

        var requestToken = 'requestToken';
        var authToken = 'testToken';
        var simCapi = null;

        beforeEach(function() {
            // mock out event registration on the window
            spyOn(window, 'addEventListener').andCallFake(function(eventType, callback){
                expect(eventType).toBe('message');
                expect(callback).toBeTruthy();
            });

            simCapi = new SimCapi({
                requestToken : requestToken
            });
        });

        /*
         * Helper to mock out PostMessage on the window object.
         */
        var mockPostMessage = function(assertCallback) {
            // mock out postMessage on the window object
            if (simCapi.sendMessage.isSpy) {
                simCapi.sendMessage.reset();
                simCapi.sendMessage.andCallFake(assertCallback);
            } else {
                spyOn(simCapi, 'sendMessage').andCallFake(assertCallback);
            }
        };

        describe('HANDSHAKE_REQUEST', function(){

            it('should send a requestHandshake when trying to send ON_READY notification', function() {

                // mock out handshake request upon initialization
                mockPostMessage(function(message){
                    // verify that the handshake request has a request token
                    expect(message.type).toBe(SimCapiMessage.TYPES.HANDSHAKE_REQUEST);
                    expect(message.handshake.requestToken).toBe(requestToken);
                    expect(message.handshake.authToken).toBe(null);
                });

                simCapi.notifyOnReady();

                expect(window.addEventListener).toHaveBeenCalled();
                expect(simCapi.sendMessage).toHaveBeenCalled();
            });

        });

        describe('HANDSHAKE_RESPONSE', function() {

            it('should ignore HANDSHAKE_RESPONSE when requestToken does not match', function(){

                // create a handshakeResponse message with a different request token
                var handshakeResponse = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.HANDSHAKE_RESPONSE,
                    handshake : {
                        requestToken : 'bad request token',
                        authToken : authToken
                    }
                });

                // mock out postMessage for ON_READY. This shouldn't be called
                mockPostMessage(function(){});

                simCapi.capiMessageHandler(handshakeResponse);

                // verify that the message was not called
                expect(simCapi.sendMessage).not.toHaveBeenCalled();
            });

        });

        describe('ON_READY', function() {

            it ('should send ON_READY followed by a VALUE_CHANGE message when told', function() {

                // create a handshakeResponse message
                var handshakeResponse = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.HANDSHAKE_RESPONSE,
                    handshake : {
                        requestToken: requestToken,
                        authToken: authToken
                    }
                });

                // process handshake response so it remembers the auth token
                simCapi.capiMessageHandler(handshakeResponse);

                var invoked = 0;
                var gotOnReady = -1;
                var gotValueChange = -1;

                // mock out postMessage for ON_READY message
                mockPostMessage(function(message) {
                    // remember the order that we recieved messages
                    switch(message.type) {
                    case SimCapiMessage.TYPES.ON_READY:
                        gotOnReady = ++invoked; break;
                    case SimCapiMessage.TYPES.VALUE_CHANGE:
                        gotValueChange = ++invoked; break;
                    }

                    // verify that the tokens are remembered
                    expect(message.handshake.requestToken).toBe(requestToken);
                    expect(message.handshake.authToken).toBe(authToken);
                });

                simCapi.notifyOnReady();

                // verify that a message was sent
                expect(simCapi.sendMessage).toHaveBeenCalled();
                expect(gotOnReady < gotValueChange).toBe(true);
            });

            it('should remember pending ON_READY notification and send it after a succesfull HANDSHAKE_RESPONSE', function(){

                var invoked = 0;
                var gotOnReady = -1;
                var gotValueChange = -1;

                // mock out postMessage for ON_READY message
                mockPostMessage(function(message) {
                    // remember the order that we recieved messages
                    switch(message.type) {
                    case SimCapiMessage.TYPES.ON_READY:
                        gotOnReady = ++invoked; break;
                    case SimCapiMessage.TYPES.VALUE_CHANGE:
                        gotValueChange = ++invoked; break;
                    }
                });

                simCapi.notifyOnReady();

                // verify that the notification was not sent
                expect(gotOnReady === gotValueChange).toBe(true);

                // create a handshakeResponse message
                var handshakeResponse = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.HANDSHAKE_RESPONSE,
                    handshake : {
                        requestToken: requestToken,
                        authToken: authToken
                    }
                });

                // process handshake response so it sends the pending notificaiton
                simCapi.capiMessageHandler(handshakeResponse);

                // verify that a message was sent
                expect(simCapi.sendMessage).toHaveBeenCalled();
                expect(gotOnReady < gotValueChange).toBe(true);
            });

        });

        describe('VALUE_CHANGE', function(){

            var outgoingMap = null;

            beforeEach(function(){

                outgoingMap = {
                    // create two attributes (float and string types) with expected
                    // updates of:
                    // attr1 -> value1
                    // attr2 -> value2
                    // value1 and value2 are NOT the current values.
                    // @see createAttr for more details
                    attr1 : createAttr(SimCapi.TYPES.NUMBER, false, 'attr1', 0.222),
                    attr2 : createAttr(SimCapi.TYPES.STRING, false, 'attr2', 'value2')
                };

                // create a new instance with outgoingMap parameters
                simCapi = new SimCapi({
                    requestToken : requestToken,
                    authToken : authToken,
                    outgoingMap : outgoingMap
                });
            });

            // helper to create entries in outgoing map. expectedKey and expectedValue represent
            // expected updates. Eg, the value of expectedKey changes to expectedValue.
            var createAttr = function(type, readOnly, expectedKey, expectedValue) {
                return {
                    type : type,
                    parent : {
                        set : function(key, value) {
                            // verify that the value is updated
                            expect(key).toBe(expectedKey);
                            expect(value).toBe(expectedValue);
                        }
                    },
                    readOnly : readOnly
                };
            };

            /*
             * create a value change message that performs the following changes:
             * attr1 -> value1
             * attr2 -> value2
             */
            var createGoodValueChangeMessage = function() {
                return new SimCapiMessage({
                    type : SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake : {
                        requestToken : requestToken,
                        authToken : authToken
                    },

                    // create two attribute changes as mentioned above
                    values : {
                        'attr1' : new SimCapiValue({
                            type : SimCapi.TYPES.STRING,
                            value : '0.222'
                        }),
                        'attr2' : new SimCapiValue({
                            type : SimCapi.TYPES.STRING,
                            value : 'value2'
                        })
                    }
                });
            };

            it('should attempt to update the model when a VALUE_CHANGE message is recieved', function(){

                var valueChangeMsg = createGoodValueChangeMessage();

                // spy on simCapi to verify that values are updated. Verifying that the updates are correct are
                // performed @ createAttr
                spyOn(outgoingMap.attr1.parent, 'set').andCallThrough();
                spyOn(outgoingMap.attr2.parent, 'set').andCallThrough();

                simCapi.capiMessageHandler(valueChangeMsg);

                // verify that there were two updates
                expect(outgoingMap.attr1.parent.set).toHaveBeenCalled();
                expect(outgoingMap.attr2.parent.set).toHaveBeenCalled();
            });

            it('should ignore VALUE_CHANGE message if values is undefined', function(){

                // create a bad value change message with values = undefined
                var badValueChangeMsg = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake : {
                        requestToken : requestToken,
                        authToken : authToken
                    },
                    values : undefined
                });

                spyOn(outgoingMap.attr1.parent, 'set').andCallThrough();
                spyOn(outgoingMap.attr2.parent, 'set').andCallThrough();

                simCapi.capiMessageHandler(badValueChangeMsg);

                // verify that nothing was updated
                expect(outgoingMap.attr1.parent.set).not.toHaveBeenCalled();
                expect(outgoingMap.attr2.parent.set).not.toHaveBeenCalled();
            });

            it('should ignore VALUE_CHANGE when authToken does not match', function(){

                // create a bad value change message with values = undefined
                var badValueChangeMsg = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake : {
                        requestToken : requestToken,
                        authToken : 'bad auth token'
                    },
                    values : undefined
                });

                spyOn(outgoingMap.attr1.parent, 'set').andCallThrough();
                spyOn(outgoingMap.attr2.parent, 'set').andCallThrough();

                simCapi.capiMessageHandler(badValueChangeMsg);

                // verify that nothing was updated
                expect(outgoingMap.attr1.parent.set).not.toHaveBeenCalled();
                expect(outgoingMap.attr2.parent.set).not.toHaveBeenCalled();
            });

            it('should not update readonly values', function(){

                var valueChangeMsg = createGoodValueChangeMessage();

                // change attr2 to be readonly
                outgoingMap.attr2.readonly = true;

                spyOn(outgoingMap.attr1.parent, 'set').andCallThrough();
                spyOn(outgoingMap.attr2.parent, 'set').andCallThrough();

                simCapi.capiMessageHandler(valueChangeMsg);

                // verify that only attr1 is updated
                expect(outgoingMap.attr1.parent.set).toHaveBeenCalled();
                expect(outgoingMap.attr2.parent.set).not.toHaveBeenCalled();

            });

        });

    });

});