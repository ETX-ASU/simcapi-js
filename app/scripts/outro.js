
  root.pipit = {
    BackboneAdapter : require('api/snapshot/adapters/BackboneAdapter').getInstance(),
    CapiAdpater: require('api/snapshot/adapters/CapiAdapter').getInstance(),
    Controller: require('api/snapshot/Controller'),
    noConflict : function(){
      root.pipit = previousPipit;
      return root.pipit;
    }
  };

  root.pipit.CapiAdpater.CapiModel = require('api/snapshot/CapiModel');

}).call(this);