define(['check'],function(check){


function parseBoolean(value){
  if (check(value).passive().isBoolean()) {
      return value;
  } else if (check(value).passive().isString()){
      return value === 'true' ? true : false;
  }
  return value;
}

function parseArray(value){
    if(check(value).passive().isArray()){
        return value;
    }
    else if(isArray(value)){
        var newArray = [];

        var elements = value.substring(1, value.length -1).split(',');

        for(var i=0;i<elements.length; ++i){
          newArray.push(elements[i].trim());
        }

        return newArray;
    }

    return value;
}

function isArray(value){
    return value.charAt(0) === '[' && 
        value.charAt(value.length-1) === ']';
}

var SimCapiValue = function(options) {

    var getType = function(value){
      var passiveValue = check(value).passive();
      var type;

      //Booleans must be checked before strings.
      if(passiveValue.isBoolean()){
        type = SimCapiValue.TYPES.BOOLEAN;
      }
      else if(passiveValue.isNumber()){
        type = SimCapiValue.TYPES.NUMBER;
      }
      else if(passiveValue.isArray() || isArray(value)){
        type = SimCapiValue.TYPES.ARRAY;
      }
      else if(passiveValue.isString()){
        type = SimCapiValue.TYPES.STRING;
      }
      else{
        throw new Error('can not determined type');
      }

      return type;
    },

    parseValue = function(value, type) {
      switch (type) {
        case SimCapiValue.TYPES.NUMBER:
          check(parseFloat(value)).isNumber();
          value = parseFloat(value);
          break;
        case SimCapiValue.TYPES.STRING:
          check(value).isString();
          break;
        case SimCapiValue.TYPES.BOOLEAN:
          value = parseBoolean(value);
          check(value).isBoolean();
          break; 
        case SimCapiValue.TYPES.ARRAY:
          value = parseArray(value);
          check(value).isArray();
      }

      return value;
    };


    // Ensure that options is initialized. This is just making code cleaner by avoiding lots of
    // null checks
    options = options || {};

    /*
    *  The original attribute name associated with this SimCapiValue
    */
    this.key = options.key || null;
    check(this.key).isString();

    /*
     * The value type.
     */
    this.type = options.type || null;

    /*
     * The value of this object.
     */
    this.value = (options.value !== undefined || options.value !== null)  ? options.value  : null;

    /*
     * True if and only if, this value can NOT be written to. Any request to change
     * the value of this key, will be ignored.
     */
    this.readonly = options.readonly || false;

    /*
    * List of possible values for enum
    */
    this.enums = options.enums || null;


    
    if(this.type){
      //we have a type so we only need to parse the value
      this.value = parseValue(this.value, this.type);
    }
    else if(this.value !== undefined && this.value !== null){
      //we don't have a type but we have a value, we can infer the type
      this.type = getType(this.value);

      //If determined to be of type array but value is a string, convert it.
      if(this.type === SimCapiValue.TYPES.ARRAY && check(this.value).passive().isString()){
        this.value = parseArray(this.value);
      }
    }
    else{
      throw new Error ('Value nor type was given');
    }
    
    this.setValue = function(value){
      this.value = parseValue(value, this.type);
    };
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