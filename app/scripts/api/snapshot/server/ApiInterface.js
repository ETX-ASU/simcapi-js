define(function(require){
    var SimCapiMessage = require('../SimCapiMessage');
    var SharedSimData = require('../SharedSimData');

    function ApiInterface(){}

    ApiInterface.create = function(simCapiHandler, callback) {
        var SimCapiHandler = require('api/snapshot/SimCapiHandler');
        if(!(simCapiHandler instanceof SimCapiHandler)) { throw new Error('SimCapiHandler not received'); }

        var apiInterface = new ApiInterface();
        apiInterface.simCapiHandler = simCapiHandler;
        apiInterface.callback = callback;

        return apiInterface;
    };

    ApiInterface.prototype.processRequest = function(request){
        var response = new SimCapiMessage({
            type: SimCapiMessage.TYPES.API_CALL_RESPONSE,
            handshake: {
                authToken: request.handshake.authToken,
                config: SharedSimData.getInstance().getData()
            },
            values: {
                uid: request.values.uid
            }
        });

        this.callback({
            api: request.values.api,
            method: request.values.method,
            params: request.values.params,
            onSuccess: callback.bind(this, response, 'success'),
            onError: callback.bind(this, response, 'error')
        });
    };

    var callback = function(response, responseType){
        var slicedArgs = Array.prototype.slice.call(arguments, 2);
        var compositeId = this.simCapiHandler.getCompositeId(response.handshake.authToken);
        response.values.type = responseType;
        response.values.args = slicedArgs;
        this.simCapiHandler.sendMessage(response, compositeId);
    };

    return ApiInterface;
});
