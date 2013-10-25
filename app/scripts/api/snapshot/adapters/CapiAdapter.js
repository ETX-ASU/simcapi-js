define(['underscore', 
        'api/snapshot/SimCapi',
        'api/snapshot/SimCapiMessage',
        'api/snapshot/SimCapiValue',
        'check'
], function(_, SimCapi, SimCapiMessage, SimCapiValue, check){

var CapiAdapter = function(options){
  options = options || {};

  this._simCapi = options.simCapi || SimCapi.getInstance();

  this.models = {};

  /*
   * Allows the 'attributes' to be watched.
   * @param attrName - The 'attribute name'
   * @param parent - What the 'attribute' belongs to. Must also have a 'get' and 'set function.
   * @param params : {
   *      alias  : alias of the attributeName 
   *      type : Type of the 'attribute'. @see SimCapiValue.TYPES below.
   *      readonly : True if and only if, the attribute can be changed.
   * }
   */
  this.watch = function(varName, parent, params) {
    params = params || {};

    if(parent.has(varName) && parent.get(varName) !== null && parent.get(varName) !== undefined)
    {
      var capiValue = new SimCapiValue({
        key: varName,
        value: parent.get(varName),
        type: params.type,
        readonly: params.readonly
      });

      var alias = params.alias || varName;

      // listen to the model by attaching event handler on the parent
      parent.on('change:' + varName, _.bind(function(m, value){
        this._simCapi.updateValue(alias, value);
      },this));
      
      this._simCapi.setValue(alias, capiValue);

      this.models[alias] = parent;
      
    }
  };



  /*
  * values - Object of key - SimCapiValue
  */
  this.handleValueChange = function(values){
    // enumerate through all received values @see SimCapiMessage.values
    _.each(values, function(capiValue, key){
      if(this.models[key]){
        var model = this.models[key];
        model.set(capiValue.key, capiValue.value);
      }
    },this);
    
  };

  this._simCapi.addChangeListener(_.bind(this.handleValueChange,this));


};


var _instance = null;
var getInstance = function(options) {
    if(!_instance) {
        _instance = new CapiAdapter(options);
    }
    return _instance;
};

// in reality, we want a singleton but not for testing.
return {
  getInstance:getInstance,
  CapiAdapter: CapiAdapter
};

});