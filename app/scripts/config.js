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
    jquery    : '../../../components/jquery/jquery',
    underscore: '../../../components/underscore/underscore',
    backbone  : '../../../components/backbone/backbone',

    check: '../../../components/check-js/check.min',
    
    // libs
    sinon: '../../../libs/sinon-1.5.2',

    // Shortcut for common
    eventBus: 'util/eventBus'
  }
});