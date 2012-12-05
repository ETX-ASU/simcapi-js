/*global ComponentType */
/*
 * Adaptive E-Learning api. (c) Smart Sparrow
 */
define(function(require) {

    var $               = require('jquery');
    var _               = require('underscore');
    var check           = require('common/check');
    var SnapshotSegment = require('api/snapshot/SnapshotSegment');

    // snapshot handlers
    var shortTextInputHandler = require('api/component/shortInputTextHandler');
    var longInputTextHandler  = require('api/component/longInputTextHandler');
    var numberInputHandler    = require('api/component/numberInputHandler');
    var mcqInputHandler       = require('api/component/mcqInputHandler');
    var sliderInputHandler    = require('api/component/sliderInputHandler');
    var dropdownInputHandler  = require('api/component/dropdownInputHandler');
    var booleanInputHandler   = require('api/component/booleanInputHandler');

    var SnapshotHandler = function(options) {

        // verify that we are given a container
        check(options.$container).isOfType($);

        var $container = options.$container;

        // we can only have one instance of this
        var simCapiHandler = options.simCapiHandler;

        /*
         * prefixes everything in the snapshot and ensures that values are strings.
         */
        var prefixWithStage = function(snapshot) {
            var result = {};
            _.each(snapshot, function(value, key) {
                result['stage.' + key] = value ? value.toString() : value;
            });
            return result;
        };

        /**
         * store/retrieve STAGE snapshot from elements on the stage
         *
         * @param {snapshotSegment}
         *            A snapshotSegment.
         * @param {componentType}
         *            A map of (componentID, thrift.ComponentType). The componentID is the ID of any element on the stage.
         *            eg : text1
         * @returns A dictionary of the snapshot(s) for that component or path.
         */
        var stageSnapshot = function(snapshotSegment, componentType) {
            var snapshot = {};

            switch (componentType) {
            case ComponentType.SHORT_TEXT_INPUT:
                _.extend(snapshot, shortTextInputHandler.snapshot($container, snapshotSegment));
                break;

            case ComponentType.NUMBER_INPUT:
                _.extend(snapshot, numberInputHandler.snapshot($container, snapshotSegment));
                break;

            case ComponentType.MCQ_INPUT:
                _.extend(snapshot, mcqInputHandler.snapshot($container, snapshotSegment));
                break;

            case ComponentType.SLIDER_INPUT:
                _.extend(snapshot, sliderInputHandler.snapshot($container, snapshotSegment));
                break;

            case ComponentType.BOOLEAN_INPUT:
                _.extend(snapshot, booleanInputHandler.snapshot($container, snapshotSegment));
                break;

            case ComponentType.DROPDOWN_INPUT:
                _.extend(snapshot, dropdownInputHandler.snapshot($container, snapshotSegment));
                break;

            case ComponentType.LONG_TEXT_INPUT:
                _.extend(snapshot, longInputTextHandler.snapshot($container, snapshotSegment));
                break;

            case ComponentType.IFRAME_INPUT:
                _.extend(snapshot, simCapiHandler.getSnapshot(snapshotSegment));
                break;
            }
            return prefixWithStage(snapshot);
        };

        /**
         * store/retrieve snapshot for the given question.
         *
         * @param {fullPath}
         *            The full path of the target. eg : stage.text1.text or session.timeOnQuestion. It also accepts
         *            component paths eg. stage.text1 which refer to the textinput component with id text1.
         * @param {componentTypes}
         *            A map of (componentID, thrift.ComponentType). The componentID is the ID of any element on the stage.
         *            eg : text1
         * @param {value}
         *            The value that will replace the value of the target. If a value is not given, this method acts as
         *            a getter.
         * @returns A dictionary of the snapshot(s) for the component or full path.
         */
        this.snapshot = function(fullPath, componentTypes, value) {
            check(fullPath).isString();

            var snapshotSegment = new SnapshotSegment(fullPath, value);
            var snapshot = {};

            if (snapshotSegment.path.length >= 2) {
                // restore stage snapshot values
                if (snapshotSegment.path[0] === 'stage') {
                    if (check(componentTypes, {dontThrow: true}).isObject()) {
                        var componentType = componentTypes[snapshotSegment.path[1]];
                        // merge all the snapshots
                        _.extend(snapshot, stageSnapshot(snapshotSegment, componentType));
                    }
                }
            }

            return snapshot;
        };

    };

    return SnapshotHandler;
});