define(['check'],function(check){



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

    /*
    * List of possible values for enum
    */
    this.enums = options.enums || null;

    this._determineType = function(){
      if(!this.enums){
        var passiveValue = check(this.value).passive();
        if(passiveValue.isString()){
          this.type = SimCapiValue.TYPES.STRING;
        }
        else if(passiveValue.isNumber()){
          this.type = SimCapiValue.TYPES.NUMBER;
        }
        else if(passiveValue.isBoolean()){
          this.type = SimCapiValue.TYPES.BOOLEAN;
        }
      }
      else{
        //set type to be enum 
      }
    };

    //Only determin the type if its not given.
    if(!this.type){
      this._determineType();
    }
    
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