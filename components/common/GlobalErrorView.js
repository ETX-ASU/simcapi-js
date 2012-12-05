define(['jquery', 'underscore', 'backbone', 'text!common/globalError.html'],
    function($, _, Backbone, template) {
  var GlobalErrorView = Backbone.View.extend({
    className: 'globalErrorView',
    initialize: function() {
      this.$el.html(_.template(template));
    },
    events: {
      'click a[name|=close]': 'detach'
    },
    attach: function() {
      $('body').append(this.$el);
    },
    detach: function() {
      this.$el.remove();
    }
  });

  return GlobalErrorView;
});