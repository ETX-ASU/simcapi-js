define(['underscore', 
        'api/snapshot/Transporter',
        'api/snapshot/SimCapiMessage',
        'api/snapshot/SimCapiValue',
        'check'
], function(_, Transporter, SimCapiMessage, SimCapiValue, check){

var BackboneAdapter = function(options){
  options = options || {};

  var _transporter = options.transporter || Transporter.getInstance();

  var modelsMapping = {};


  /*
   * Allows the 'attributes' to be exposed.
   * @param attrName - The 'attribute name'
   * @param model - What the 'attribute' belongs to. Must also have a 'get' and 'set function. 
   * @param params : {
   *      alias  : alias of the attributeName 
   *      type : Type of the 'attribute'. @see SimCapiValue.TYPES.
   *      readonly : True if and only if, the attribute can be changed.
   * }
   */
  this.expose = function(varName, model, params) {

    params = params || {};

    if(model.has(varName))
    {

      var simCapiParams = params;
      var originalName = varName;
      var alias = params.alias || varName;
      
      var capiValue = new SimCapiValue({
        key: alias,
        value: model.get(varName),
        type: params.type,
        readonly: params.readonly
      });

      if(capiValue.type === SimCapiValue.TYPES.ARRAY){
        capiValue.value = '[' + model.get(originalName).toString() + ']';
      }


      var exposeFunc = _.bind(function(m,value){
        var capiValue = new SimCapiValue({
          key: alias,
          value: value,
          type: simCapiParams.type,
          readonly: simCapiParams.readonly
        });

        if(capiValue.type === SimCapiValue.TYPES.ARRAY){
          capiValue.value = '[' + model.get(originalName).toString() + ']';
        }

        _transporter.setValue(capiValue); 
      }, this);

      // listen to the model by attaching event handler on the model
      model.on('change:' + varName, exposeFunc);
      
      _transporter.setValue(capiValue);

      modelsMapping[alias] = {
        alias: alias,
        model: model, 
        originalName: originalName,
        exposeFunc: exposeFunc
      };
      
    }
    
  };

  /*
   * Allows the 'attributes' to be unexposed
   * @param attrName - The 'attribute name'
   * @param model - The model the attribute belongs to.
   */
  this.unexpose = function(varName, model){
    
    var modelMap;

    if(modelsMapping[varName]){
      modelMap = modelsMapping[varName];
    }
    else{
      //could be under an alias
      modelMap = _.findWhere(modelsMapping, {originalName:varName});
    }

    if(modelMap){
      model.off('change:'+varName, modelMap.exposeFunc);

      _transporter.removeValue(modelMap.alias);

      modelsMapping[modelMap.alias] = null;
    }
    else{
      throw new Error(varName + " doesn't exist on the model.");
    }
  };

  /*
  * Watches a whole model. Model must have property `capiProperties` for the options of each
  * attribute to be exposed. 
  */
  this.watchModel = function(model){
    _.each(model.capiProperties, _.bind(function(params, varName){
      params.model = model;
      this.watch(varName, params);
    }, this));
  };


  /*
  * values - Array of SimCapiValue
  */
  this.handleValueChange = function(values){
    // enumerate through all received values @see SimCapiMessage.values
    _.each(values, function(capiValue){
      if(modelsMapping[capiValue.key]){
        var model = modelsMapping[capiValue.key].model;
        var originalName = modelsMapping[capiValue.key].originalName;
        
        model.set(originalName, capiValue.value); 
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
