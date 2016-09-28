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

/*global requirejs */
requirejs.config({
    shim: {
        jquery: {
            exports: '$'
        },
        backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        }
    },
    paths: {
        jquery: '../../../bower_components/jquery/dist/jquery',
        underscore: '../../../bower_components/lodash/lodash',
        backbone: '../../../bower_components/backbone/backbone',
        almond: '../../../bower_components/almond/almond',
        check: '../../../bower_components/check-js/check.min'
    }
});
