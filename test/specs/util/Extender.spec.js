define(function(require){
   
  var extend = require('util/Extender');
  
  describe('Extender', function(){
      
    var model = null;
    var sandbox = null;
    
    beforeEach(function(){


    });
    
    it('should extend properly', function(){
      var failedParentConstructor = false;
      var failedParentInitialize = true;

      var Parent = function(){
        failedParentConstructor = true;
      };
      Parent.prototype.initialize = function(){
        failedParentInitialize = false;
      };

      var Child = function(){
        Parent.prototype.initialize.call(this);
      };

      extend(Child).from(Parent);

      new Child();

      expect(failedParentConstructor).to.equal(false);
      expect(failedParentInitialize).to.equal(false);
      expect(Child.prototype.initialize).to.be.ok();
    });

  });
    
});