/*globals sinon*/
define(function(require){
    var ApiInterface = require('api/snapshot/client/ApiInterface');
    var Transporter = require('api/snapshot/Transporter');
    var SimCapiMessage = require('api/snapshot/SimCapiMessage');
    var apiList = require('api/snapshot/config/apiList');
    require('sinon');

    describe('ApiInterface', function(){
        var underTest, transporter, originalApiList;
        var sandbox = sinon.sandbox.create();

        beforeEach(function(){
            originalApiList = {};
            for(var i in apiList){
                originalApiList[i] = apiList[i];
                delete apiList[i];
            }

            apiList.testApi = ['method1', 'method2'];

            transporter = Transporter.getInstance();
            underTest = ApiInterface.create(transporter);

            sandbox.stub(transporter, 'sendMessage');
        });

        afterEach(function(){
            for(var i in apiList){ delete apiList[i]; }
            for(var j in originalApiList){
                apiList[j] = originalApiList[j];
            }
            sandbox.restore();
        });

        describe('static method: create', function(){
            it('should throw if the transporter is not sent', function(){
                expect(function(){ ApiInterface.create(); }).to.throwError();
                expect(function(){ ApiInterface.create({}); }).to.throwError();
            });
            it('should return an instance of the ApiInterface class', function(){
                var apiService = ApiInterface.create(Transporter.getInstance());
                expect(apiService).to.be.an(ApiInterface);
            });
            it('should set the transporter reference on the created instance', function(){
                var apiService = ApiInterface.create(Transporter.getInstance());
                expect(apiService.transporter).to.be(Transporter.getInstance());
            });
        });

        describe('method: callApi', function(){
            it('should throw the service name not allowed', function(){
                expect(function(){ underTest.apiCall(); }).to.throwError();
                expect(function(){ underTest.apiCall('otherService'); }).to.throwError();
            });
            it('should throw if api method is not allowed', function(){
                expect(function(){ underTest.apiCall('testApi'); }).to.throwError();
                expect(function(){ underTest.apiCall('testApi', 'method3'); }).to.throwError();
            });
            it('should send a message to the server with the received args and an unique id', function(){
                var values = { param1: 'testValue' };
                underTest.apiCall('testApi', 'method1', values);
                expect(transporter.sendMessage.callCount).to.equal(1);
                var message = transporter.sendMessage.getCall(0).args[0];
                expect(message).to.be.an(SimCapiMessage);
                expect(message.type).to.be(SimCapiMessage.TYPES.API_CALL_REQUEST);
                expect(message.handshake).to.be(transporter.getHandshake());
                expect(message.values.uid).to.be(1);
                expect(message.values.api).to.be('testApi');
                expect(message.values.method).to.be('method1');
                expect(message.values.args.param1).to.be(values.param1);

                underTest.apiCall('testApi', 'method1', values);
                expect(transporter.sendMessage.callCount).to.equal(2);
                var message2 = transporter.sendMessage.getCall(1).args[0];
                expect(message2.values.uid).to.be(2);
            });
            it('should save the callbacks under the unique id', function(){
                var values = { param1: 'testValue' };
                var cb = function(){};
                underTest.apiCall('testApi', 'method1', values, cb);
                expect(underTest.responseQueue[1]).to.equal(cb);
            });
            it('should add nothing the the callback list if no callback is not a function', function(){
                var values = { param1: 'testValue' };
                underTest.apiCall('testApi', 'method1', values);
                expect(Object.keys(underTest.responseQueue).length).to.equal(0);
            });
        });
    });
});