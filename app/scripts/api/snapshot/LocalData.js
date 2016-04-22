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