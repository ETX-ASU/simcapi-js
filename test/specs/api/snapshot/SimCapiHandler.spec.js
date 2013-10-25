/*global window, document sinon*/
define(function(require){

    var $               = require('jquery');
    var _               = require('underscore');
    var SimCapiHandler  = require('api/snapshot/SimCapiHandler');
    var SimCapiMessage  = require('api/snapshot/SimCapiMessage');
    var SharedSimData   = require('api/snapshot/SharedSimData');
    var SimCapiValue    = require('api/snapshot/SimCapiValue');
    var SnapshotSegment = require('api/snapshot/SnapshotSegment');
    require('sinon');

    $(document).ready(function(){
    describe('SimCapiHandler', function(){

        var $container = null;
        var handler = null;
        var sandbox = null;

        beforeEach(function() {
            sandbox = sinon.sandbox.create();
          
            $container = $(
                    '<div>' +
                        '<iframe id="iframe1"></iframe>' +
                        '<iframe id="iframe2"></iframe>' +
                        '<iframe id="iframe3" style="display:none"></iframe>' + // this should be ignored in the search
                    '</div>'
            );

            // add iframes to the dom
            $('body').append($container);

            // stub out event registration
            sandbox.stub(window, 'addEventListener', function(type, callback){
                expect(type).to.be('message');
                expect(callback).to.be.ok();
            });

            handler = new SimCapiHandler({
                $container : $container,
                ignoreHidden : true
            });

            // make sure it doesn't send any messages to iframe3 because it has display:none
            mockPostMessage('#iframe3', function(){
                expect(false).to.be(true);
            });
        });

        afterEach(function() {
            sandbox.restore();

            // remove from the dom
            $container.remove();
        });

        // Helper to mock postMessage event
        var mockPostMessage = function(assertCallback) {

            var callback = function(message, id) {
                expect(id).not.to.be('iframe3');
                assertCallback(message, id);
            };
            
            if (handler.sendMessage.hasOwnProperty('restore')) {
              handler.sendMessage.restore();
            }
            sandbox.stub(handler, 'sendMessage', callback);
        };

        it('should broadcast a reply to an HANDSHAKE_REQUEST message with a HANDSHAKE_RESPONSE', function() {
            // create a handshakerequest
            var message = new SimCapiMessage();
            message.type = SimCapiMessage.TYPES.HANDSHAKE_REQUEST;
            message.handshake = {
                requestToken : 'token1'
            };

            // remember tokens for each frame so we can check that they are different
            var iframe1Token = null;
            var iframe2Token = null;

            // mock out postMessage for all iframe windows
            mockPostMessage(function(response, id){
                expect(response.type).to.be(SimCapiMessage.TYPES.HANDSHAKE_RESPONSE);
                expect(response.handshake.requestToken).to.be('token1');

                // remember which token is assigned to which frame
                iframe1Token = id === 'iframe1' ? response.handshake.authToken : iframe1Token;
                iframe2Token = id === 'iframe2' ? response.handshake.authToken : iframe1Token;
            });

            handler.capiMessageHandler(message);

            // verify that all iframe tokens are different
            expect(iframe1Token).to.be.ok();
            expect(iframe2Token).to.be.ok();
            expect(iframe1Token !== iframe2Token).to.be(true);
            expect(handler.sendMessage.callCount).to.be(2);
        });

        /*
         * Helper to setup handshake to an iframe
         */
        var setupHandshake = function(iframeid, token) {
            // setup a handshake
            var handshakeMsg = new SimCapiMessage({
                type : SimCapiMessage.TYPES.HANDSHAKE_REQUEST,
                handshake : {
                    requestToken: token,
                    authToken: null
                }
            });

            var authToken = null;

            // mock the postMessage so we can remember the authToken
            mockPostMessage(function(response, id){
                authToken = id === iframeid ? response.handshake.authToken : authToken;
            });

            handler.capiMessageHandler(handshakeMsg);

            return authToken;
        };
        
        /*
         * Helper to fake that the sim is ready
         */
        var setupOnReady = function(iframeId, authToken) {
            // create an ON_READY messages
            var onReadyMsg = new SimCapiMessage({
                type : SimCapiMessage.TYPES.ON_READY,
                handshake : {
                    requestToken: null,
                    authToken : authToken
                }
            });

            handler.capiMessageHandler(onReadyMsg);
        };

        describe('notifyConfigChange', function() {
            
            var authToken = null;
            
            beforeEach(function() {
                authToken = setupHandshake('iframe1', 'token1');
                setupOnReady('iframe1', authToken);
            });
            
            it('should broadcast a CONFIG_CHANGE message', function() {
                mockPostMessage(function(response, id) {
                    expect(response.type).to.be(SimCapiMessage.TYPES.CONFIG_CHANGE);
                    expect(response.handshake.authToken).to.be(authToken);
                    
                    var exectedConfig = SharedSimData.getInstance().getData();
                    expect(response.handshake.config.lessonId).to.be(exectedConfig.lessonId);
                    expect(response.handshake.config.questionId).to.be(exectedConfig.questionId);
                    expect(response.handshake.config.baseUrl).to.be(exectedConfig.baseUrl);
                    expect(id).to.be('iframe1');
                });
                
                handler.notifyConfigChange();
                
                expect(handler.sendMessage.callCount).to.be(1);
            });
        });
        
        describe('getSnapshot', function(){

            var authToken = null;

            beforeEach(function(){
                // create handshake
                authToken = setupHandshake('iframe1', 'token1');
            });

            it('should return the snapshot remembered from a VALUE_CHANGE event', function(){
                
                // create a VALUE_CHANGE message with three values
                var valueChangeMsg = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake : {
                        requestToken : null,
                        authToken : authToken
                    },
                    values : {
                        value1 : new SimCapiValue({value: 'value1'}),
                        value2 : new SimCapiValue({value: 'value2'}),
                        value3 : new SimCapiValue({value: 'value3'})
                    }
                });
    
                // send the message to the handler
                handler.capiMessageHandler(valueChangeMsg);
    
                // retrieve the snapshot from the handler
                var snapshot = handler.getSnapshot(new SnapshotSegment('stage.iframe1'));
    
                // verify the snapshot contains three values that were sent in the VALUE_CHANGE message
                expect(_.size(snapshot)).to.be(3);
                expect(snapshot['iframe1.value1']).to.be('value1');
                expect(snapshot['iframe1.value2']).to.be('value2');
                expect(snapshot['iframe1.value3']).to.be('value3');
    
            });

            it('should return the descriptors remembered from a VALUE_CHANGE event', function(){

                // create a VALUE_CHANGE message with three values
                var valueChangeMsg = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake : {
                        requestToken : null,
                        authToken : authToken
                    },
                    values : {
                        value1 : new SimCapiValue({value: 'value1'}),
                        value2 : new SimCapiValue({value: 'value2'}),
                        value3 : new SimCapiValue({value: 'value3'})
                    }
                });
  
                // send the message to the handler
                handler.capiMessageHandler(valueChangeMsg);
  
                // retrieve the snapshot from the handler
                var descriptors = handler.getDescriptors(new SnapshotSegment('stage.iframe1'));
  
                // verify the snapshot contains three values that were sent in the VALUE_CHANGE message
                expect(_.size(descriptors)).to.be(3);
                expect(descriptors['iframe1.value1']).to.be(valueChangeMsg.values.value1);
                expect(descriptors['iframe1.value2']).to.be(valueChangeMsg.values.value2);
                expect(descriptors['iframe1.value3']).to.be(valueChangeMsg.values.value3);
  
            });
            
            it('should overwrite snapshot with the latest values retrieve from VALUE_CHANGE', function(){

                // create a VALUE_CHANGE message with one value
                var valueChangeMsg = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.VALUE_CHANGE,
                    handshake : {
                        requestToken : null,
                        authToken : authToken
                    },
                    values : {
                        value1 : new SimCapiValue({value: 'value1'})
                    }
                });

                // send the message to the handler
                handler.capiMessageHandler(valueChangeMsg);

                // retrieve the snapshot from the handler
                var snapshot = handler.getSnapshot(new SnapshotSegment('stage.iframe1'));

                // verify the snapshot contains one value
                expect(_.size(snapshot)).to.be(1);
                expect(snapshot['iframe1.value1']).to.be('value1');

                // create another VALUE_CHANGE message with three values, one of which overrides value1
                valueChangeMsg.values.value1 = new SimCapiValue({value: 'changed1'});
                valueChangeMsg.values.value2 = new SimCapiValue({value: 'value2'});
                valueChangeMsg.values.value3 = new SimCapiValue({value: 'value3'});

                // send the update message
                handler.capiMessageHandler(valueChangeMsg);

                // retrieve the updated snapshot
                snapshot = handler.getSnapshot(new SnapshotSegment('stage.iframe1'));

                // verify that the update has taken affect
                expect(_.size(snapshot)).to.be(3);
                expect(snapshot['iframe1.value1']).to.be('changed1');
                expect(snapshot['iframe1.value2']).to.be('value2');
                expect(snapshot['iframe1.value3']).to.be('value3');

            });

        });

        describe('removeIFrame', function(){

            var authToken = null;
            
            beforeEach(function() {
                authToken = setupHandshake('iframe1', 'token1');
                setupOnReady('ifram1', authToken);
            });
            
            it('should remove knowledge of the given sim', function() {
                mockPostMessage(function(response, iframeid) {});

                // send a snapshot to check if the iframe is known
                var segment = new SnapshotSegment('stage.iframe1.value', '1');
                handler.setSnapshot([segment]);
                expect(handler.sendMessage.callCount).to.be(1);
                
                // remove knowledge of the sim and send another snapshot
                handler.removeIFrame('iframe1');
                handler.setSnapshot([segment]);
                
                // should not send a message to the sim because its no longer known
                expect(handler.sendMessage.callCount).to.be(1);
                
                // verify that the snapshots and descriptors for that sim are deleted
                expect(Object.keys(handler.getSnapshot(segment)).length).to.be(0);
                expect(Object.keys(handler.getDescriptors(segment)).length).to.be(0);
            });
            
        });
        
        describe('setSnapshot', function(){

            it('should keep things pending until an ON_READY message has been recieved', function() {

                // create handshake
                var authToken = setupHandshake('iframe1', 'token1');

                var invoked = 0;
                mockPostMessage(function(response, iframeid){
                    // verify snapshot that is sent to the iframe
                    expect(response.type).to.be(SimCapiMessage.TYPES.VALUE_CHANGE);
                    expect(response.handshake.authToken).to.be(authToken);
                    expect(_.size(response.values)).to.be(1);
                    expect(response.values['value'].value).to.be('1');
                    expect(response.values['value'].type).to.be(SimCapiValue.TYPES.STRING);

                    expect(iframeid).to.be('iframe1');

                    invoked++;
                });

                // force a pending messages
                var segment = new SnapshotSegment('stage.iframe1.value', '1');
                handler.setSnapshot([segment]);

                // a quicker way of checking if the mock is invoked.
                expect(invoked).to.be(0);

                // create an ON_READY messages
                var onReadyMsg = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.ON_READY,
                    handshake : {
                        requestToken: null,
                        authToken : authToken
                    }
                });

                handler.capiMessageHandler(onReadyMsg);

                // a quicker way of checking if the mock is invoked.
                expect(invoked).to.be(1);
            });

            it('should NOT send snapshot immediately when a handshake has been established', function(){
                // create handshake
                setupHandshake('iframe2', 'token1');

                var invoked = 0;
                mockPostMessage(function(response, iframeid){
                    invoked++;
                });

                var segment = new SnapshotSegment('stage.iframe2.value2', '1');
                handler.setSnapshot([segment]);

                // a quicker way of checking if the mock is invoked.
                expect(invoked).to.be(0);
            });

            it('should send snapshot immediately when ON_READY has been established', function(){
                // create handshake
                var authToken = setupHandshake('iframe2', 'token1');

                var invoked = 0;
                mockPostMessage(function(response, iframeid){
                    // verify snapshot that is sent to the iframe
                    expect(response.type).to.be(SimCapiMessage.TYPES.VALUE_CHANGE);
                    expect(response.handshake.authToken).to.be(authToken);
                    expect(_.size(response.values)).to.be(1);
                    expect(response.values['value2'].value).to.be('1');
                    expect(response.values['value2'].type).to.be(SimCapiValue.TYPES.STRING);

                    expect(iframeid).to.be('iframe2');

                    invoked++;
                });

                // create an ON_READY messages
                var onReadyMsg = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.ON_READY,
                    handshake : {
                        requestToken: null,
                        authToken : authToken
                    }
                });

                handler.capiMessageHandler(onReadyMsg);

                // a quicker way of checking if the mock is invoked.
                expect(invoked).to.be(0);

                var segment = new SnapshotSegment('stage.iframe2.value2', '1');
                handler.setSnapshot([segment]);

                // a quicker way of checking if the mock is invoked.
                expect(invoked).to.be(1);
            });

            it('should handle multiple snapshots in a single call', function(){
                // create handshake
                var authToken = setupHandshake('iframe2', 'token1');

                var invoked = 0;
                mockPostMessage(function(response, iframeid){
                    // verify snapshot that is sent to the iframe
                    expect(response.type).to.be(SimCapiMessage.TYPES.VALUE_CHANGE);
                    expect(response.handshake.authToken).to.be(authToken);
                    expect(_.size(response.values)).to.be(3);

                    expect(iframeid).to.be('iframe2');

                    invoked++;
                });

                // create an ON_READY messages
                var onReadyMsg = new SimCapiMessage({
                    type : SimCapiMessage.TYPES.ON_READY,
                    handshake : {
                        requestToken: null,
                        authToken : authToken
                    }
                });

                handler.capiMessageHandler(onReadyMsg);

                handler.setSnapshot([new SnapshotSegment('stage.iframe2.value1', '1'),
                                     new SnapshotSegment('stage.iframe2.value2', '2'),
                                     new SnapshotSegment('stage.iframe2.value3', '3')]);

                // a quicker way of checking if the mock is invoked.
                expect(invoked).to.be(1);
            });

        });

    });
    });
});