/*globals sinon*/
define(function(require){
   
  var CapiAdapter = require('api/snapshot/adapters/CapiAdapter').CapiAdapter;
  var Transporter = require('api/snapshot/Transporter').Transporter;
  var SimCapiValue = require('api/snapshot/SimCapiValue');

  require('sinon');


  describe('CapiAdapter', function(){
      
    var model = null;
    var modelAttributes = {};
    var sandbox = null;
    

    var transporter = null;
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
        },
        off: function(){}
      };

      transporter = new Transporter();
      adapter = new CapiAdapter({
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

    it('should set new values when recieved', function(){
      adapter.watch('attr1', model);

      sandbox.stub(model, 'set');

      adapter.handleValueChange([new SimCapiValue({key:'attr1', value:6})]);

      expect(model.set.callCount).to.be(1);
    });

    it('should remove SimCapiValues when unwatch', function(){
      sandbox.stub(transporter, 'removeValue', function(alias){
        expect(alias).to.equal('attr1.newName');
      });

      sandbox.stub(model, 'off', function(eventName, funct){
        expect(eventName).to.equal('change:attr1');
      });

      adapter.watch('attr1', model, {readonly:false, alias:"attr1.newName"});
      adapter.unwatch('attr1', model);

      expect(transporter.removeValue.callCount).to.be(1);
    });
  });
    
});