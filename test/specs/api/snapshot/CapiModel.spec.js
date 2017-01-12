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

    var CapiModel = require('api/snapshot/CapiModel');
    var sinon = require('sinon');

    describe('CapiModel', function() {

        var model;
        var sandbox;

        beforeEach(function() {
            sandbox = sinon.sandbox.create();

            model = new CapiModel({
                testKey1: 'testValue1',
                testKey2: 'testValue2'
            }, {
                initialize: sandbox.spy(),
                testFunction1: sandbox.spy()
            });
        });

        afterEach(function() {
            sandbox.restore();
        });

        describe('after instantiation', function() {
            it('initialize has been called once', function() {
                expect(model.initialize.callCount).to.equal(1);
            });

            it('should allow methods passed during creation to be called', function() {
                expect(model.testFunction1.callCount).to.equal(0);

                model.testFunction1();

                expect(model.testFunction1.callCount).to.equal(1);
            });

            it('get should return the default key values', function() {
                expect(model.get('testKey1')).to.equal('testValue1');
                expect(model.get('testKey2')).to.equal('testValue2');
            });

            it('get should return undefined for a key that does not exist', function() {
                expect(model.get('testKey3')).to.equal(undefined);
            });

            it('get should return the most recent set value for default keys', function() {
                model.set('testKey1', 'foo');

                expect(model.get('testKey1')).to.equal('foo');

                model.set('testKey1', '');

                expect(model.get('testKey1')).to.equal('');

                model.set('testKey1', 0);

                expect(model.get('testKey1')).to.equal(0);

                model.set('testKey1', false);

                expect(model.get('testKey1')).to.equal(false);

                model.set('testKey1', null);

                expect(model.get('testKey1')).to.equal(null);

                model.set('testKey1', { a: 1, b: { c: 2 } });

                expect(model.get('testKey1')).to.eql({ a: 1, b: { c: 2 } });
            });

            it('get should return a new key value created with set', function() {
                expect(model.get('testKey3')).to.equal(undefined);

                model.set('testKey3', 'foo');

                expect(model.get('testKey3')).to.equal('foo');
            });

            it('has should return true for a key that exists', function() {
                expect(model.has('testKey1')).to.equal(true);
            });

            it('has should return false for a key that does not exist', function() {
                expect(model.has('testKey3')).to.equal(false);
            });

            it('has should return true for a key that was added via the set method', function() {
                model.set('testKey3', 'foo');

                expect(model.has('testKey3')).to.equal(true);
            });

            it('has should only return false for a key that was set to undefined', function() {
                model.set('testKey1', '');

                expect(model.has('testKey1')).to.equal(true);

                model.set('testKey1', 0);

                expect(model.has('testKey1')).to.equal(true);

                model.set('testKey1', false);

                expect(model.has('testKey1')).to.equal(true);

                model.set('testKey1', null);

                expect(model.has('testKey1')).to.equal(true);

                model.set('testKey1', undefined);

                expect(model.has('testKey1')).to.equal(false);
            });

            it('should allow setting of a previously existing key', function() {
                model.set('testKey1', undefined);
                model.set('testKey1', 'Im back!');

                expect(model.has('testKey1')).to.equal(true);
            });
        });

        describe('using on method', function() {
            var changeListener;

            beforeEach(function() {
                changeListener = sandbox.spy();
            });

            it('when a default key value changes should call listener', function() {
                model.on('change:testKey1', changeListener);
                model.set('testKey1', '');

                expect(changeListener.callCount).to.equal(1);
            });

            it('should call listener with arguments: model, value like Backbone', function() {
                model.on('change:testKey1', changeListener);
                model.set('testKey1', 'foo');

                expect(changeListener.getCall(0).args).to.eql([model, 'foo']);
            });

            it('when a listener is registered to a key that was added using set - should call listener when key value is changed', function() {
                model.set('testKey3', 'foo');
                model.on('change:testKey3', changeListener);
                model.set('testKey3', 'bar');

                expect(changeListener.callCount).to.equal(1);
            });

            it('when a listener is registered to a key that does not exist yet - should call listener when key value is set', function() {
                model.on('change:testKey3', changeListener);
                model.set('testKey3', 'foo');

                expect(changeListener.callCount).to.equal(1);
            });

            it('when trigger is called with a default key value it should call listener', function() {
                model.on('change:testKey1', changeListener);
                model.trigger('change:testKey1');

                expect(changeListener.callCount).to.equal(1);
            });

            it('when trigger is called with a new key value it should call listener', function() {
                model.set('testKey3', 0);
                model.on('change:testKey1', changeListener);
                model.trigger('change:testKey1');

                expect(changeListener.callCount).to.equal(1);
            });

            it('when set is called with the same key value it should not call listener', function() {
                model.on('change:testKey1', changeListener);
                model.set('testKey1', 'testValue1');

                expect(changeListener.callCount).to.equal(0);
            });

            it('should allow multiple change listeners for one key value', function() {
                var changeListener2 = sandbox.spy();
                model.on('change:testKey1', changeListener);
                model.on('change:testKey1', changeListener2);
                model.set('testKey1', 10);

                expect(changeListener.callCount).to.equal(1);
                expect(changeListener2.callCount).to.equal(1);
            });

            it('should allow multiple change:key change:key to be bound to the same listener on one on call', function() {
                model.on('change:testKey1 change:testKey2', changeListener);
                model.set('testKey1', 10);
                model.set('testKey2', 10);

                expect(changeListener.callCount).to.equal(2);
            });
        });

        describe('using off method', function() {
            var changeListener;

            beforeEach(function() {
                changeListener = sandbox.spy();
            });

            it('when a default key value call listener is removed it should not call it on change', function() {
                model.on('change:testKey1', changeListener);
                model.off('change:testKey1', changeListener);
                model.set('testKey1', 10);

                expect(changeListener.callCount).to.equal(0);
            });

            it('when a dynamically added key value call listener is removed it should not call it on change', function() {
                model.set('testKey3', 10);
                model.on('change:testKey3', changeListener);
                model.off('change:testKey3', changeListener);
                model.set('testKey3', 10);

                expect(changeListener.callCount).to.equal(0);
            });

            it('when multiple event names are turned off at once it should remove them all from being called', function() {
                model.on('change:testKey1 change:testKey2', changeListener);
                model.off('change:testKey1 change:testKey2', changeListener);
                model.set('testKey1', 10);
                model.set('testKey2', 10);

                expect(changeListener.callCount).to.equal(0);
            });
        });
    });

});
