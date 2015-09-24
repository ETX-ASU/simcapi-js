define(function(require){
    var apiList = require('../config/apiList');
    var SimCapiMessage = require('../SimCapiMessage');

    function ApiInterface(){
        this.apiCallUid = 0;
        this.responseQueue = {};
    }

    ApiInterface.create = function(transporter) {
        var Transporter = require('api/snapshot/Transporter').Transporter;
        if(!(transporter instanceof Transporter)) { throw new Error('Transporter not received'); }

        var apiInterface = new ApiInterface();
        apiInterface.transporter = transporter;

        return apiInterface;
    };

    ApiInterface.prototype.apiCall = function(api, method, params, callback){
        if(!apiList[api]){ throw new Error('Invalid api name provided'); }
        if(apiList[api].indexOf(method) === -1){ throw new Error('Method does not exist on the api'); }

        var uid = ++this.apiCallUid;
        var handshake = this.transporter.getHandshake();

        var message = new SimCapiMessage({
            type: SimCapiMessage.TYPES.API_CALL_REQUEST,
            handshake: handshake,
            values: {
                api: api,
                method: method,
                uid: uid,
                params: params
            }
        });

        if(typeof callback === 'function'){
            this.responseQueue[uid] = callback;
        }

        this.transporter.sendMessage(message);
    };

    ApiInterface.prototype.processResponse = function(response){
        var callback = this.responseQueue[response.values.uid];
        if(!callback){ return; }

        callback(response.values.type, response.values.args);
        delete this.responseQueue[response.values.uid];
    };

    return ApiInterface;
});
