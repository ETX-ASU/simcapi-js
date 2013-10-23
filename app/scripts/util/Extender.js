define(function(require){
  
  var extend = function(child){
    return {
      from: function(parent){
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
      }
    };
  };

  return extend;

});