/*globals require, window*/
  root.SimCapi = {
    BackboneAdapter : require('api/snapshot/adapters/BackboneAdapter').getInstance(),
    CapiAdpater: require('api/snapshot/adapters/CapiAdapter').getInstance(),
    Controller: require('api/snapshot/Controller'),
    noConflict : function(){
      root.SimCapi = previousSimCapi;
      return root.SimCapi;
    }
  };

  root.SimCapi.CapiAdpater.CapiModel = require('api/snapshot/CapiModel');

}).call(this);