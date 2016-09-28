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

/*globals window, setTimeout, console*/
define(function(){
    var LocalData = {
        getData: function(simId, key, onSuccess){
            var response = {
                key: key,
                value: null,
                exists: false
            };

            try{
                var simData = JSON.parse(window.sessionStorage.getItem(simId));
                if(simData && simData.hasOwnProperty(key)){
                    response.value = simData[key];
                    response.exists = true;
                }
            }
            catch(err){
                console.warn('An error occurred while reading the date from sessionStorage.');
            }
            asyncResponse(response, onSuccess);
        },
        setData: function(simId, key, value, onSuccess){
            try{
                var simData = JSON.parse(window.sessionStorage.getItem(simId)) || {};
                simData[key] = value;
                window.sessionStorage.setItem(simId, JSON.stringify(simData));
            }
            catch(err){
                console.warn('An error occurred while trying to save the data to sessionStorage.');
            }
            asyncResponse(null, onSuccess);
        }
    };

    function asyncResponse(response, callback){
        setTimeout(sendResponse.bind(this, response, callback), 0);
    }

    function sendResponse(response, callback){
        callback(response);
    }

    return LocalData;
});