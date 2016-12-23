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

define(function(require) {
    var apiList = require('./config/apiList');
    var SimCapiMessage = require('./SimCapiMessage');

    function ApiInterface() {
        this.apiCallUid = 0;
        this.responseQueue = {};
    }

    ApiInterface.create = function(transporter) {
        var Transporter = require('api/snapshot/Transporter').Transporter;
        if (!(transporter instanceof Transporter)) {
            throw new Error('Transporter not received');
        }

        var apiInterface = new ApiInterface();
        apiInterface.transporter = transporter;

        return apiInterface;
    };

    ApiInterface.prototype.apiCall = function(api, method, params, callback) {
        if (!apiList[api]) {
            throw new Error('Invalid api name provided: ' + api);
        }
        if (apiList[api].indexOf(method) === -1) {
            throw new Error('Method does not exist on the api: ' + method);
        }

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

        if (typeof callback === 'function') {
            this.responseQueue[uid] = callback;
        }

        this.transporter.sendMessage(message);
    };

    ApiInterface.prototype.processResponse = function(response) {
        var callback = this.responseQueue[response.values.uid];
        if (!callback) {
            return;
        }

        callback(response.values.type, response.values.args);
        delete this.responseQueue[response.values.uid];
    };

    return ApiInterface;
});
