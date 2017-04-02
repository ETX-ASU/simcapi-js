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

/*globals sinon*/
define(function(require) {

    var CapiAdapter  = require('api/snapshot/adapters/CapiAdapter').CapiAdapter;
    var Transporter  = require('api/snapshot/Transporter').Transporter;
    var SimCapiValue = require('api/snapshot/SimCapiValue');
    var SimCapiTypes = require('api/snapshot/SimCapiTypes');

    require('sinon');

    describe('CapiAdapter', function() {

        var model = null;
        var modelAttributes = {};
        var modelsMapping = {};
        var sandbox = null;


        var transporter = null;
        var adapter = null;

        beforeEach(function() {

            sandbox = sinon.sandbox.create();

            modelAttributes = {
                'attr1': 5,
                'attr2': [],
                'fakeAttr': null
            };

            model = {
                get: function(varName) {
                    return modelAttributes[varName];
                },
                set: function() {},
                on: sinon.stub(),
                has: function(varName) {
                    return varName;
                },
                off: function() {}
            };

            modelsMapping = {};

            transporter = new Transporter();
            adapter = new CapiAdapter({
                transporter: transporter,
                modelsMapping: modelsMapping
            });

        });

        afterEach(function() {
            sandbox.restore();
        });



        it('should create SimCapiValues properly', function() {
            sandbox.stub(transporter, 'expose', function(capiValue) {
                expect(capiValue).to.be.a(SimCapiValue);
            });

            adapter.expose('attr1', model, {
                readonly: false
            });

            expect(transporter.expose.callCount).to.be(1);
        });

        it('should set new value of property when changed', function(){
            sandbox.stub(transporter, 'setValue', function(capiValue){
                expect(capiValue).to.be.a(SimCapiValue);
                expect(capiValue.value).to.equal(10);
            });
            
            adapter.expose('attr1', model, {
                readonly: false
            });

            modelAttributes['attr1'] = 10;
            model.on.getCall(0).args[1](model, modelAttributes['attr1']);

            expect(transporter.setValue.callCount).to.be(1);
        });

        it('should create SimCapiValues properly when of type array', function() {
            sandbox.stub(transporter, 'expose', function(capiValue) {
                expect(capiValue.value).to.be('[]');
            });

            adapter.expose('attr2', model, {
                readonly: false
            });
        });

        it('should create SimCapiValues properly when of type array_point', function() {
            sandbox.stub(transporter, 'expose', function(capiValue) {
                expect(capiValue.value).to.be('[]');
            });

            adapter.expose('attr2', model, {
                readonly: false,
                type: SimCapiTypes.TYPES.ARRAY_POINT
            });
        });

        it('should pass the writeonly param into the SimCapiValue', function() {
            sandbox.stub(transporter, 'expose', function(capiValue) {
                expect(capiValue.writeonly).to.be(true);
            });

            adapter.expose('attr1', model, {
                writeonly: true
            });

            expect(transporter.expose.callCount).to.be(1);
        });

        it('should delete attributes from its mapping when unexposed', function() {
            adapter.expose('attr2', model, {
                readonly: false
            });

            expect(modelsMapping['attr2']).to.not.equal(undefined);

            adapter.unexpose('attr2', model);

            expect(modelsMapping['attr2']).to.equal(undefined);
        });

        it('should set new values when recieved', function() {
            adapter.expose('attr1', model);

            sandbox.stub(model, 'set');

            adapter.handleValueChange([new SimCapiValue({
                key: 'attr1',
                value: 6
            })]);

            expect(model.set.callCount).to.be(1);
        });

        it('should set new value of array type to be an array when recieved', function() {
            adapter.expose('attr2', model);

            sandbox.stub(model, 'set', function(m, v) {
                expect(v).to.be.a(Array);
            });

            adapter.handleValueChange([new SimCapiValue({
                key: 'attr2',
                value: '[10]'
            })]);

        });

        it('should remove SimCapiValues when unwatch', function() {
            sandbox.stub(transporter, 'removeValue', function(alias) {
                expect(alias).to.equal('attr1.newName');
            });

            sandbox.stub(model, 'off', function(eventName, funct) {
                expect(eventName).to.equal('change:attr1');
            });

            adapter.expose('attr1', model, {
                readonly: false,
                alias: "attr1.newName"
            });
            adapter.unexpose('attr1', model);

            expect(transporter.removeValue.callCount).to.equal(1);
        });
    });

});
