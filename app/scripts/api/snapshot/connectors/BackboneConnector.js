define(['underscore', 
        'api/snapshot/SimCapi',
        'api/snapshot/SimCapiMessage',
        'api/snapshot/SimCapiValue',
        'check'
], function(_, SimCapi, SimCapiMessage, SimCapiValue, check){

  var BackboneConnector = function(options){
    options = options || {};

    this._simCapi = options.simCapi || new SimCapi();

    this._simCapi.setConnector(this);

    // The mapping of watched 'attributes'
    var outgoingMap = options.outgoingMap || {};


    /*
     * Allows the 'attributes' to be watched.
     * @param attrName - The 'attribute name'
     * @param params : {
     *      parent : What the 'attribute' belongs to. Must also have a 'get' and 'set function.               
     *      alias  : alias of the attributeName 
     *      type : Type of the 'attribute'. @see SimCapi.TYPES below.
     *      readonly : True if and only if, the attribute can be changed.
     * }
     */
    this.watch = function(varName, params) {

      if(params.parent.has(varName)){

        params.alias = params.alias || varName;

        //params.alias is the key on the map, but we must retain the original attrName of that attribute
        //so that we can set the value on the parent model.
        params.originalName = varName;

        
        outgoingMap[params.alias] = params;
       

        // listen to the model by attaching event handler on the parent
        params.parent.on('change:' + varName, _.bind(function(){
          this._simCapi.notifyValueChange();
        },this));
        
        this._simCapi.notifyValueChange();
      }
      
    };

    this.watchModel = function(model){
      _.each(model.capiProperties, _.bind(function(params, varName){
        params.parent = model;
        this.watch(varName, params);
      }, this));
    };

    this.notifyOnReady = function(){
      this._simCapi.notifyOnReady();
    };


    this.createValueChangeMessage = function(){
      var valueChangeMsg = new SimCapiMessage({
          type : SimCapiMessage.TYPES.VALUE_CHANGE,
          handshake : this._simCapi.getHandshake()
      });

      // populate the message with the values of the entire model
      _.each(outgoingMap, function(attrParams, attrName) {
          
          valueChangeMsg.values[attrName] = new SimCapiValue({
              // everything is going to be a string from the viewer's perspective
              type    : attrParams.type,
              value   : null,
              readOnly: attrParams.readonly
          });
          
          // Not passing attributes that don't exist in the ref model
          if (attrParams.parent.has(attrParams.originalName)) {
              var value = attrParams.parent.get(attrParams.originalName);
              if (value !== undefined && value !== null) {
                  valueChangeMsg.values[attrName].value = value.toString();
              }
          }
      });

      return valueChangeMsg;
    };

     /*
     * Convert value to boolean primitive. If the value is unconvertable, 
     * the original value is returned.
     */
    var parseBoolean = function(value) {
        if (check(value).passive().isBoolean()) {
            return value;
        } else if (check(value).passive().isString()){
            return value === 'true' ? true : false;
        }
        return value;
    };

    /*
     * Helper to update the value of a model based on it's type.
     */
    var setValue = function(attrParams, attrName, value){
     switch (attrParams.type) {
        case SimCapi.TYPES.NUMBER:
          check(parseFloat(value)).isNumber();
          attrParams.parent.set(attrName, parseFloat(value));
          break;
        case SimCapi.TYPES.STRING:
          attrParams.parent.set(attrName, value);
          break;
        case SimCapi.TYPES.BOOLEAN:
          attrParams.parent.set(attrName, parseBoolean(value));
          break;                
        default:
          attrParams.parent.set(attrName, value);
          break;
      }
    };

    this.handleValueChange = function(message){
      // enumerate through all received values @see SimCapiMessage.values
      _.each(message.values, function(capiValue, key){

          var attrParams = outgoingMap[key];

          // check if the key exists in the mapping and is writeable
          if (attrParams && !attrParams.readonly) {
              // attempt to set update the model value
                   
              setValue(outgoingMap[key], attrParams.originalName, capiValue.value);
              
          }
      });
    };


  };


  BackboneConnector._instance = null;
  BackboneConnector.getInstance = function(options) {
      if(!BackboneConnector._instance) {
          BackboneConnector._instance = new BackboneConnector(options);
      }
      return BackboneConnector._instance;
  };

  return BackboneConnector;
});