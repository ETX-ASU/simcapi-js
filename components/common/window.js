/*global window */
/* Wraps the window object with methods to allow create testable components
 * that need to use the window. For example, window.location cannot be spied
 * or mock because is not a method. This component will access that property
 * through a method allowing spying or mocking. */
define(['underscore'], function(_) {
  var WindowWrapper = function() {};
  _.extend(WindowWrapper.prototype, {
    getLocation: function() {
      return window.location.href;
    },
    setLocation: function(url) {
      window.location.href = url;
    }
  });

  return new WindowWrapper();
});