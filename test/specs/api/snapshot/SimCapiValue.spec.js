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

    it('should determine the type to be ENUM and throw error if value is not allowed', function(){
        var value = new SimCapiValue({key:'test', value:"enum1", allowedValues:["enum1", "enum2", "enum3"]});

        expect(value.type).to.equal(SimCapiValue.TYPES.ENUM);

        var errorThrown = false;

        try{
           value.setValue('enumUndefined');
        }
        catch(e){
            errorThrown = true;
        }

        expect(errorThrown).to.equal(true);

    });


  });

});