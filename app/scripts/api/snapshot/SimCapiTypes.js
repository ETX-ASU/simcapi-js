define(function(require) {
  var SimCapiType = function(enumValue, stringValue) {
    this.enumValue = enumValue;
    this.stringValue = stringValue;
  };

  SimCapiType.prototype.valueOf = function() {
    return this.enumValue;
  };

  SimCapiType.prototype.toString = function() {
    return this.stringValue;
  };

  var SimCapiTypes = {
    NUMBER: new SimCapiType(1, 'Number'),
    STRING: new SimCapiType(2, 'String'),
    ARRAY: new SimCapiType(3, 'Array'),
    BOOLEAN: new SimCapiType(4, 'Boolean'),
    ENUM: new SimCapiType(5, 'Enum'),
    MATH_EXPR: new SimCapiType(6, 'MathExpression'),
    ARRAY_POINT: new SimCapiType(7, 'Point Array')
  };

  return SimCapiTypes;
});