define(function(require){
   
  var SimCapiValue = require('api/snapshot/SimCapiValue');
  
  describe('SimCapiValue', function(){
      

    
    it('should determine the proper types', function(){
      var value = new SimCapiValue({key:'test', value:2});
      var value2 = new SimCapiValue({key:'test', value:"50"});
      var value3 = new SimCapiValue({key:'test', value: 50, type: SimCapiValue.TYPES.NUMBER});

      expect(value.type).to.equal(SimCapiValue.TYPES.NUMBER);
      expect(value2.type).to.equal(SimCapiValue.TYPES.STRING);
      expect(value3.type).to.equal(SimCapiValue.TYPES.NUMBER);
    });


  });
    
});