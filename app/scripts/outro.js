/*globals require, window*/
  root.SimCapi = {
    BackboneAdapter : require('api/snapshot/connectors/BackboneAdapter').getInstance(),
    CapiAdpater: require('api/snapshot/connectors/CapiAdapter').getInstance(),
    Controller: require('api/snapshot/Controller'),
    noConflict : function(){
      root.SimCapi = previousSimCapi;
      return root.SimCapi;
    }
  };

  root.SimCapi.CapiAdpater.CapiModel = require('api/snapshot/CapiModel');

}).call(this);