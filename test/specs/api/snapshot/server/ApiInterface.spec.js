/*globals sinon*/
define(function(require){
    var ApiInterface = require('api/snapshot/server/ApiInterface');
    var SimCapiHandler = require('api/snapshot/SimCapiHandler');
    var SimCapiMessage = require('api/snapshot/SimCapiMessage');
    require('sinon');

    describe('ApiInterface', function(){
        var underTest, simCapiHandler, cb, $container;
        var sandbox = sinon.sandbox.create();

        beforeEach(function(){
            cb = sandbox.stub();
            $container = {};
            simCapiHandler = new SimCapiHandler($container);
            underTest = ApiInterface.create(simCapiHandler, cb);
            sandbox.stub(simCapiHandler, 'sendMessage');
        });

        afterEach(function(){
            sandbox.restore();
        });

        describe('static method: create', function(){
            it('should throw if the simCapiHandler is not sent', function(){
                expect(function(){ ApiInterface.create(); }).to.throwError();
                expect(function(){ ApiInterface.create({}); }).to.throwError();
            });
            it('should return an instance of the ApiInterface class', function(){
                var apiService = ApiInterface.create(simCapiHandler);
                expect(apiService).to.be.an(ApiInterface);
            });
            it('should set the transporter and callback references on the created instance', function(){
                var apiService = ApiInterface.create(simCapiHandler, cb);
                expect(apiService.simCapiHandler).to.be(simCapiHandler);
                expect(apiService.callback).to.be(cb);
            });
        });

        describe('method: processRequest', function(){
            it('should call the viewer callback', function(){
                var params = [];
                var api = 'testApi';
                var method = 'testMethod';
                var uid = 9;

                var values = {
                    api: api,
                    method: method,
                    uid: uid,
                    params: params
                };

                var message = {
                    handshake: { authToken: 'testAuthToken' },
                    values: values
                };

                underTest.processRequest(message);

                expect(cb.callCount).to.equal(1);
                var callArgs = cb.getCall(0).args[0];
                expect(callArgs.api).to.equal(api);
                expect(callArgs.method).to.equal(method);
                expect(callArgs.params).to.equal(params);
            });
        });

        describe('when the thrift call succeeds', function(){
            var thriftCallback, uid;
            beforeEach(function(){
                var params = [];
                var api = 'testApi';
                var method = 'testMethod';
                uid = 9;

                var values = {
                    api: api,
                    method: method,
                    uid: uid,
                    params: params
                };

                var message = {
                    handshake: { authToken: 'testAuthToken' },
                    values: values
                };

                underTest.processRequest(message);
                thriftCallback = cb.getCall(0).args[0].onSuccess;
            });

            it('should send a response message back to the client', function(){
                thriftCallback('a', 'b', 'c');
                expect(simCapiHandler.sendMessage.callCount).to.equal(1);
                var message = simCapiHandler.sendMessage.getCall(0).args[0];
                expect(message.type).to.equal(SimCapiMessage.TYPES.API_CALL_RESPONSE);
                expect(message.values.type).to.equal('success');
                expect(message.values.uid).to.equal(uid);
                expect(message.values.args[0]).to.equal('a');
                expect(message.values.args[1]).to.equal('b');
                expect(message.values.args[2]).to.equal('c');
            });
        });

        describe('when the thrift call fails', function(){
            var thriftCallback, uid;
            beforeEach(function(){
                var params = [];
                var api = 'testApi';
                var method = 'testMethod';
                uid = 9;

                var values = {
                    api: api,
                    method: method,
                    uid: uid,
                    params: params
                };

                var message = {
                    handshake: { authToken: 'testAuthToken' },
                    values: values
                };

                underTest.processRequest(message);
                thriftCallback = cb.getCall(0).args[0].onError;
            });

            it('should send a response message back to the client', function(){
                thriftCallback('a', 'b', 'c');
                expect(simCapiHandler.sendMessage.callCount).to.equal(1);
                var message = simCapiHandler.sendMessage.getCall(0).args[0];
                expect(message.type).to.equal(SimCapiMessage.TYPES.API_CALL_RESPONSE);
                expect(message.values.type).to.equal('error');
                expect(message.values.uid).to.equal(uid);
                expect(message.values.args[0]).to.equal('a');
                expect(message.values.args[1]).to.equal('b');
                expect(message.values.args[2]).to.equal('c');
            });
        });
    });
});