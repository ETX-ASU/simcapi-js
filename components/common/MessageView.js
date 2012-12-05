/** Displays a Message object. */
define(['underscore', 'backbone', 
        'common/Message', 'text!common/message.html'],
    function(_, Backbone, Message, template) {
  var MessageView = Backbone.View.extend({
    className: 'messageView',
    initialize: function() {
      if (! this.model || !(this.model instanceof Message)) {
        throw new Error('model should be a message');
      }

      this.$el.html(_.template(template)({ message: this.model }));
    }
  });

  return MessageView;
});