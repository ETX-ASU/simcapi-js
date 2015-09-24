/*globals console*/
define(function(require){
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
        // create a message
        //var reponseMessage = new SimCapiMessage();
        //reponseMessage.type = SimCapiMessage.TYPES.GET_DATA_RESPONSE;
        //reponseMessage.handshake = {
        //    authToken: message.handshake.authToken,
        //    config: SharedSimData.getInstance().getData()
        //};

        this.callback({
            api: request.values.api,
            method: request.values.method,
            args: request.values.args,
            onSuccess: onSuccess.bind(this, request.values.uid),
            onError: onError.bind(this, request.values.uid)
        });
        //
        //if (callback.onGetDataRequest) {
        //    callback.onGetDataRequest({
        //        key: message.values.key,
        //        simId: message.values.simId,
        //        onSuccess: function(key, value, exists) {
        //            //broadcast response
        //            reponseMessage.values = {
        //                simId: message.values.simId,
        //                key: message.values.key,
        //                value: value,
        //                exists: exists,
        //                responseType: "success"
        //            };
        //
        //            self.sendMessage(reponseMessage, tokenToId[message.handshake.authToken]);
        //        },
        //        onError: function(error) {
        //            //broadcast response
        //            reponseMessage.values = {
        //                simId: message.values.simId,
        //                key: message.values.key,
        //                error: error,
        //                responseType: "error"
        //            };
        //
        //            self.sendMessage(reponseMessage, tokenToId[message.handshake.authToken]);
        //        }
        //    });
        //}
    };

    var onSuccess = function(uid){
        console.log('success', arguments);
    };

    var onError = function(uid, error){
        console.log('error', arguments);
    };

    return ApiInterface;
});
