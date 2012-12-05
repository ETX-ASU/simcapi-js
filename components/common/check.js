/*
 * A library for argument type checking.
 */
define(function(require) {

    var _ = require('underscore');
    
    /**
     * Verify that a given object is a particular type
     * Throws an error if there is a type mismatch.
     * @params arg obj1
     * @params type expected type1
     * @params options {
     *    msg: A string used as the error message,
     *    dontThrow: (true/false - default false) If true, the function returns the boolean value true if all arguments
     *      match the given types. If false, the function throws and error if there is a type mismatch. 
     * }
     */
    var verifyArg = function(arg, type, options) {
        options = options || { passive : false };
        
        if (!(arg && type && (arg.constructor === type || arg instanceof type ))) {            
            if (options && options.dontThrow) {
                return false;
            }
            if (options && options.msg) {
                throw new Error(options.msg);
            }
            throw new Error('Type mismatch. Expecting type "' + type + '" got "' + (arg ? arg.constructor : typeof arg) + '" for argument "' + arg + '".');
        }
        return true;
    };

    /**
     * Verify a list of arguments.
     * Throws an error if there is a type mismatch.
     * @params args [obj1, ... , ojbn]
     * @params types expected [type1, ... , typen]
     * @params options {
     *    msg: A string used as the error message,
     *    dontThrow: (true/false - default false) If true, the function returns the boolean value true if all arguments
     *      match the given types. If false, the function throws and error if there is a type mismatch. 
     * }
     */
    var verify = function(args, types, options) {
        options = options || { passive : false };
        if (args.length !== types.length) {
            if (options && options.dontThrow) {
                return false;
            }
            throw new Error('Not enough arguments. Args has length ' + args.length + ' and types has length ' + types.length);
        }

        var result = true;
        _.each(args, function(value, index) {
            result = result && verifyArg(value, types[index], options);
        });

        return result;
    };

    /**
     * Returns a type checker for the given value.
     * @params options {
     *    msg: A string used as the error message,
     *    passive: (true/false - default false) If true, the function returns the boolean value true if all arguments
     *      match the given types. If false, the function throws and error if there is a type mismatch. 
     * }
     */
    var check = function(value, options) {
        return {
            isFunction: function() {return verifyArg(value, Function, options);},
            isString: function() {return verifyArg(value, String, options);},
            isNumber: function() {return verifyArg(value, Number, options);},
            isBoolean: function() {return verifyArg(value, Boolean, options);},
            isObject: function() {return verifyArg(value, Object, options);},
            isArray: function() {return verifyArg(value, Array, options);},
            isOfType: function(type) {return verifyArg(value, type, options);}
        };
    };
    
    return check;
});