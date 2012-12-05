/*global window */
define(['version', 'log', 'services/logService',
        'login/userManager', 'common/GlobalErrorView'],
    function(version, log, logService, userManager, GlobalErrorView) {
  var sendErrorToServer = function() {
    var userId = -1; // -1 is anonymous
    var user = userManager.getUser();
    if (user) {
      userId = user.id;
    }
    logService.log([log.getLogEntries(), userId, version]);
  };
  var initialize = function() {
    window.onerror = function(errorMsg, url, lineNumber) {
      log.error(
          "Global error. Message: {}, url: {}, lineNumber: {}",
          errorMsg, url, lineNumber);
      sendErrorToServer();

      // Displaying big error message
      new GlobalErrorView().attach();
    };
  };

  return {
    initialize: initialize
  };
});