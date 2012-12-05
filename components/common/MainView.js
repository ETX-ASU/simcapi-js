/* This is a view that attaches a div to the body, and then listens
 * to the 'setMainView' event to update the contents of that div.
 * The idea is to use it as the main html element of the application. */
/*global define, document */
define(['jquery', 'underscore', 'eventBus'],
    function($, _, eventBus) {

  var MainView = function() {};
  _.extend(MainView.prototype, {
    start: function() {
      var self = this;
      eventBus.bind('setMainView', function(newView) {
        if (self.currentView !== newView) {
          self.currentView = newView;
          if (self.$mainDiv) {
            // detach instead of remove to avoid removing listeners
            // http://api.jquery.com/remove/
            self.$mainDiv.children().detach();
            self.$mainDiv.append(newView.$el);
          }
        }
      });

      $(document).ready(function() {
        self.$mainDiv = $(document.createElement('div'));

        self.$mainDiv.addClass('mainView');
        $('body').append(self.$mainDiv);

        if (self.currentView) {
          self.$mainDiv.append(self.currentView.$el);
        }
      });
    },
    stop: function() {
      eventBus.off(null, null, this);
      this.$mainDiv.remove();
    }
  });

  return MainView;
});