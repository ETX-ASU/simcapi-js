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

/*global window, sinon, setTimeout, clearTimeout*/
define(function(require) {

    var Transporter    = require('api/snapshot/Transporter').Transporter;
    var SimCapiValue   = require('api/snapshot/SimCapiValue');
    var SimCapiMessage = require('api/snapshot/SimCapiMessage');
    var SimCapiTypes   = require('api/snapshot/SimCapiTypes');
    var DomainUtils    = require('api/snapshot/util/domain');
    var sinon          = require('sinon');
    require('sinon-fakeTimers');

    describe('Transporter', function() {

        var requestToken = 'requestToken';
        var authToken = 'testToken';
        var transporter = null;
        var sandbox = null;
        var clock = null;
        var originalConfig = { state: 'old' };
        var updatedConfig = { state: 'new' };

        beforeEach(function() {
            sandbox = sinon.sandbox.create();

            // mock out event registration on the window
            sandbox.stub(window, 'addEventListener', function(eventType, callback) {
                expect(eventType).to.be('message');
                expect(callback).to.be.ok();
            });

            transporter = new Transporter({
                requestToken: requestToken
            });

            clock = sinon.useFakeTimers();
        });

        afterEach(function() {
            sandbox.restore();
            clock.restore();
        });

        /*
         * Helper to mock out PostMessage on the window object.
         */
        var mockPostMessage = function(assertCallback) {
            sandbox.stub(transporter, 'sendMessage', assertCallback);
        };

        /*
         * Helper to perform fake handshake between sim/viewer
         */
        var doHandShake = function() {
            // create a handshakeResponse message
            var handshakeResponse = new SimCapiMessage({
                type: SimCapiMessage.TYPES.HANDSHAKE_RESPONSE,
                handshake: {
                    requestToken: requestToken,
                    authToken: authToken,
                    config: originalConfig
                }
            });

            // process handshake response so it remembers the auth token
            transporter.capiMessageHandler(handshakeResponse);
        };

        /*
         *   Helper to test timeouts
         */
        var throttle = function(callback, timeAmount) {
            var timer;

            return function() {
                clearTimeout(timer);
                var args = [].slice.call(arguments);
                timer = setTimeout(function() {
                    callback.apply(this, args);
                }, timeAmount);
            };
        };

        describe('on window message', function() {
            var messageEventHandler, fakeMessageEvent;
            beforeEach(function() {
                messageEventHandler = window.addEventListener.getCall(0).args[1];

                var message = {
                    type: SimCapiMessage.TYPES.GET_DATA_REQUEST,
                    handshake: 'handshake',
                    values: {
                        key: 'key',
                        simId: 'simId'
                    }
                };

                fakeMessageEvent = { data: JSON.stringify(message) };

                sandbox.stub(transporter, 'capiMessageHandler');
            });

            it('should call the capiMessageHandler', function() {
                messageEventHandler(fakeMessageEvent);

                expect(transporter.capiMessageHandler.callCount).to.equal(1);
            });

            it('should do nothing if it was not a valid JSON string', function() {
                fakeMessageEvent.data = 'not a valid JSON you dummy';

                messageEventHandler(fakeMessageEvent);

                expect(transporter.capiMessageHandler.callCount).to.equal(0);
            });
        });

        describe('HANDSHAKE_REQUEST', function() {

            it('should send a requestHandshake when trying to send ON_READY notification', function() {

                // mock out handshake request upon initialization
                mockPostMessage(function(message) {
                    // verify that the handshake request has a request token
                    expect(message.type).to.be(SimCapiMessage.TYPES.HANDSHAKE_REQUEST);
                    expect(message.handshake.requestToken).to.be(requestToken);
                    expect(message.handshake.authToken).to.be(null);
                });

                transporter.notifyOnReady();

                expect(transporter.sendMessage.called).to.be(true);
            });

            it('should call the initial setup complete listeners when running locally', function() {
                var completeStub = sinon.stub();
                transporter.addInitialSetupCompleteListener(completeStub);

                transporter.notifyOnReady();

                expect(completeStub.called, 'initial setup complete listener called').to.equal(true);
            });

            it('should not call initial setup complete listeners when a message that isn\'t on is sent', function() {
                var completeStub = sinon.stub();
                transporter.addInitialSetupCompleteListener(completeStub);

                transporter.notifyValueChange();

                expect(completeStub.called, 'initial setup complete listener called').to.equal(false);
            });
        });

        describe('CONFIG_CHANGE', function() {

            beforeEach(function() {
                doHandShake();
                expect(transporter.getConfig()).to.be(originalConfig);
            });

            var updateConfig = function(token) {
                // process change event
                var configChangeMessage = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.CONFIG_CHANGE,
                    handshake: {
                        authToken: token,
                        config: updatedConfig
                    }
                });
                transporter.capiMessageHandler(configChangeMessage);
            };

            it('should ignore CONFIG_CHANGE when authToken does not match', function() {
                updateConfig('bad token');

                // verify that the config has not changed
                expect(transporter.getConfig()).to.be(originalConfig);
            });

            it('should update CONFIG_CHANGE when authToken matches', function() {
                updateConfig(authToken);

                // verify that the config has changed
                expect(transporter.getConfig()).to.be(updatedConfig);
            });

            it('should call all listeners', function() {
                var callback1 = sandbox.stub();
                var callback2 = sandbox.stub();
                transporter.addConfigChangeListener(callback1);
                transporter.addConfigChangeListener(callback2);
                updateConfig(authToken);

                expect(callback1.calledOnce).to.be(true);
                expect(callback1.calledWith(transporter.getConfig())).to.be(true);
                expect(callback2.calledOnce).to.be(true);
                expect(callback2.calledWith(transporter.getConfig())).to.be(true);
            });

            it('should call listeners with updated config', function() {
                var callback = sandbox.stub();
                transporter.addConfigChangeListener(callback);
                updateConfig(authToken);

                expect(callback.calledWith(updatedConfig)).to.be(true);
            });

            it('should not call any removed listeners', function() {
                var callback1 = sandbox.stub();
                var callback2 = sandbox.stub();
                var unlisten1 = transporter.addConfigChangeListener(callback1);
                transporter.addConfigChangeListener(callback2);
                unlisten1();
                updateConfig(authToken);

                expect(callback1.called).to.be(false);
                expect(callback2.called).to.be(true);
            });

            it('should not call any listeners when all removed', function() {
                var callback1 = sandbox.stub();
                var callback2 = sandbox.stub();
                transporter.addConfigChangeListener(callback1);
                transporter.addConfigChangeListener(callback2);
                transporter.removeAllConfigChangeListeners();
                updateConfig(authToken);

                expect(callback1.called).to.be(false);
                expect(callback2.called).to.be(false);
            });

            it('should not throw error if unsubscribe called multiple times', function() {
                var callback = sandbox.stub();
                var unlisten = transporter.addConfigChangeListener(callback);
                unlisten();
                expect(unlisten).to.not.throwException();
            });
        });

        describe('HANDSHAKE_RESPONSE', function() {
            beforeEach(function() {
              transporter.notifyOnReady();
            });

            it('should ignore HANDSHAKE_RESPONSE when requestToken does not match', function() {

                // create a handshakeResponse message with a different request token
                var handshakeResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.HANDSHAKE_RESPONSE,
                    handshake: {
                        requestToken: 'bad request token',
                        authToken: authToken
                    }
                });

                // mock out postMessage for ON_READY. This shouldn't be called
                mockPostMessage(function() {});

                transporter.capiMessageHandler(handshakeResponse);

                // verify that the message was not called
                expect(transporter.sendMessage.called).to.be(false);
            });

            it('should invoke handshake callbacks on HANDSHAKE_RESPONSE when requestToken does match', function() {
                var callback = sandbox.stub();
                transporter.addHandshakeCompleteListener(callback);

                // create a handshakeResponse message with correct request token
                var handshakeResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.HANDSHAKE_RESPONSE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: authToken
                    }
                });

                // mock out postMessage for ON_READY. This shouldn't be called
                mockPostMessage(function() {});

                transporter.capiMessageHandler(handshakeResponse);

                expect(transporter.sendMessage.called).to.be(true);
                expect(callback.called).to.be(true);
            });

            it('should not throw error if listen added after handshake completed', function() {
                // create a handshakeResponse message with correct request token
                var handshakeResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.HANDSHAKE_RESPONSE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: authToken
                    }
                });

                // mock out postMessage for ON_READY. This shouldn't be called
                mockPostMessage(function() {});
                transporter.capiMessageHandler(handshakeResponse);

                expect(function() {
                  transporter.addHandshakeCompleteListener(function(){});
                }).to.not.throwException();
            });

            it('should call the listener', function() {

               var handshakeResponse = new SimCapiMessage({
                   type: SimCapiMessage.TYPES.HANDSHAKE_RESPONSE,
                   handshake: {
                       requestToken: requestToken,
                       authToken: authToken
                   }
               });
               var first = sinon.stub();

               transporter.capiMessageHandler(handshakeResponse);
               transporter.addHandshakeCompleteListener(first);

                expect(first.called, 'first listener called').to.equal(true);
            });
        });

        describe('ON_READY', function() {

            it('should send ON_READY followed by a VALUE_CHANGE message when told', function() {

                doHandShake();

                var invoked = 0;
                var gotOnReady = -1;
                var gotValueChange = -1;

                var throttled = throttle(function() {
                    expect(gotOnReady < gotValueChange).to.be(true);
                }, 25);

                // mock out postMessage for ON_READY message
                mockPostMessage(function(message) {
                    // remember the order that we recieved messages
                    switch (message.type) {
                        case SimCapiMessage.TYPES.ON_READY:
                            gotOnReady = ++invoked;
                            break;
                        case SimCapiMessage.TYPES.VALUE_CHANGE:
                            gotValueChange = ++invoked;
                            break;
                    }

                    // verify that the tokens are remembered
                    expect(message.handshake.requestToken).to.be(requestToken);
                    expect(message.handshake.authToken).to.be(authToken);
                });

                transporter.notifyOnReady();
                throttled();

                clock.tick(25);

                // verify that a message was sent
                expect(transporter.sendMessage.called).to.be(true);
                expect(gotValueChange === 2).to.be(true);
            });

            it('should remember pending ON_READY notification and send it after a successful HANDSHAKE_RESPONSE', function() {

                var invoked = 0;
                var gotOnReady = -1;
                var gotValueChange = -1;

                transporter.getHandshake().authToken = null;

                var throttled = throttle(function() {
                    expect(gotOnReady < gotValueChange).to.be(true);
                }, 25);

                // mock out postMessage for ON_READY message
                mockPostMessage(function(message) {
                    // remember the order that we recieved messages
                    switch (message.type) {
                        case SimCapiMessage.TYPES.ON_READY:
                            gotOnReady = ++invoked;
                            break;
                        case SimCapiMessage.TYPES.VALUE_CHANGE:
                            gotValueChange = ++invoked;
                            break;
                    }
                });

                transporter.notifyOnReady();

                // verify that the notification was not sent
                expect(gotOnReady === gotValueChange).to.be(true);

                // create a handshakeResponse message
                var handshakeResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.HANDSHAKE_RESPONSE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: authToken
                    }
                });

                // process handshake response so it sends the pending notificaiton
                transporter.capiMessageHandler(handshakeResponse);

                throttled();

                clock.tick(25);

                // verify that a message was sent
                expect(transporter.sendMessage.called).to.be(true);
                expect(gotValueChange === 2).to.be(true);
            });

        });

        describe('VALUE_CHANGE', function() {

            var outgoingMap = null;

            beforeEach(function() {

                outgoingMap = {
                    // create three attributes (float, string and boolean types) with expected
                    // updates of:
                    // attr1 -> value1
                    // attr2 -> value2
                    // attr3 -> value3
                    // values 1-3 are NOT the current values.
                    // @see createAttr for more details
                    'these.are.fake.objects.attr1': createAttr(SimCapiTypes.TYPES.NUMBER, false, 'attr1', 0.222),
                    attr2: createAttr(SimCapiTypes.TYPES.STRING, false, 'attr2', 'value2'),
                    attr3: createAttr(SimCapiTypes.TYPES.BOOLEAN, false, 'attr3', true),
                    attr4: createAttr(SimCapiTypes.TYPES.BOOLEAN, false, 'attr4', false)
                };

                // create a new instance with outgoingMap parameters
                transporter = new Transporter({
                    requestToken: requestToken,
                    authToken: authToken,
                    outgoingMap: outgoingMap
                });

                transporter.removeAllChangeListeners();

            });

            // helper to create entries in outgoing map. expectedKey and expectedValue represent
            // expected updates. Eg, the value of expectedKey changes to expectedValue.
            var createAttr = function(type, readonly, expectedKey, expectedValue) {
                return new SimCapiValue({
                    type: type,
                    readonly: readonly,
                    key: expectedKey,
                    value: expectedValue
                });
            };

            /*
             * create a value change message that performs the following changes:
             * attr1 -> value1
             * attr2 -> value2
             * attr3 -> value3
             */
            var createGoodValueChangeMessage = function() {
                return new SimCapiMessage({
                    type: SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: authToken
                    },

                    // create two attribute changes as mentioned above
                    values: {
                        'these.are.fake.objects.attr1': new SimCapiValue({
                            key: 'attr1',
                            type: SimCapiTypes.TYPES.NUMBER,
                            value: 0.5
                        }),
                        'attr2': new SimCapiValue({
                            key: 'attr2',
                            type: SimCapiTypes.TYPES.STRING,
                            value: 'value2'
                        }),
                        'attr3': new SimCapiValue({
                            key: 'attr3',
                            type: SimCapiTypes.TYPES.BOOLEAN,
                            value: false
                        }),
                        'attr4': new SimCapiValue({
                            key: 'attr4',
                            type: SimCapiTypes.TYPES.BOOLEAN,
                            value: false
                        })
                    }
                });
            };

            it('should attempt to update the model when a VALUE_CHANGE message is recieved', function() {

                var valueChangeMsg = createGoodValueChangeMessage();

                var failed = true;
                transporter.addChangeListener(function() {
                    failed = false;
                });

                transporter.capiMessageHandler(valueChangeMsg);

                expect(failed).to.be(false);
            });

            it('should not call any removed listeners', function() {
                var callback1 = sandbox.stub();
                var callback2 = sandbox.stub();
                var unlisten1 = transporter.addChangeListener(callback1);
                transporter.addChangeListener(callback2);
                unlisten1();

                var valueChangeMsg = createGoodValueChangeMessage();

                transporter.capiMessageHandler(valueChangeMsg);

                expect(callback1.called).to.be(false);
                expect(callback2.called).to.be(true);
            });

            it('should not call any listeners when all removed', function() {
                var callback1 = sandbox.stub();
                var callback2 = sandbox.stub();
                transporter.addChangeListener(callback1);
                transporter.addChangeListener(callback2);
                transporter.removeAllChangeListeners();

                var valueChangeMsg = createGoodValueChangeMessage();

                transporter.capiMessageHandler(valueChangeMsg);

                expect(callback1.called).to.be(false);
                expect(callback2.called).to.be(false);
            });

            it('should not throw error if unsubscribe called multiple times', function() {
                var callback = sandbox.stub();
                var unlisten = transporter.addChangeListener(callback);
                unlisten();
                expect(unlisten).to.not.throwException();
            });

            it('should give false when a Boolean false VALUE_CHANGE is recieved', function() {

                var expectedValueChangeMsg = transporter.createValueChangeMsg();

                expect(expectedValueChangeMsg.values['these.are.fake.objects.attr1'].value).to.be(0.222);
                expect(expectedValueChangeMsg.values.attr2.value).to.be('value2');
                expect(expectedValueChangeMsg.values.attr3.value).to.be(true);
                expect(expectedValueChangeMsg.values.attr4.value).to.be(false);
            });

            it('should ignore VALUE_CHANGE message if values is undefined', function() {

                // create a bad value change message with values = undefined
                var badValueChangeMsg = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: authToken
                    },
                    values: undefined
                });

                var failed = false;
                transporter.addChangeListener(function(values) {
                    failed = true;
                });


                transporter.capiMessageHandler(badValueChangeMsg);

                // verify that nothing was updated
                expect(failed).to.be(false);
            });

            it('should ignore VALUE_CHANGE when authToken does not match', function() {

                // create a bad value change message with values = undefined
                var badValueChangeMsg = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: 'bad auth token'
                    },
                    values: undefined
                });

                var failed = false;
                transporter.addChangeListener(function(values) {
                    failed = true;
                });

                transporter.capiMessageHandler(badValueChangeMsg);

                // verify that nothing was updated
                expect(failed).to.be(false);
            });

            it('should not update readonly values', function() {

                var valueChangeMsg = createGoodValueChangeMessage();

                // change attr2 to be readonly
                outgoingMap.attr2.readonly = true;

                transporter.addChangeListener(function(values) {
                    //verify that two attrs get updated
                    expect(values.length).to.be(2);
                });

                transporter.capiMessageHandler(valueChangeMsg);

            });

            it('should send out value change event with unexposed properties', function() {
                var message = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: authToken
                    },
                    values: {
                        'unexposed': new SimCapiValue({
                            key: 'unexposed',
                            type: SimCapiTypes.TYPES.NUMBER,
                            value: 10
                        })
                    }
                });
                var stub = sinon.stub();
                transporter.addChangeListener(stub);

                transporter.capiMessageHandler(message);

                expect(stub.callCount).to.equal(1);
                var changes = stub.getCall(0).args[0];
                expect(changes.length).to.equal(1);
                expect(changes[0].key).to.equal('unexposed');
                expect(changes[0].value).to.equal(10);
            });
        });

        describe('VALUE_CHANGE_REQUEST', function() {

            // process change event
            var valueChangeRequestMessage = new SimCapiMessage({
                type: SimCapiMessage.TYPES.VALUE_CHANGE_REQUEST,
                handshake: {
                    authToken: authToken
                }
            });

            it('should send value change notification', function() {
                doHandShake();
                sandbox.stub(transporter, 'notifyValueChange', function() {});
                transporter.capiMessageHandler(valueChangeRequestMessage);
                expect(transporter.notifyValueChange.called).to.be(true);
            });

        });

        describe('CHECK_*', function() {
            var checkResponseMessage = new SimCapiMessage({
                type: SimCapiMessage.TYPES.CHECK_COMPLETE_RESPONSE,
                handshake: {
                    authToken: authToken
                }
            });

            it('should trigger check completion callback', function() {
                doHandShake();
                var onComplete = sandbox.stub();

                // trigger check
                transporter.triggerCheck({
                    complete: onComplete
                });

                transporter.capiMessageHandler(checkResponseMessage);
                expect(onComplete.called).to.be(true);
            });

            it('should not throw when it’s called with a different context', function() {
                doHandShake();
                var onComplete = sandbox.stub();
                var otherObject = {
                    triggerCheck: transporter.triggerCheck
                };
                var hasThrown = false;
                try {
                    otherObject.triggerCheck({
                        complete: onComplete
                    });
                } catch (err) {
                    hasThrown = true;
                }

                expect(hasThrown).to.equal(false);
            });
        });

        describe('GET_DATA_REQUEST', function() {
            var realParent;
            beforeEach(function(){
                realParent = window.parent;
                window.parent = {};
            });
            
            afterEach(function(){
                window.parent = realParent;
            });

            it('should place a get data request in pendingQueue', function() {

                mockPostMessage(function() {});

                transporter.getDataRequest('sim', 'key');

                expect(transporter.sendMessage.called).to.be(false);
            });

            it('should send a get data request', function() {
                doHandShake();
                // mock out handshake request upon initialization
                mockPostMessage(function(message) {
                    // verify that the handshake request has a request token
                    expect(message.type).to.be(SimCapiMessage.TYPES.GET_DATA_REQUEST);
                    expect(message.handshake.authToken).to.be("testToken");
                });

                transporter.getDataRequest('sim', 'key');

                expect(transporter.sendMessage.called).to.be(true);
            });

            it('should throw an error if simId or key is not given', function() {
                var failed = true;
                var failed2 = true;
                try {
                    transporter.getDataRequest(undefined, 'key');
                } catch (err) {
                    failed = false;
                }

                try {
                    transporter.getDataRequest('simId', undefined);
                } catch (err) {
                    failed2 = false;
                }

                expect(failed).to.be(false);
                expect(failed2).to.be(false);

            });

            describe('when not running inside an iFrame', function(){
                beforeEach(function(){
                    window.parent = window;
                });

                it('should get the data from sessionStorage if it exists', function(){
                    var callback = function(response){
                        expect(response.exists).to.be(true);
                        expect(response.value).to.be('testValue');
                    };

                    sandbox.stub(window, 'setTimeout');

                    window.sessionStorage.setItem('simId', JSON.stringify({key: 'testValue'}));
                    transporter.getDataRequest('simId', 'key', callback);
                    expect(window.setTimeout.callCount).to.be(1);
                    window.setTimeout.getCall(0).args[0]();
                    window.sessionStorage.removeItem('simId');
                });

                it('should say the the key does not exist if no key is found', function(){
                    var callback = function(response){
                        expect(response.exists).to.be(false);
                        expect(response.value).to.be(null);
                    };

                    sandbox.stub(window, 'setTimeout');

                    transporter.getDataRequest('simId', 'key', callback);
                    expect(window.setTimeout.callCount).to.be(1);
                    window.setTimeout.getCall(0).args[0]();
                });
            });

            describe('if there is already a pending request', function() {
                beforeEach(function() {
                    doHandShake();
                    mockPostMessage(function() {});

                    transporter.getDataRequest('sim', 'key');
                });

                it('should queue the next request, replacing any other request in the queue (UNTESTED) - and return false', function() {
                    expect(transporter.getDataRequest('sim', 'key')).to.be(false);
                });
            });
        });

        describe('GET_DATA_RESPONSE', function() {
            var realParent;
            beforeEach(function(){
                realParent = window.parent;
                window.parent = {
                    postMessage: sandbox.stub()
                };
            });

            afterEach(function(){
                window.parent = realParent;
            });

            it('should receive a get data response of success', function() {
                transporter.getDataRequest('sim', 'key', function(tData) {
                    expect(tData.key).to.equal('key');
                });

                doHandShake();
                var getDataResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.GET_DATA_RESPONSE,
                    handshake: {
                        authToken: authToken
                    },
                    values: {
                        responseType: "success",
                        simId: 'sim',
                        key: 'key'
                    }
                });

                transporter.capiMessageHandler(getDataResponse);
            });

            it('should receive a get data response of error', function() {
                var error = sinon.stub();
                transporter.getDataRequest('sim', 'key', function() {}, error);

                doHandShake();
                var getDataResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.GET_DATA_RESPONSE,
                    handshake: {
                        authToken: authToken
                    },
                    values: {
                        responseType: "error",
                        simId: 'sim',
                        key: 'key'
                    }
                });

                transporter.capiMessageHandler(getDataResponse);
                expect(error.called).to.equal(true);
            });

            it('should call the next queued getDataRequest if it exists', function() {
                var firstSuccessCallback = sandbox.stub();
                var secondSuccessCallback = sandbox.stub();

                transporter.getDataRequest('sim', 'key', firstSuccessCallback);
                transporter.getDataRequest('sim', 'key', secondSuccessCallback);

                doHandShake();
                var getDataResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.GET_DATA_RESPONSE,
                    handshake: {
                        authToken: authToken
                    },
                    values: {
                        responseType: "success",
                        simId: 'sim',
                        key: 'key'
                    }
                });

                sandbox.spy(transporter, 'getDataRequest');

                transporter.capiMessageHandler(getDataResponse);

                expect(transporter.getDataRequest.callCount).to.equal(1);
                expect(transporter.getDataRequest.getCall(0).args[0]).to.equal('sim');
                expect(transporter.getDataRequest.getCall(0).args[1]).to.equal('key');
                expect(transporter.getDataRequest.getCall(0).args[2]).to.equal(secondSuccessCallback);
            });
        });

        describe('SET_DATA_REQUEST', function() {
            var realParent;
            beforeEach(function(){
                realParent = window.parent;
                window.parent = {};
            });

            afterEach(function(){
                window.parent = realParent;
            });

            it('should place a set data request in pendingQueue', function() {

                mockPostMessage(function() {});

                transporter.setDataRequest('sim', 'key', 'value');

                expect(transporter.sendMessage.called).to.be(false);
            });

            it('should send a set data request', function() {
                doHandShake();
                // mock out handshake request upon initialization
                mockPostMessage(function(message) {
                    // verify that the handshake request has a request token
                    expect(message.type).to.be(SimCapiMessage.TYPES.SET_DATA_REQUEST);
                    expect(message.handshake.authToken).to.be("testToken");
                });

                transporter.setDataRequest('sim', 'key', 'value');

                expect(transporter.sendMessage.called).to.be(true);
            });

            it('should throw an error if simId or key is not given', function() {
                var failed = true;
                var failed2 = true;
                try {
                    transporter.setDataRequest(undefined, 'key');
                } catch (err) {
                    failed = false;
                }

                try {
                    transporter.setDataRequest('simId', undefined);
                } catch (err) {
                    failed2 = false;
                }

                expect(failed).to.be(false);
                expect(failed2).to.be(false);

            });

            it('should allow a setDataRequest call during the success callback', function() {
                doHandShake();
                mockPostMessage(function() {});

                transporter.setDataRequest('sim', 'key', 'value', function() {
                    transporter.setDataRequest('sim', 'key', 'value2');
                });

                var setDataResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.SET_DATA_RESPONSE,
                    handshake: {
                        authToken: authToken
                    },
                    values: {
                        responseType: "success",
                        simId: 'sim',
                        key: 'key',
                        value: 'value'
                    }
                });

                transporter.capiMessageHandler(setDataResponse);

                expect(transporter.sendMessage.callCount).to.equal(2);
            });

            describe('when not running inside an iFrame', function(){
                beforeEach(function(){
                    window.parent = window;
                });

                it('should set the data on sessionStorage', function(){
                    transporter.setDataRequest('simId', 'key', 'testValue');
                    expect(window.window.sessionStorage.getItem('simId')).to.be(JSON.stringify({key: 'testValue'}));
                    window.sessionStorage.removeItem('simId');
                });

                it('should add to the existing simID', function(){
                    transporter.setDataRequest('simId', 'key', 'testValue');
                    transporter.setDataRequest('simId', 'key1', 'testValue1');
                    expect(window.window.sessionStorage.getItem('simId')).to.be(JSON.stringify({key: 'testValue', key1: 'testValue1'}));
                    window.sessionStorage.removeItem('simId');
                });

                it('should override existing values', function(){
                    transporter.setDataRequest('simId', 'key', 'testValue');
                    transporter.setDataRequest('simId', 'key', 'testValue1');
                    expect(window.window.sessionStorage.getItem('simId')).to.be(JSON.stringify({key: 'testValue1'}));
                    window.sessionStorage.removeItem('simId');
                });

                it('should async call the success callback', function(){
                    var callback = sandbox.stub();

                    sandbox.stub(window, 'setTimeout');
                    transporter.setDataRequest('simId', 'key', 'testValue', callback);
                    expect(window.setTimeout.callCount).to.be(1);
                    window.setTimeout.getCall(0).args[0]();
                    expect(callback.callCount).to.be(1);
                    window.sessionStorage.removeItem('simId');
                });
            });

            describe('if there is already a pending request', function() {
                beforeEach(function() {
                    doHandShake();
                    mockPostMessage(function() {});

                    transporter.setDataRequest('sim', 'key', 'newValue');
                });

                it('should queue the next request, replacing any other request in the queue (UNTESTED) - and return false', function() {
                    expect(transporter.setDataRequest('sim', 'key', 'newValue')).to.be(false);
                });
            });
        });

        describe('SET_DATA_RESPONSE', function() {
            var realParent;
            beforeEach(function(){
                realParent = window.parent;
                window.parent = {
                    postMessage: sandbox.stub()
                };
            });

            afterEach(function(){
                window.parent = realParent;
            });
            it('should receive a set data response of success', function() {
                transporter.setDataRequest('sim', 'key', 'value', function(tData) {
                    expect(tData.key).to.equal('key');
                });

                doHandShake();
                var setDataResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.SET_DATA_RESPONSE,
                    handshake: {
                        authToken: authToken
                    },
                    values: {
                        responseType: "success",
                        simId: 'sim',
                        key: 'key',
                        value: 'value'
                    }
                });

                transporter.capiMessageHandler(setDataResponse);
            });

            it('should receive a set data response of error', function() {
                var error = sinon.stub();
                transporter.setDataRequest('sim', 'key', 'value', function() {}, error);

                doHandShake();
                var setDataResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.SET_DATA_RESPONSE,
                    handshake: {
                        authToken: authToken
                    },
                    values: {
                        responseType: "error",
                        simId: 'sim',
                        key: 'key'
                    }
                });

                transporter.capiMessageHandler(setDataResponse);
                expect(error.called).to.equal(true);
            });

            it('should call the next queued setDataRequest if it exists', function() {
                var firstSuccessCallback = sandbox.stub();
                var secondSuccessCallback = sandbox.stub();

                transporter.setDataRequest('sim', 'key', 'value1', firstSuccessCallback);
                transporter.setDataRequest('sim', 'key', 'value2', secondSuccessCallback);

                doHandShake();
                var setDataResponse = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.SET_DATA_RESPONSE,
                    handshake: {
                        authToken: authToken
                    },
                    values: {
                        responseType: "success",
                        simId: 'sim',
                        key: 'key',
                        value: 'value1'
                    }
                });

                sandbox.spy(transporter, 'setDataRequest');

                transporter.capiMessageHandler(setDataResponse);

                expect(transporter.setDataRequest.callCount).to.equal(1);
                expect(transporter.setDataRequest.getCall(0).args[0]).to.equal('sim');
                expect(transporter.setDataRequest.getCall(0).args[1]).to.equal('key');
                expect(transporter.setDataRequest.getCall(0).args[2]).to.equal('value2');
                expect(transporter.setDataRequest.getCall(0).args[3]).to.equal(secondSuccessCallback);
            });
        });

        describe('SET_VALUE', function() {
            var message;
            beforeEach(function() {
                message = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: authToken
                    },
                    values: {
                        'attr1': new SimCapiValue({
                            key: 'attr1',
                            type: SimCapiTypes.TYPES.NUMBER,
                            value: 0.5
                        })
                    }
                });

                doHandShake();
            });

            it('should apply the value from a message sent before the set of the value in the transporter', function() {

                sandbox.stub(transporter, 'notifyValueChange', function() {});

                transporter.capiMessageHandler(message);

                var exposedProperty = new SimCapiValue({
                    key: 'attr1',
                    type: SimCapiTypes.TYPES.NUMBER,
                    value: 10
                });

                transporter.expose(exposedProperty);

                expect(exposedProperty.value).to.equal(0.5);

                //setting the value again shouldn't set the value to 0.5
                exposedProperty = new SimCapiValue({
                    key: 'attr1',
                    type: SimCapiTypes.TYPES.NUMBER,
                    value: 15
                });

                transporter.setValue(exposedProperty);

                expect(exposedProperty.value).to.equal(15);
            });

        });

        describe('INITIAL_SETUP_COMPLETE', function() {
            var message;
            beforeEach(function() {
                message = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.INITIAL_SETUP_COMPLETE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: authToken
                    }
                });

                doHandShake();
            });

            it('should call every registered handler', function() {
                var first = sinon.stub(),
                    second = sinon.stub();
                transporter.addInitialSetupCompleteListener(first);
                transporter.addInitialSetupCompleteListener(second);

                transporter.capiMessageHandler(message);

                expect(first.called, 'first listener called').to.equal(true);
                expect(second.called, 'second listener called').to.equal(true);
            });

            it('should not call anything if the handlers are removed', function() {
                var stubListener = sinon.stub();
                transporter.addInitialSetupCompleteListener(stubListener);

                transporter.removeAllInitialSetupCompleteListeners();
                transporter.capiMessageHandler(message);

                expect(stubListener.called, 'listener called').to.equal(false);
            });

            it('should do nothing if the auth token is wrong', function() {
                message.handshake.authToken = 42;
                var stubListener = sinon.stub();
                transporter.addInitialSetupCompleteListener(stubListener);

                transporter.capiMessageHandler(message);

                expect(stubListener.called, 'listener called').to.equal(false);
            });

            it('should not call listeners if another message is received', function() {
                var stubListener = sinon.stub();
                transporter.addInitialSetupCompleteListener(stubListener);

                transporter.capiMessageHandler(message);
                transporter.capiMessageHandler(message);

                expect(stubListener.callCount).to.equal(1);
            });

            describe('adding listeners', function() {
                it('should throw after initial setup has been completed', function() {
                    transporter.capiMessageHandler(message);

                    expect(function() {
                        transporter.addInitialSetupCompleteListener(sinon.stub());
                    }).to.throwException();
                });
            });
        });

        describe('API_CALL_RESPONSE', function() {
            it('should notify the API Service instance', function() {
                sandbox.stub(transporter.apiInterface, 'processResponse');
                var response = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.API_CALL_RESPONSE,
                    handshake: {
                        authToken: authToken
                    }
                });
                transporter.capiMessageHandler(response);
                expect(transporter.apiInterface.processResponse.callCount).to.equal(1);
            });
        });

        describe('EXPOSING_VALUE_AGAIN', function() {
            it('should apply the existing value if a property has been exposed before', function() {
                sandbox.stub(transporter, 'notifyValueChange', function() {});

                var exposedProperty = new SimCapiValue({
                    key: 'attr1',
                    type: SimCapiTypes.TYPES.NUMBER,
                    value: 10
                });

                transporter.expose(exposedProperty);

                expect(exposedProperty.value).to.equal(10);

                //exposing the value again should keep the value at the existing one
                exposedProperty = new SimCapiValue({
                    key: 'attr1',
                    type: SimCapiTypes.TYPES.NUMBER,
                    value: 15
                });

                transporter.expose(exposedProperty);

                expect(exposedProperty.value).to.equal(10);
            });
            it('should have consistent behaviour even if that value is false', function() {
                sandbox.stub(transporter, 'notifyValueChange', function() {});

                var exposedProperty = new SimCapiValue({
                    key: 'attr1',
                    type: SimCapiTypes.TYPES.BOOLEAN,
                    value: false
                });

                transporter.expose(exposedProperty);

                expect(exposedProperty.value).to.equal(false);

                //exposing the value again should keep the value at the existing one
                exposedProperty = new SimCapiValue({
                    key: 'attr1',
                    type: SimCapiTypes.TYPES.BOOLEAN,
                    value: true
                });

                transporter.expose(exposedProperty);

                expect(exposedProperty.value).to.equal(false);
            });
        });

        describe('Exposing a value that was waiting to be applied', function() {
            it('should stringify the array before sending the message to the platform', function() {
                var toBeAppliedCapiArray = new SimCapiValue({
                    key: 'arrayProp',
                    type: SimCapiTypes.TYPES.ARRAY,
                    value: [1,2,3]
                });
                
                var toBeApplied = {};
                toBeApplied[toBeAppliedCapiArray.key] = toBeAppliedCapiArray.value;
                
                var transporter = new Transporter({
                    authToken: 'token',
                    toBeApplied: toBeApplied
                });
                sandbox.stub(transporter, 'sendMessage');
                
                transporter.expose(toBeAppliedCapiArray);
                clock.tick(25);

                var changedValues = transporter.sendMessage.getCall(0).args[0].values;
                expect(changedValues['arrayProp'].value).to.equal('[1,2,3]');
            });

            it('should not change a value that is already a string containing an array', function() {
                var toBeAppliedCapiArray = new SimCapiValue({
                    key: 'arrayProp',
                    type: SimCapiTypes.TYPES.ARRAY,
                    value: '[foo bye,bar,baz]'
                });

                var toBeApplied = {};
                toBeApplied[toBeAppliedCapiArray.key] = toBeAppliedCapiArray.value;

                var transporter = new Transporter({
                    authToken: 'token',
                    toBeApplied: toBeApplied
                });
                sandbox.stub(transporter, 'sendMessage');

                transporter.expose(toBeAppliedCapiArray);
                clock.tick(25);

                var changedValues = transporter.sendMessage.getCall(0).args[0].values;
                expect(changedValues['arrayProp'].value).to.equal('[foo bye,bar,baz]');
            });

            it('should stringify the array correctly when an array property has been exposed twice', function() {
                var transporter = new Transporter({ authToken: 'token' });
                sandbox.stub(transporter, 'sendMessage');
                
                var simCapiValue = new SimCapiValue({
                    key: 'arrayProp',
                    type: SimCapiTypes.TYPES.ARRAY,
                    value: [1,2,3]
                });
                simCapiValue.value = simCapiValue.toString(); // mimic adapter functionality, where arrays are stringified before reaching the transporter
                
                transporter.expose(simCapiValue);
                clock.tick(25); // wait till first value change timeout has completed
                transporter.expose(simCapiValue);
                clock.tick(25);
                
                expect(transporter.sendMessage.getCall(1).args[0].values['arrayProp'].value).to.equal('[1,2,3]');
            });
        });

        describe('RESIZE_PARENT_CONTAINER request and response', function() {
            var options, onSuccess;
            beforeEach(function() {
                options = {
                  width: {
                    type: 'relative',
                    value: -10
                  },
                  height: {
                    type: 'absolute',
                    value: 300
                  }
                };
                onSuccess = sandbox.stub();

                sandbox.stub(transporter, 'sendMessage');
                transporter.lastMessageId = 11;
            });

            it('should send the request when authToken', function() {
                doHandShake();

                transporter.requestParentContainerResize(options, onSuccess);

                expect(transporter.sendMessage.callCount).to.be(1);
                expect(transporter.sendMessage.firstCall.args.length).to.be(1);

                var message = transporter.sendMessage.firstCall.args[0];
                expect(message.type).to.be(SimCapiMessage.TYPES.RESIZE_PARENT_CONTAINER_REQUEST);
                expect(message.handshake).to.be.ok();
                expect(message.values.messageId).to.be(12);
                expect(message.values.width).to.be(options.width);
                expect(message.values.height).to.be(options.height);

                expect(transporter.lastMessageId).to.be(12);
                expect(transporter.messageCallbacks[12].onSuccess).to.be(onSuccess);
            });

            it('handles response', function() {
                doHandShake();
                transporter.requestParentContainerResize(options, onSuccess);

                var response = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.RESIZE_PARENT_CONTAINER_RESPONSE,
                    handshake: {
                        requestToken: requestToken,
                        authToken: authToken
                    },
                    values: {
                        messageId: 12,
                        responseType: 'success'
                    }
                });

                transporter.capiMessageHandler(response);

                expect(onSuccess.callCount).to.be(1);
            });
        });

        describe('ALLOW_INTERNAL_ACCESS', function() {
            var fakeGoodDomain, fakeBadDomain, response;
            beforeEach(function() {
                response = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.ALLOW_INTERNAL_ACCESS,
                    handshake: {
                        authToken: authToken
                    }
                });

                fakeGoodDomain = 'https://aelp.smartsparrow.com/w/lessons';
                fakeBadDomain = 'https://store.randomcompany.com/w/lessons';

                sandbox.stub(DomainUtils, 'getDomain');
                sandbox.stub(DomainUtils, 'setDomain');
            });
            
            it('should set domain to "smartsparrow.com" if it is a valid domain', function() {
                DomainUtils.getDomain.returns(fakeGoodDomain);

                transporter.capiMessageHandler(response);

                expect(DomainUtils.setDomain.callCount).to.equal(1);
                expect(DomainUtils.setDomain.getCall(0).args[0]).to.equal("smartsparrow.com");
            });

            it('should not set any domain if the current domain is not valid', function() {
                DomainUtils.getDomain.returns(fakeBadDomain);

                transporter.capiMessageHandler(response);

                expect(DomainUtils.setDomain.callCount).to.equal(0);
            });
        });

        describe('method: requestInternalViewerAccess', function() {
            beforeEach(function() {
                doHandShake();
                sandbox.stub(transporter, 'sendMessage');
            });

            it('should call the internal sendMessage function', function() {
                transporter.requestInternalViewerAccess();

                expect(transporter.sendMessage.called).to.be(true);
            });

            it('should pass a pre-defined message', function() {
                transporter.requestInternalViewerAccess();

                var message = transporter.sendMessage.getCall(0).args[0];

                expect(message.type).to.equal(SimCapiMessage.TYPES.ALLOW_INTERNAL_ACCESS);
                expect(message.handshake).to.not.equal(undefined);
                expect(message.handshake.requestToken).to.equal(requestToken);
                expect(message.handshake.authToken).to.equal(authToken);
            });
        });

        describe('REGISTERED_LOCAL_DATA_CHANGED', function() {
            var response, localDataChangeCallback;
            beforeEach(function() {
                response = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.REGISTERED_LOCAL_DATA_CHANGED,
                    handshake: {
                        authToken: authToken
                    },
                    values: {
                        simId: 'sim',
                        key: 'key',
                        value: 'newValue'
                    }
                });

                localDataChangeCallback = sandbox.stub();

                transporter.localDataChangedCallbacks['sim'] = {};
                transporter.localDataChangedCallbacks['sim']['key'] = localDataChangeCallback;
            });

            it('should call the callback associated with the sim and key pair', function() {
                transporter.capiMessageHandler(response);

                expect(localDataChangeCallback.callCount).to.equal(1);
            });

            it('should call pass the new value to the callback', function() {
                transporter.capiMessageHandler(response);

                expect(localDataChangeCallback.getCall(0).args[0]).to.equal('newValue');
            });
        });

        describe('method: registerLocalDataListener', function() {
            var callbackStub;

            beforeEach(function() {
                doHandShake();
                sandbox.stub(transporter, 'sendMessage');
                callbackStub = sandbox.stub();
            });

            it('should call the internal sendMessage function', function() {
                transporter.registerLocalDataListener('sim', 'key', callbackStub);

                expect(transporter.sendMessage.called).to.be(true);
            });

            it('should pass a pre-defined message', function() {
                transporter.registerLocalDataListener('sim', 'key', callbackStub);

                var message = transporter.sendMessage.getCall(0).args[0];

                expect(message.type).to.equal(SimCapiMessage.TYPES.REGISTER_LOCAL_DATA_CHANGE_LISTENER);
                expect(message.handshake).to.not.equal(undefined);
                expect(message.handshake.requestToken).to.equal(requestToken);
                expect(message.handshake.authToken).to.equal(authToken);
                expect(message.values.key).to.equal('key');
                expect(message.values.simId).to.equal('sim');
            });
            
            it('should store the callback in the local data changed callback map under the simId and key pair', function() {
                transporter.registerLocalDataListener('sim', 'key', callbackStub);

                expect(transporter.localDataChangedCallbacks['sim']['key']).to.be(callbackStub);
            });

            it('should return a function to unregister the listener', function() {
                var unregister = transporter.registerLocalDataListener('sim', 'key', callbackStub);

                expect(transporter.localDataChangedCallbacks['sim']['key']).to.be(callbackStub);

                unregister();

                expect(transporter.localDataChangedCallbacks['sim']['key']).to.be(undefined);
            });
        });
    });
});
