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

/*globals sinon*/
define(function(require) {
    var ApiInterface = require('api/snapshot/ApiInterface');
    var Transporter = require('api/snapshot/Transporter');
    var SimCapiMessage = require('api/snapshot/SimCapiMessage');
    var apiList = require('api/snapshot/config/apiList');
    require('sinon');

    describe('ApiInterface', function() {
        var underTest, transporter, originalApiList;
        var sandbox = sinon.sandbox.create();

        beforeEach(function() {
            originalApiList = {};
            for (var i in apiList) {
                originalApiList[i] = apiList[i];
                delete apiList[i];
            }

            apiList.testApi = ['method1', 'method2'];

            transporter = Transporter.getInstance();
            underTest = ApiInterface.create(transporter);

            sandbox.stub(transporter, 'sendMessage');
        });

        afterEach(function() {
            for (var i in apiList) {
                delete apiList[i];
            }
            for (var j in originalApiList) {
                apiList[j] = originalApiList[j];
            }
            sandbox.restore();
        });

        describe('static method: create', function() {
            it('should throw if the transporter is not sent', function() {
                expect(function() {
                    ApiInterface.create();
                }).to.throwError();
                expect(function() {
                    ApiInterface.create({});
                }).to.throwError();
            });
            it('should return an instance of the ApiInterface class', function() {
                var apiService = ApiInterface.create(Transporter.getInstance());
                expect(apiService).to.be.an(ApiInterface);
            });
            it('should set the transporter reference on the created instance', function() {
                var apiService = ApiInterface.create(Transporter.getInstance());
                expect(apiService.transporter).to.be(Transporter.getInstance());
            });
        });

        describe('method: callApi', function() {
            it('should throw the service name not allowed', function() {
                expect(function() {
                    underTest.apiCall();
                }).to.throwError();
                expect(function() {
                    underTest.apiCall('otherService');
                }).to.throwError();
            });
            it('should throw if api method is not allowed', function() {
                expect(function() {
                    underTest.apiCall('testApi');
                }).to.throwError();
                expect(function() {
                    underTest.apiCall('testApi', 'method3');
                }).to.throwError();
            });
            it('should send a message to the server with the received args and an unique id', function() {
                var params = ['testValue'];
                underTest.apiCall('testApi', 'method1', params);
                expect(transporter.sendMessage.callCount).to.equal(1);
                var message = transporter.sendMessage.getCall(0).args[0];
                expect(message).to.be.an(SimCapiMessage);
                expect(message.type).to.be(SimCapiMessage.TYPES.API_CALL_REQUEST);
                expect(message.handshake).to.be(transporter.getHandshake());
                expect(message.values.uid).to.be(1);
                expect(message.values.api).to.be('testApi');
                expect(message.values.method).to.be('method1');
                expect(message.values.params).to.be(params);

                underTest.apiCall('testApi', 'method1', params);
                expect(transporter.sendMessage.callCount).to.equal(2);
                var message2 = transporter.sendMessage.getCall(1).args[0];
                expect(message2.values.uid).to.be(2);
            });
            it('should save the callbacks under the unique id', function() {
                var params = ['testValue'];
                var cb = function() {};
                underTest.apiCall('testApi', 'method1', params, cb);
                expect(underTest.responseQueue[1]).to.equal(cb);
            });
            it('should add nothing the the callback list if no callback is not a function', function() {
                var params = ['testValue'];
                underTest.apiCall('testApi', 'method1', params);
                expect(Object.keys(underTest.responseQueue).length).to.equal(0);
            });
        });

        describe('method: processResponse', function() {
            it('should call the callback with the message values and remove the callback from the list', function() {
                var params = ['testValue'];
                var args = [1, 2, 3];
                var cb = sandbox.stub();
                underTest.apiCall('testApi', 'method1', params, cb);
                var response = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.API_CALL_RESPONSE,
                    handshake: transporter.getHandshake(),
                    values: {
                        uid: 1,
                        type: 'success',
                        args: args
                    }
                });

                underTest.processResponse(response);
                expect(cb.callCount).to.equal(1);
                expect(cb.getCall(0).args[0]).to.equal('success');
                expect(cb.getCall(0).args[1]).to.equal(args);
                expect(Object.keys(underTest.responseQueue).length).to.equal(0);
            });

            it('should not throw if there is no callback for the received uid', function() {
                var args = [1, 2, 3];
                var response = new SimCapiMessage({
                    type: SimCapiMessage.TYPES.API_CALL_RESPONSE,
                    handshake: transporter.getHandshake(),
                    values: {
                        uid: 1,
                        type: 'success',
                        args: args
                    }
                });

                expect(function() {
                    underTest.processResponse(response);
                }).to.not.throwError();
            });
        });
    });
});
