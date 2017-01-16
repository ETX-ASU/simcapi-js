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

define(['underscore'], function(_) {

    var CapiModel = function(attrs, methods) {
        _.extend(this, methods);
        this.attributes = _.clone(attrs || {});

        /*
         * key: change:prop
         * value: Array of functions
         */
        this._eventsMap = {};

        var bindGetterAndSetter = function(value, prop) {
            Object.defineProperty(this, prop, {
                get: function() {
                    return this.attributes[prop];
                },
                set: function(val) {
                    if (this.attributes[prop] !== val) {
                        this.attributes[prop] = val;
                        this.trigger('change:' + prop);
                    }
                },
                enumerable: true
            });
        };

        this.set = function(attrName, value) {
            if(!this.has(attrName) && !this.hasOwnProperty(attrName)) {
                this.attributes[attrName] = value;
                bindGetterAndSetter.call(this, value, attrName);
                this.trigger('change:' + attrName);
            } else {
                this[attrName] = value;
            }
        };

        this.get = function(attrName) {
            return this[attrName];
        };

        this.has = function(attrName) {
            return this.attributes[attrName] !== undefined;
        };

        this.on = function(eventNames, funct) {
            var eventNamesArray = eventNames.split(" ");

            _.each(eventNamesArray, function(eventName) {
                var array = this._eventsMap[eventName];

                if (array) {
                    array.push(funct);
                } else {
                    this._eventsMap[eventName] = [funct];
                }
            }, this);
        };

        this.off = function(eventNames, funct) {
            var eventNamesArray = eventNames.split(" ");

            _.each(eventNamesArray, function(eventName) {
                var array = this._eventsMap[eventName];

                if (array) {
                    var indexOf = array.indexOf(funct);

                    if (indexOf !== -1) {
                        array.splice(indexOf, 1);
                    }
                }
            }, this);
        };

        this.trigger = function(eventName) {
            if (this._eventsMap[eventName]) {
                _.each(this._eventsMap[eventName], function(funct) {
                    var propName = eventName.replace('change:', '');

                    funct.call(this, this, this.get(propName));
                }, this);
            }
        };

        /* Converts all attribute to getters and setters */
        _.each(this.attributes, bindGetterAndSetter, this);

        if (this.initialize) {
            this.initialize();
        }
    };

    return CapiModel;
});
