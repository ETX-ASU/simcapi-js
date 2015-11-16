define(function(require) {
    var _                     = require('underscore');
    var SimCapiBindingManager = require('api/snapshot/SimCapiBindingManager');

    describe('SimCapiBindingManager', function() {
        beforeEach(function() {
          SimCapiBindingManager.reset();
        });

        it('correctly adds bindings', function() {
            SimCapiBindingManager.addBinding('iframeId1', 'stage.iframeId1.value1', 'stage.bound1');
            SimCapiBindingManager.addBinding('iframeId1', 'stage.iframeId1.value2', 'stage.bound2');
            SimCapiBindingManager.addBinding('iframeId2', 'stage.iframeId2.value1', 'stage.bound1');
            SimCapiBindingManager.addBinding('iframeId2', 'stage.iframeId2.value2', 'stage.bound2');

            var bindingMap = SimCapiBindingManager.getBindingMap();

            expect(_.size(bindingMap)).to.be(4);
            expect(bindingMap['stage.iframeId1.value1']).to.be('stage.bound1');
            expect(bindingMap['stage.iframeId1.value2']).to.be('stage.bound2');
            expect(bindingMap['stage.iframeId2.value1']).to.be('stage.bound1');
            expect(bindingMap['stage.iframeId2.value2']).to.be('stage.bound2');

            var invertedBindingMap = SimCapiBindingManager.getInvertedBindingMap();

            expect(_.size(invertedBindingMap)).to.be(2);
            expect(invertedBindingMap['stage.bound1'].length).to.be(2);
            expect(invertedBindingMap['stage.bound1'][0]).to.be('stage.iframeId1.value1');
            expect(invertedBindingMap['stage.bound1'][1]).to.be('stage.iframeId2.value1');

            expect(invertedBindingMap['stage.bound2'].length).to.be(2);
            expect(invertedBindingMap['stage.bound2'][0]).to.be('stage.iframeId1.value2');
            expect(invertedBindingMap['stage.bound2'][1]).to.be('stage.iframeId2.value2');
        });

        it('correctly removes bindings', function() {
            SimCapiBindingManager.addBinding('iframeId1', 'stage.iframeId1.value1', 'stage.bound1');
            SimCapiBindingManager.addBinding('iframeId1', 'stage.iframeId1.value2', 'stage.bound2');
            SimCapiBindingManager.addBinding('iframeId2', 'stage.iframeId2.value1', 'stage.bound1');
            SimCapiBindingManager.addBinding('iframeId2', 'stage.iframeId2.value2', 'stage.bound2');

            SimCapiBindingManager.removeBinding('stage.iframeId2.value1');

            var bindingMap = SimCapiBindingManager.getBindingMap();

            expect(_.size(bindingMap)).to.be(3);
            expect(bindingMap['stage.iframeId1.value1']).to.be('stage.bound1');
            expect(bindingMap['stage.iframeId1.value2']).to.be('stage.bound2');
            expect(bindingMap['stage.iframeId2.value2']).to.be('stage.bound2');

            var invertedBindingMap = SimCapiBindingManager.getInvertedBindingMap();

            expect(_.size(invertedBindingMap)).to.be(2);
            expect(invertedBindingMap['stage.bound1'].length).to.be(1);
            expect(invertedBindingMap['stage.bound1'][0]).to.be('stage.iframeId1.value1');

            expect(invertedBindingMap['stage.bound2'].length).to.be(2);
            expect(invertedBindingMap['stage.bound2'][0]).to.be('stage.iframeId1.value2');
            expect(invertedBindingMap['stage.bound2'][1]).to.be('stage.iframeId2.value2');
        });

        it('removeIframeBindings - correctly removes an iframe\'s bindings', function() {
            SimCapiBindingManager.addBinding('iframeId1', 'stage.iframeId1.value1', 'stage.bound1');
            SimCapiBindingManager.addBinding('iframeId1', 'stage.iframeId1.value2', 'stage.bound2');
            SimCapiBindingManager.addBinding('iframeId2', 'stage.iframeId2.value1', 'stage.bound1');
            SimCapiBindingManager.addBinding('iframeId2', 'stage.iframeId2.value2', 'stage.bound2');

            SimCapiBindingManager.removeIframeBindings('iframeId2');

            var bindingMap = SimCapiBindingManager.getBindingMap();

            expect(_.size(bindingMap)).to.be(2);
            expect(bindingMap['stage.iframeId1.value1']).to.be('stage.bound1');
            expect(bindingMap['stage.iframeId1.value2']).to.be('stage.bound2');

            var invertedBindingMap = SimCapiBindingManager.getInvertedBindingMap();

            expect(_.size(invertedBindingMap)).to.be(2);
            expect(invertedBindingMap['stage.bound1'].length).to.be(1);
            expect(invertedBindingMap['stage.bound1'][0]).to.be('stage.iframeId1.value1');

            expect(invertedBindingMap['stage.bound2'].length).to.be(1);
            expect(invertedBindingMap['stage.bound2'][0]).to.be('stage.iframeId1.value2');
        });

        it('reset - cleans state', function() {
            SimCapiBindingManager.addBinding('iframeId1', 'stage.iframeId1.value1', 'stage.bound1');
            SimCapiBindingManager.addBinding('iframeId1', 'stage.iframeId1.value2', 'stage.bound2');
            SimCapiBindingManager.addBinding('iframeId2', 'stage.iframeId2.value1', 'stage.bound1');
            SimCapiBindingManager.addBinding('iframeId2', 'stage.iframeId2.value2', 'stage.bound2');

            SimCapiBindingManager.reset();

            var bindingMap = SimCapiBindingManager.getBindingMap();
            var invertedBindingMap = SimCapiBindingManager.getInvertedBindingMap();

            expect(_.size(bindingMap)).to.be(0);
            expect(_.size(invertedBindingMap)).to.be(0);
        });
    });
});
