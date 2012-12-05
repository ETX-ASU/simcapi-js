/* It displays a 'loading' message that blocks the UI.
 * Fire 'blockUI' events to display the message,
 * and 'unblockUI' events to hide it.
 * If several 'blockUI' events are fired, the same
 * number of 'unblockUI' events must be fired to hide the view. */
define(function(require) {
  
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      log      = require('log'),
      eventBus = require('eventBus');

  var BlockingView = Backbone.View.extend({
    className: 'blockingView',
    messageTmpl: '<div class="message displayNone">Loading...</div>',
    showCount: 0,
    initialize: function() {
      eventBus.on('blockUI', this.onShowBlockingMsg, this);
      eventBus.on('unblockUI', this.onHideBlockingMsg, this);
      eventBus.on('forceUnblockUI', this.onForceHideBlockingMsg, this);

     this.$el.html(_.template(this.messageTmpl)());
     this.$el.addClass('waitingBlockingView');
    },
    onShowBlockingMsg: function() {
      if (this.showCount === 0) {
        $('body').append(this.$el);
      }
      this.showCount++;
    },
    onHideBlockingMsg: function() {
      if (this.showCount > 0) {
        this.showCount--;
        if (this.showCount === 0) {
          this.$el.detach();
        }
      }
      else {
        // Unexpected 'hideBlockingMsg' event. Ignored silently...
        log.error('Unexpected "hideBlockingMsg" event');
      }
    },
    onForceHideBlockingMsg: function() {
      if (this.showCount > 0) {
        this.showCount = 1;
        this.onHideBlockingMsg();
      }
    }
  });

  return BlockingView;
});