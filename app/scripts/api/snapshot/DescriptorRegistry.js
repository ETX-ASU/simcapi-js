define(function(require) {
    var SimCapiTypes = require('api/snapshot/SimCapiTypes');

    var descriptors = [];

    var capiPatternRegEx = new RegExp('`([^\`]*?)`', 'g');
    var dynamicRegexps = [];

    var Registry = {
        register: function(name, metadata, simcapiValue){
            matadata = metadata || {};

            if(dynamicRegexps.some(function(regEx){ return name.match(regEx); })) {
                return;
            }
            if(metadata.alias){
                if(dynamicRegexps.some(function(regEx){ return metadata.alias.match(regEx) ; })) { return; }
            }

            descriptors.push({
                name: name,
                metadata: metadata,
                typeName: SimCapiTypes.toString(simcapiValue.type),
                simCapiValue: simcapiValue
            });
        },
        registerDynamic: function(metadata){
            var type = metadata.type || SimCapiTypes.TYPES.STRING;

            var dynamicList = metadata.pattern.match(capiPatternRegEx);
            var dynamicRegexString = metadata.pattern.split(new RegExp(dynamicList.join('|'))).map(function(s){ return '(' + s.replace('.','\\.') +')'; }).join('(.*)');
            dynamicRegexps.push(new RegExp(dynamicRegexString));

            descriptors.push({
                dynamic: true,
                metadata: metadata,
                typeName: SimCapiTypes.toString(type)
            });
        },
        getAllDescriptors: function(){
            return descriptors;
        }
    };

    return Registry;

});