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
            type: SimCapiMessage.TYPES.GET_DATA_RESPONSE,
            handshake: {
                authToken: request.handshake.authToken,
                config: SharedSimData.getInstance().getData(),
                values: {
                    uid: request.values.uid
                }
            }
        });

        this.callback({
            api: request.values.api,
            method: request.values.method,
            params: request.values.params,
            onSuccess: onSuccess.bind(this, response),
            onError: onError.bind(this, response)
        });
    };

    var onSuccess = function(response){
        var slicedArgs = Array.prototype.slice.call(arguments, 1);
        var compositeId = this.simCapiHandler.getCompositeId(response.handshake.authToken);
        response.values.type = 'success';
        response.values.args = slicedArgs;
        this.simCapiHandler.sendMessage(response, compositeId)
    };

    var onError = function(response){
        var slicedArgs = Array.prototype.slice.call(arguments, 1);
        var compositeId = this.simCapiHandler.getCompositeId(response.handshake.authToken);
        response.values.type = 'error';
        response.values.args = slicedArgs;
        this.simCapiHandler.sendMessage(response, compositeId)
    };

    return ApiInterface;
});
