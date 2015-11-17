define(['underscore'], function(_) {

    var SimCapiBindingManager = function() {

        /*
         * Holds a mapping of capi properties bound to another
         * capi property, many to 1.
         * e.g.,
         * {
         *    'stage.sim1.value1' : 'stage.prop1',
         *    'stage.sim1.value2' : 'stage.prop2',
         *    'stage.sim1.value3' : 'stage.prop1'
         *  }
         */
        var bindings = {};

        /*
         * Keeps track of which bound capi properties relate to
         * which sim. Used for clean up.
         */
        var iframeMap = {};

        this.addBinding = function(iframeId, key, boundTo) {
            bindings[key] = boundTo;

            iframeMap[iframeId] = iframeMap[iframeId] || [];
            iframeMap[iframeId].push(key);
        };

        this.removeBinding = function(key) {
            delete bindings[key];
        };

        this.removeIframeBindings = function(iframeId) {
            _.each(iframeMap[iframeId], this.removeBinding);

            delete iframeMap[iframeId];
        };

        // since the bindings are unlikely to change very often, the map invert
        // step is behind a cache
        var cachedInverter = _.memoize(_.partial(_.invert, _, true), JSON.stringify);

        /*
         * Returns the inverted mapping of bindings, 1 to many
         * e.g.,
         *  {
         *    'stage.prop1' : ['stage.sim1.value1', 'stage.sim1.value3'],
         *    'stage.prop2' : ['stage.sim1.value2']
         *  }
         */
        this.getInvertedBindingMap = function() {
          return cachedInverter(bindings);
        };

        this.getBindingMap = function() {
          return bindings;
        };

        this.reset = function() {
          bindings = {};
          iframeMap = {};
        };
    };

    return new SimCapiBindingManager();
});