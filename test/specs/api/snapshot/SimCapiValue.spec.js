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

define(function(require) {

    var SimCapiValue = require('api/snapshot/SimCapiValue');
    var SimCapiTypes = require('api/snapshot/SimCapiTypes');

    describe('SimCapiValue', function() {



        it('should determine the proper types', function() {
            var value = new SimCapiValue({
                key: 'test',
                value: 2
            });
            var value2 = new SimCapiValue({
                key: 'test',
                value: "50"
            });
            var value3 = new SimCapiValue({
                key: 'test',
                value: 50,
                type: SimCapiTypes.TYPES.NUMBER
            });

            expect(value.type).to.equal(SimCapiTypes.TYPES.NUMBER);
            expect(value2.type).to.equal(SimCapiTypes.TYPES.STRING);
            expect(value3.type).to.equal(SimCapiTypes.TYPES.NUMBER);
        });

        it('should determine the type to be ENUM and throw error if value is not allowed', function() {
            var allowedValues = ["enum1", "enum2", "enum3"];
            var value = new SimCapiValue({
                key: 'test',
                value: "enum1",
                allowedValues: allowedValues
            });

            expect(value.type).to.equal(SimCapiTypes.TYPES.ENUM);
            expect(value.allowedValues).to.equal(allowedValues);

            expect(function() {
                value.setValue('enumUndefined');
            }).throwError();

        });

        it('should throw error allowed values is not valid', function() {

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: "enum1",
                    allowedValues: "enum1"
                });
            }).throwError();
            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: 1,
                    allowedValues: [1]
                });
            }).throwError();
            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: 1,
                    allowedValues: null
                });
            }).to.not.throwError();

        });

        it('should throw if Math Expression is anything but a String', function() {
            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: 2,
                    type: SimCapiTypes.TYPES.MATH_EXPR
                });
            }).throwError();

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: [],
                    type: SimCapiTypes.TYPES.MATH_EXPR
                });
            }).throwError();

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: "",
                    type: SimCapiTypes.TYPES.MATH_EXPR
                });
            }).to.not.throwError();
        });

        it('should throw if Array Point is anything but an Array', function() {
            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: 2,
                    type: SimCapiTypes.TYPES.ARRAY_POINT
                });
            }).throwError();

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: "",
                    type: SimCapiTypes.TYPES.ARRAY_POINT
                });
            }).throwError();

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: [],
                    type: SimCapiTypes.TYPES.ARRAY_POINT
                });
            }).to.not.throwError();
        });

        it('should not throw when type is string but value is not of type string', function() {
            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: [],
                    type: SimCapiTypes.TYPES.STRING
                });
            }).to.not.throwError();

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: 44,
                    type: SimCapiTypes.TYPES.STRING
                });
            }).to.not.throwError();

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: true,
                    type: SimCapiTypes.TYPES.STRING
                });
            }).to.not.throwError();

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: "enum1",
                    allowedValues: "enum1",
                    type: SimCapiTypes.TYPES.STRING
                });
            }).to.not.throwError();

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: '0.000984=\editable{}\times10^{\editable{}}',
                    type: SimCapiTypes.TYPES.STRING
                });
            }).to.not.throwError();

            expect(function() {
                new SimCapiValue({
                    key: 'test',
                    value: "(8;57),(9;39),(8.25;53),(7.25;40),(8.50;45),(7.75;59),(7;29),(9.25;28),(9;36),(7.25;36)",
                    type: SimCapiTypes.TYPES.STRING
                });
            }).to.not.throwError();
        });

        it('should parse array as a string when type is set to string', function() {
            var simCapiValue = new SimCapiValue({
                key: 'test',
                value: [],
                type: SimCapiTypes.TYPES.STRING
            });

            expect(simCapiValue.value).to.equal("");
        });

        it('should parse an array of one string of spaces as an array with one element', function() {
            var simCapiValue = new SimCapiValue({
                key: 'test',
                value: '[]'
            });

            expect(simCapiValue.value).to.eql([]);
            
            simCapiValue.setValue('[ ]');

            expect(simCapiValue.value).to.eql([' ']);

            simCapiValue.setValue('[    ]');

            expect(simCapiValue.value).to.eql(['    ']);
        });

        it('should trim strings inside arrays that are are not just space characters', function() {
            var simCapiValue = new SimCapiValue({
                key: 'test',
                value: '[foo, ,   , baz, boo ]'
            });

            expect(simCapiValue.value).to.eql(["foo", " ", "   ", "baz", "boo"]);
        });
        
        it('should parse a number as a string when type is set to string', function() {
            var simCapiValue = new SimCapiValue({
                key: 'test',
                value: 44,
                type: SimCapiTypes.TYPES.STRING
            });

            expect(simCapiValue.value).to.equal("44");
        });

        it('should parse a boolean as a string when type is set to string', function() {
            var simCapiValue = new SimCapiValue({
                key: 'test',
                value: true,
                type: SimCapiTypes.TYPES.STRING
            });

            expect(simCapiValue.value).to.equal("true");
        });

        it('should parse an enum as a string when type is set to string', function() {
            var simCapiValue = new SimCapiValue({
                key: 'test',
                value: "enum1",
                allowedValues: "enum1",
                type: SimCapiTypes.TYPES.STRING
            });

            expect(simCapiValue.value).to.equal("enum1");
        });

        it('should parse a math expression as a string when type is set to string', function() {
            var simCapiValue = new SimCapiValue({
                key: 'test',
                value: '0.000984=\editable{}\times10^{\editable{}}',
                type: SimCapiTypes.TYPES.STRING
            });

            expect(simCapiValue.value).to.equal('0.000984=\editable{}\times10^{\editable{}}');
        });

        it('should parse a point array as a string when type is set to string', function() {
            var simCapiValue = new SimCapiValue({
                key: 'test',
                value: "(8;57),(9;39),(8.25;53),(7.25;40),(8.50;45),(7.75;59),(7;29),(9.25;28),(9;36),(7.25;36)",
                type: SimCapiTypes.TYPES.STRING
            });

            expect(simCapiValue.value).to.equal("(8;57),(9;39),(8.25;53),(7.25;40),(8.50;45),(7.75;59),(7;29),(9.25;28),(9;36),(7.25;36)");
        });
    });

});
