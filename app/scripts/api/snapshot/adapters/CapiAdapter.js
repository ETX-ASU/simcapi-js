define(['underscore', 
        'api/snapshot/Transporter',
        'api/snapshot/SimCapiMessage',
        'api/snapshot/SimCapiValue',
        'check',
        'api/snapshot/CapiModel'
], function(_, Transporter, SimCapiMessage, SimCapiValue, check, CapiModel){

var CapiAdapter = function(options){
  options = options || {};

  var _transporter = options.transporter || Transporter.getInstance();

  var modelsMapping = {};

  /*
   * Allows the 'attributes' to be watched.
   * @param attrName - The 'attribute name'
   * @param parent - What the 'attribute' belongs to. Must also have a 'get' and 'set function.
   * @param params : {
   *      alias  : alias of the attributeName 
   *      type : Type of the 'attribute'. @see SimCapiValue.TYPES.
   *      readonly : True if and only if, the attribute can be changed.
   * }
   */
  this.watch = function(varName, parent, params) {
    params = params || {};

    if(parent.has(varName))
    {
      var alias = params.alias || varName;
      
      var capiValue = new SimCapiValue({
        key: alias,
        value: parent.get(varName),
        type: params.type,
        readonly: params.readonly
      });


      // listen to the model by attaching event handler on the parent
      parent.on('change:' + varName, _.bind(function(m, value){
        _transporter.setValue(alias, value);
      },this));
      
      _transporter.setValue(alias, capiValue);

      modelsMapping[alias] = {parent:parent, originalName:varName};
      
    }
  };



  /*
  * values - Array of SimCapiValue
  */
  this.handleValueChange = function(values){
    // enumerate through all received values @see SimCapiMessage.values
    _.each(values, function(capiValue){
      if(modelsMapping[capiValue.key]){
        var parent = modelsMapping[capiValue.key].parent;
        var originalName = modelsMapping[capiValue.key].originalName;
        parent.set(originalName, capiValue.value);
      }
    }, this);
    
  };

  _transporter.addChangeListener(_.bind(this.handleValueChange,this));


};


var _instance = null;
var getInstance = function() {
    if(!_instance) {
        _instance = new CapiAdapter();
        _instance.CapiModel = CapiModel; 
    }
    return _instance;
};

// in reality, we want a singleton but not for testing.
return {
  getInstance:getInstance,
  CapiAdapter: CapiAdapter
};

});