define(function(require){
    
    var SimCapiValue = function(options) {
        
        // Ensure that options is initialized. This is just making code cleaner by avoiding lots of
        // null checks
        options = options || {};
        
        /*
         * The value type.
         */
        this.type = options.type || null;
        
        /*
         * The value of this object.
         */
        this.value = options.value || null;
        
        /*
         * True if and only if, this value can NOT be written to. Any request to change
         * the value of this key, will be ignored.
         */
        this.readOnly = options.readOnly || false;
    };
    
    /*
     * Define value type enums as a class variable.
     * Next number is 2.
     */
    SimCapiValue.TYPES = {
        STRING : 1,
    };
    
    return SimCapiValue;
});