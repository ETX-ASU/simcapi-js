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
      var simCapiParams = params;
      var originalName = varName;
      var alias = params.alias || varName;
      
      var capiValue = new SimCapiValue({
        key: alias,
        value: parent.get(varName),
        type: params.type,
        readonly: params.readonly
      });

      if(capiValue.type === SimCapiValue.TYPES.ARRAY){
        capiValue.value = '[' + parent.get(originalName).toString() + ']';
      }


      // listen to the model by attaching event handler on the parent
      parent.on('change:' + varName, _.bind(function(m, value){
        var capiValue = new SimCapiValue({
          key: alias,
          value: value,
          type: simCapiParams.type,
          readonly: simCapiParams.readonly
        });
        
        if(capiValue.type === SimCapiValue.TYPES.ARRAY){
          capiValue.value = '[' + parent.get(originalName).toString() + ']';
        }

        _transporter.setValue(capiValue);
      },this));
      
      _transporter.setValue(capiValue);

      modelsMapping[alias] = {parent:parent, originalName:originalName};
      
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

        if(capiValue.type === SimCapiValue.TYPES.ARRAY){
          var newArray = [];

          var elements = capiValue.value.replace(/^\[|\]$/g, '').split(',');

          for(var i=0;i<elements.length; ++i){
            newArray.push(elements[i].trim());
          }

          parent.set(originalName, newArray);
        }
        else{
          parent.set(originalName, capiValue.value); 
        }
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