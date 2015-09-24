/*globals sinon*/
define(function(require){
    var ApiInterface = require('api/snapshot/server/ApiInterface');
    var SimCapiHandler = require('api/snapshot/SimCapiHandler');
    require('sinon');

    describe('ApiInterface', function(){
        var underTest, simCapiHandler, cb, $container;
        var sandbox = sinon.sandbox.create();

        beforeEach(function(){
            cb = sandbox.stub();
            $container = {};
            simCapiHandler = new SimCapiHandler($container);
            underTest = ApiInterface.create(simCapiHandler, cb);
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
                var args = {};
                var api = 'testApi';
                var method = 'testMethod';
                var uid = 9;

                var values = {
                    api: api,
                    method: method,
                    uid: uid,
                    args: args
                };

                var message = {
                    values: values
                };

                underTest.processRequest(message);

                expect(cb.callCount).to.equal(1);
                var callArgs = cb.getCall(0).args[0];
                expect(callArgs.api).to.equal(api);
                expect(callArgs.method).to.equal(method);
                expect(callArgs.args).to.equal(args);
            });
        });
    });
});