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
    },

    // Thrift services
    thrift: {
      deps   : ['jquery'],
      exports: 'Thrift'
    },
    tf_errorsTypes:      { deps: ['thrift'] },
    tf_typesTypes:       { deps: ['thrift'] },

    tf_logServiceTypes: { deps: ['thrift'] },
    tf_logService: {
      deps: ['tf_typesTypes'],
      exports: 'LogServiceClient'
    }
  },
  paths: {
    text      : '../../../components/requirejs-text/text',
    jquery    : '../../../components/jquery/jquery',
    underscore: '../../../components/underscore/underscore',
    backbone  : '../../../components/backbone/backbone',
    common    : '../../../components/common',

    uuid: '../../../components/node-uuid/uuid',

    // Shortcut for common
    eventBus: '../../../components/common/eventBus',
    log     : '../../../components/common/log',

    // Thrift services
    thrift    : 'util/thriftWrapper',
    realThrift: '../../../libs/thrift',
    
    tf_logServiceTypes: '../../../components/spr-thrift-js/LogService_types'
  }
});