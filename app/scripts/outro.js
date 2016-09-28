root.simcapi = {
Transporter: require('api/snapshot/Transporter').getInstance(),
BackboneAdapter: require('api/snapshot/adapters/BackboneAdapter').getInstance(),
CapiAdapter: require('api/snapshot/adapters/CapiAdapter').getInstance(),
noConflict: function() {
    root.simcapi = previousSimcapi;
    return root.simcapi;
}
};

}).call(this);
