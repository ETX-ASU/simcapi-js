/*globals sinon*/
define(function(require){
   
  var BackboneAdapter = require('api/snapshot/adapters/BackboneAdapter').BackboneAdapter;
  var SimCapi = require('api/snapshot/SimCapi').SimCapi;
  var SimCapiValue = require('api/snapshot/SimCapiValue');

  require('sinon');


  describe('BackboneAdapter', function(){
      
    var model = null;
    var modelAttributes = {};
    var sandbox = null;
    

    var simCapi = null;
    var adapter = null; 
    
    beforeEach(function(){

      sandbox = sinon.sandbox.create();

      modelAttributes = {
        'attr1'    : 5,
        'fakeAttr' : null  
      };

      model = {
        get: function(varName){ 
          return modelAttributes[varName]; 
        },
        set: function(){},
        on: function(){},
        has: function(varName){
          return varName;
        }
      };

      simCapi = new SimCapi();
      adapter = new BackboneAdapter({
        simCapi: simCapi
      });

    });

    afterEach(function(){
      sandbox.restore();
    });


    
    it('should create SimCapiValues properly', function(){
      sandbox.stub(simCapi, 'setValue', function(attrName, capiValue){
        expect(capiValue).to.be.a(SimCapiValue);
      });

      adapter.watch('attr1', model, {readonly:false});
      adapter.watch('fakeAttr', model, {readonly:false});
      adapter.watch(null, model, {readonly:false});

      expect(simCapi.setValue.callCount).to.be(1);
    });

    it('should set new values when recieved', function(){
      adapter.watch('attr1', model);

      sandbox.stub(model, 'set');

      adapter.handleValueChange({'attr1': new SimCapiValue({key:'attr1', value:6})});

      expect(model.set.callCount).to.be(1);
    });
  });
    
});