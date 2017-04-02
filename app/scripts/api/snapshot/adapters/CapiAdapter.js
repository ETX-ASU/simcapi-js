/**
 * @license
 * Adaptive E-Learning Sim Control API (CAPI).
 *
 * Copyright 2011 Smart Sparrow Pty. Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(['underscore',
    'api/snapshot/Transporter',
    'api/snapshot/SimCapiMessage',
    'api/snapshot/SimCapiValue',
    'check',
    'api/snapshot/CapiModel',
    'api/snapshot/SimCapiTypes'
], function(_, Transporter, SimCapiMessage, SimCapiValue, check, CapiModel, SimCapiTypes) {

    var CapiAdapter = function(options) {
        options = options || {};

        var _transporter = options.transporter || Transporter.getInstance();

        var modelsMapping = options.modelsMapping || {};

        /*
         * Allows the 'attributes' to be exposed.
         * @param attrName - The 'attribute name'
         * @param parent - What the 'attribute' belongs to. Must also have a 'get' and 'set function.
         * @param params : {
         *      alias  : alias of the attributeName
         *      type : Type of the 'attribute'. @see SimCapiTypes.TYPES.
         *      readonly : True if and only if, the attribute cannot be changed.
         *      writeonly : True if and only if, the attribute is write-only.
         * }
         */
        this.expose = function(varName, parent, params) {
            params = params || {};

            if (parent.has(varName)) {
                var simCapiParams = params;
                var originalName = varName;
                var alias = params.alias || varName;

                var capiValue = new SimCapiValue({
                    key: alias,
                    value: parent.get(varName),
                    type: params.type,
                    readonly: params.readonly,
                    writeonly: params.writeonly,
                    allowedValues: params.allowedValues
                });

                if (capiValue.type === SimCapiTypes.TYPES.ARRAY || capiValue.type === SimCapiTypes.TYPES.ARRAY_POINT) {
                    capiValue.value = '[' + parent.get(originalName).toString() + ']';
                }

                var watchFunc = _.bind(function(m, value) {
                    var capiValue = new SimCapiValue({
                        key: alias,
                        value: value,
                        type: simCapiParams.type,
                        readonly: simCapiParams.readonly,
                        writeonly: simCapiParams.writeonly,
                        allowedValues: params.allowedValues
                    });

                    if (capiValue.type === SimCapiTypes.TYPES.ARRAY || capiValue.type === SimCapiTypes.TYPES.ARRAY_POINT) {
                        capiValue.value = '[' + parent.get(originalName).toString() + ']';
                    }

                    _transporter.setValue(capiValue);
                }, this);

                // listen to the model by attaching event handler on the parent
                parent.on('change:' + varName, watchFunc);

                modelsMapping[alias] = {
                    alias: alias,
                    parent: parent,
                    originalName: originalName,
                    watchFunc: watchFunc
                };


                _transporter.expose(capiValue);

            }
        };

        /*
         * Allows the 'attributes' to be unexposed.
         * @param attrName - the 'attribute name'
         * @param parent - the model the attribute belongs to
         */
        this.unexpose = function(varName, parent) {

            var modelMap;

            if (modelsMapping[varName]) {
                modelMap = modelsMapping[varName];
            } else {
                //could be under an alias
                modelMap = _.findWhere(modelsMapping, {
                    originalName: varName
                });
            }

            if (modelMap) {
                parent.off('change:' + varName, modelMap.watchFunc);

                _transporter.removeValue(modelMap.alias);

                delete modelsMapping[modelMap.alias];
            } else {
                throw new Error(varName + " doesn't exist on the model");
            }
        };

        /*
         * values - Array of SimCapiValue
         */
        this.handleValueChange = function(values) {
            // enumerate through all received values @see SimCapiMessage.values
            _.each(values, function(capiValue) {
                if (modelsMapping[capiValue.key]) {
                    var parent = modelsMapping[capiValue.key].parent;
                    var originalName = modelsMapping[capiValue.key].originalName;

                    parent.set(originalName, capiValue.value);
                }
            }, this);

        };

        _transporter.addChangeListener(_.bind(this.handleValueChange, this));


    };


    var _instance = null;
    var getInstance = function() {
        if (!_instance) {
            _instance = new CapiAdapter();
            _instance.CapiModel = CapiModel;
        }
        return _instance;
    };

    // in reality, we want a singleton but not for testing.
    return {
        getInstance: getInstance,
        CapiAdapter: CapiAdapter
    };
});
