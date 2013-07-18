define(['underscore', 'backbone'], function(_, Backbone) {
  var eventBus = _.extend({}, Backbone.Events);

  eventBus.trigger = function trigger() {
    Backbone.Events.trigger.apply(this, arguments);
  };

  return eventBus;
});
