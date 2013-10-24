define(['check'],function(check){

function parseBoolean(value){
  if (check(value).passive().isBoolean()) {
      return value;
  } else if (check(value).passive().isString()){
      return value === 'true' ? true : false;
  }
  return value;
}

var SimCapiValue = function(options) {

    // Ensure that options is initialized. This is just making code cleaner by avoiding lots of
    // null checks
    options = options || {};

    /*
    *  The key of the this SimCapiValue 
    */
    this.key = options.key || null;

    /*
     * The value type.
     */
    this.type = options.type || null;

    /*
     * The value of this object.
     */
    this.value = null;
    this.setValue(options.value);

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

SimCapiValue.prototype.setValue = function(value) {
	if(value !== null || value !== undefined){
    switch (this.type) {
      case SimCapiValue.TYPES.NUMBER:
        check(parseFloat(value)).isNumber();
        this.value = parseFloat(value);
        break;
      case SimCapiValue.TYPES.STRING:
        this.value = value;
        break;
      case SimCapiValue.TYPES.BOOLEAN:
        this.value = parseBoolean(value);
        break;                
      default:
        this.value = value;
        break;
    }
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