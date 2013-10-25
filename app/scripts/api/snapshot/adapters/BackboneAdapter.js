define(['underscore', 
        'api/snapshot/Transporter',
        'api/snapshot/SimCapiMessage',
        'api/snapshot/SimCapiValue',
        'check'
], function(_, Transporter, SimCapiMessage, SimCapiValue, check){

var BackboneAdapter = function(options){
  options = options || {};

  var _transporter = options.transporter || Transporter.getInstance();

  var models = {};


  /*
   * Allows the 'attributes' to be watched.
   * @param attrName - The 'attribute name'
   * @param model - What the 'attribute' belongs to. Must also have a 'get' and 'set function. 
   * @param params : {
   *      alias  : alias of the attributeName 
   *      type : Type of the 'attribute'. @see SimCapiValue.TYPES.
   *      readonly : True if and only if, the attribute can be changed.
   * }
   */
  this.watch = function(varName, model, params) {

    params = params || {};

    if(model.has(varName))
    {
      var capiValue = new SimCapiValue({
        key: varName,
        value: model.get(varName),
        type: params.type,
        readonly: params.readonly
      });

      var alias = params.alias || varName;

      // listen to the model by attaching event handler on the model
      model.on('change:' + varName, _.bind(function(m, value){
        _transporter.setValue(alias, value);
      },this));
      
      _transporter.setValue(alias, capiValue);

      models[alias] = model;
      
    }
    
  };

  this.watchModel = function(model){
    _.each(model.capiProperties, _.bind(function(params, varName){
      params.model = model;
      this.watch(varName, params);
    }, this));
  };


  /*
  * values - Object of key - SimCapiValue
  */
  this.handleValueChange = function(values){
    // enumerate through all received values @see SimCapiMessage.values
    _.each(values, function(capiValue, key){
      if(models[key]){
        var model = models[key];
        model.set(capiValue.key, capiValue.value);
      }
    }, this);
    
  };

  _transporter.addChangeListener(_.bind(this.handleValueChange,this));

};


var _instance = null;
var getInstance = function() {
    if(!_instance) {
        _instance = new BackboneAdapter();
    }
    return _instance;
};

// in reality, we want a singleton but not for testing.
return {
  getInstance: getInstance,
  BackboneAdapter: BackboneAdapter
};
});
