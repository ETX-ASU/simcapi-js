/*globals sinon*/
define(function(require){
   
  var BackboneAdapter = require('api/snapshot/adapters/BackboneAdapter').BackboneAdapter;
  var Transporter = require('api/snapshot/Transporter').Transporter;
  var SimCapiValue = require('api/snapshot/SimCapiValue');

  require('sinon');


  describe('BackboneAdapter', function(){
      
    var model = null;
    var modelAttributes = {};
    var sandbox = null;
    

    var transporter = null;
    var adapter = null; 
    
    beforeEach(function(){

      sandbox = sinon.sandbox.create();

      modelAttributes = {
        'attr1'    : 5,
        'attr2'    : []
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

      transporter = new Transporter();
      adapter = new BackboneAdapter({
        transporter: transporter
      });

    });

    afterEach(function(){
      sandbox.restore();
    });


    
    it('should create SimCapiValues properly', function(){
      sandbox.stub(transporter, 'setValue', function(capiValue){
        expect(capiValue).to.be.a(SimCapiValue);
      });

      adapter.watch('attr1', model, {readonly:false});

      expect(transporter.setValue.callCount).to.be(1);
    });

    it('should create SimCapiValues properly when of type array', function(){
      sandbox.stub(transporter, 'setValue', function(capiValue){
        expect(capiValue.value).to.be('[]');
      });

      adapter.watch('attr2', model, {readonly:false});
    });

    it('should set new values when recieved', function(){
      adapter.watch('attr1', model);

      sandbox.stub(model, 'set');

      adapter.handleValueChange([new SimCapiValue({key:'attr1', value:6})]);

      expect(model.set.callCount).to.be(1);
    });

    it('should set new value of array type to be an array when recieved', function(){
      adapter.watch('attr2', model);

      sandbox.stub(model, 'set', function(m,v){
        expect(v).to.be.a(Array);
      });

      adapter.handleValueChange([new SimCapiValue({key:'attr2', value:'[10]'})]);

    });
  });
    
});