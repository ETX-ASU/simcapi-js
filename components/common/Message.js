/** Represents a message that can be displayed in the MessageView.
 * Supported properties:
 * - type: 'INFO', 'WARNING' or 'ERROR'.
 * - message: html that contains the message to display. 
 * - title: html that contains the title to display.*/
define(['underscore', 'backbone'], function(_, Backbone) {
  var types = ['INFO', 'WARNING', 'ERROR'];
  var Message = Backbone.Model.extend({
    defaults: {
      type: 'ERROR'
    },
    initialize: function() {
      if (! this.get('message')) {
        throw new Error('message must be set!');
      }
      // Ensuring type is upper case
      var type = this.get('type').toUpperCase();
      this.set({ 'type': type });
      if (!_.contains(types, type)) {
        throw new Error('unexpected type: ' + this.get('type'));
      }
    }
  });

  return Message;
});