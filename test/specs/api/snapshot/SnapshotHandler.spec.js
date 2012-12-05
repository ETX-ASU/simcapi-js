/*global ComponentType */
define(function(require) {

    var $                    = require('jquery');
    var SnapshotHandler      = require('api/snapshot/SnapshotHandler');
    var mcqInputHandler      = require('api/component/mcqInputHandler');
    var sliderInputHandler   = require('api/component/sliderInputHandler');
    var dropdownInputHandler = require('api/component/dropdownInputHandler');
    var longInputTextHandler = require('api/component/longInputTextHandler');
    var booleanInputHandler  = require('api/component/booleanInputHandler');

    describe('SnapshotHandler', function() {

        var handler = null;
        var $content = null;
        var inputTypes = null;
        var simCapiHandler = null;

        beforeEach(function(){
            $content = $('<div><div id="input1">'+
                            '<input type="text" id="text1" />' +
                            '<input type="text" id="number1" />' +
                         '</div></div>');
            inputTypes = {
                text1 : ComponentType.SHORT_TEXT_INPUT,
                number1 : ComponentType.NUMBER_INPUT,
                mcq: ComponentType.MCQ_INPUT,
                sliderInput: ComponentType.SLIDER_INPUT,
                dropdown: ComponentType.DROPDOWN_INPUT,
                longtext: ComponentType.LONG_TEXT_INPUT,
                boolean: ComponentType.BOOLEAN_INPUT,
                iframe: ComponentType.IFRAME_INPUT
            };

            simCapiHandler = {getSnapshot: function(){}};

            handler = new SnapshotHandler({
                $container: $content,
                simCapiHandler: simCapiHandler
            });

        });

        describe('SHORT_TEXT_INPUT', function(){

            it('should set the value of a snapshot', function(){
                handler.snapshot('stage.text1.text', inputTypes, 'value1');
                expect($content.find('#text1').val()).toBe('value1');
            });

            it('should return the value of a snapshot', function(){
                handler.snapshot('stage.text1.text', inputTypes, 'value1');

                var snapshot = handler.snapshot('stage.text1.text', inputTypes);

                expect(Object.keys(snapshot).length).toBe(1);
                expect(snapshot['stage.text1.text']).toBe('value1');
            });

            it('should accept a component path when acting as a getter', function(){
                handler.snapshot('stage.text1.text', inputTypes, 'value1');

                var snapshot = handler.snapshot('stage.text1', inputTypes);

                expect(Object.keys(snapshot).length).toBe(2);
                expect(snapshot['stage.text1.text']).toBe('value1');
                expect(snapshot['stage.text1.textLength']).toBe('6');
            });

        });

        describe('NUMBER_INPUT', function(){

            it('should set the value of a snapshot', function(){
                handler.snapshot('stage.number1.value', inputTypes, '2');
                expect($content.find('#number1').val()).toBe('2');
            });

            it('should return the value of a snapshot', function(){
                handler.snapshot('stage.number1.value', inputTypes, '2');

                var snapshot = handler.snapshot('stage.number1.value', inputTypes);

                expect(Object.keys(snapshot).length).toBe(1);
                expect(snapshot['stage.number1.value']).toBe('2');
            });

            it('should accept a component path when acting as a getter', function(){
                handler.snapshot('stage.number1.value', inputTypes, '2');

                var snapshot = handler.snapshot('stage.number1', inputTypes);

                expect(Object.keys(snapshot).length).toBe(1);
                expect(snapshot['stage.number1.value']).toBe('2');
            });

        });

        describe('MCQ_INPUT', function(){

            beforeEach(function(){
                // mcq input handler
                spyOn(mcqInputHandler, 'snapshot').andCallFake(function($container, snapshotSegment){
                    expect($container).toBe($content);
                    expect(snapshotSegment.path[0]).toBe('stage');
                    expect(snapshotSegment.path[1]).toBe('mcq');
                });
            });

            it('should accept full path', function(){
                handler.snapshot('stage.mcq.selectedChoice', inputTypes, '1');
                expect(mcqInputHandler.snapshot.calls.length).toBe(1);
            });

            it('should accept component path', function(){
                handler.snapshot('stage.mcq', inputTypes);
                expect(mcqInputHandler.snapshot.calls.length).toBe(1);
            });

        });

        describe('SLIDER_INPUT', function(){

            beforeEach(function(){
                // slider input handler
                spyOn(sliderInputHandler, 'snapshot').andCallFake(function($container, snapshotSegment){
                    expect($container).toBe($content);
                    expect(snapshotSegment.path[0]).toBe('stage');
                    expect(snapshotSegment.path[1]).toBe('sliderInput');
                });
            });

            it('should accept full path', function(){
                handler.snapshot('stage.sliderInput.value', inputTypes, '1');
                expect(sliderInputHandler.snapshot.calls.length).toBe(1);
            });

            it('should accept component path', function(){
                handler.snapshot('stage.sliderInput', inputTypes);
                expect(sliderInputHandler.snapshot.calls.length).toBe(1);
            });

        });

        describe('DROPDOWN_INPUT', function(){

            beforeEach(function(){
                // dropdown input handler
                spyOn(dropdownInputHandler, 'snapshot').andCallFake(function($container, snapshotSegment){
                    expect($container).toBe($content);
                    expect(snapshotSegment.path[0]).toBe('stage');
                    expect(snapshotSegment.path[1]).toBe('dropdown');
                });
            });

            it('should accept full path', function(){
                handler.snapshot('stage.dropdown.selectedIndex', inputTypes, '1');
                expect(dropdownInputHandler.snapshot.calls.length).toBe(1);
            });

            it('should accept component path', function(){
                handler.snapshot('stage.dropdown', inputTypes);
                expect(dropdownInputHandler.snapshot.calls.length).toBe(1);
            });

        });

        describe('BOOLEAN_INPUT', function(){

            beforeEach(function(){
                // boolean input handler
                spyOn(booleanInputHandler, 'snapshot').andCallFake(function($container, snapshotSegment){
                    expect($container).toBe($content);
                    expect(snapshotSegment.path[0]).toBe('stage');
                    expect(snapshotSegment.path[1]).toBe('boolean');
                });
            });

            it('should accept full path', function(){
                handler.snapshot('stage.boolean.value', inputTypes, 'true');
                expect(booleanInputHandler.snapshot.calls.length).toBe(1);
            });

            it('should accept component path', function(){
                handler.snapshot('stage.boolean', inputTypes);
                expect(booleanInputHandler.snapshot.calls.length).toBe(1);
            });

        });

        describe('LONG_TEXT_INPUT', function(){

            beforeEach(function(){
                // long text input handler
                spyOn(longInputTextHandler, 'snapshot').andCallFake(function($container, snapshotSegment){
                    expect($container).toBe($content);
                    expect(snapshotSegment.path[0]).toBe('stage');
                    expect(snapshotSegment.path[1]).toBe('longtext');
                });
            });

            it('should accept full path', function(){
                handler.snapshot('stage.longtext.text', inputTypes, '1');
                expect(longInputTextHandler.snapshot.calls.length).toBe(1);
            });

            it('should accept component path', function(){
                handler.snapshot('stage.longtext', inputTypes);
                expect(longInputTextHandler.snapshot.calls.length).toBe(1);
            });

        });

        describe('IFRAME_INPUT', function(){

            beforeEach(function(){
                // long text input handler
                spyOn(simCapiHandler, 'getSnapshot').andCallFake(function(snapshotSegment){
                    expect(snapshotSegment.path[0]).toBe('stage');
                    expect(snapshotSegment.path[1]).toBe('iframe');
                });
            });

            it('should accept full path', function(){
                handler.snapshot('stage.iframe.text', inputTypes, '1');
                expect(simCapiHandler.getSnapshot.calls.length).toBe(1);
            });

            it('should accept component path', function(){
                handler.snapshot('stage.iframe', inputTypes);
                expect(simCapiHandler.getSnapshot.calls.length).toBe(1);
            });

        });

    });

});