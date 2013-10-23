/*global requirejs */
requirejs.config({
  shim: {
    jquery: {
      exports: '$'
    },
    underscore: {
      exports: '_'
    },
    backbone: {
      deps   : ['jquery', 'underscore'],
      exports: 'Backbone'
    }
  },
  paths: {
    jquery    : '../../../bower_components/jquery/jquery',
    underscore: '../../../bower_components/underscore/underscore',
    backbone  : '../../../bower_components/backbone/backbone',
    almond    : '../../../bower_components/almond/almond',
    check: '../../../bower_components/check-js/check.min',
    
    // libs
    sinon: '../../../libs/sinon-1.5.2',

    // Shortcut for common
    eventBus: 'util/eventBus'
  }
});