define(['underscore', 'backbone', 'log'], function(_, Backbone, log) {
  var eventBus = _.extend({}, Backbone.Events);

  eventBus.trigger = function trigger() {
    var args = Array.prototype.slice.call(arguments);
    if (args.length > 1) {
      log.info('eventName: {}, arguments: {}', args[0], args.slice(1));
    }
    else {
      log.info('eventName: {}, no arguments', args[0]);
    }
    Backbone.Events.trigger.apply(this, arguments);
  };

  return eventBus;
});
