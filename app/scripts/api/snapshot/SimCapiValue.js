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
 * Attribute types.
 */
SimCapiValue.TYPES = {
    NUMBER  : 1,
    STRING  : 2,
    ARRAY   : 3,
    BOOLEAN : 4
};

return SimCapiValue;
});