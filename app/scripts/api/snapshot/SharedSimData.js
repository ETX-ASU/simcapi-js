
define(function(require) {
  var SharedSimData, data, eventBus, _instance;
  eventBus = require('eventBus');
  _instance = null;
  data = {};
  return SharedSimData = (function() {

    function SharedSimData() {
      eventBus.on('simData:lessonId', function(lessonId) {
        return data.lessonId = lessonId;
      });
      eventBus.on('simData:questionId', function(questionId) {
        return data.questionId = questionId;
      });
      eventBus.on('simData:servicesBaseUrl', function(endpoint) {
        return data.servicesBaseUrl = endpoint;
      });
    }

    SharedSimData.prototype.getData = function() {
      return {
        lessonId: data.lessonId,
        questionId: data.questionId,
        servicesBaseUrl: data.servicesBaseUrl
      };
    };

    SharedSimData.getInstance = function() {
      _instance = _instance || new SharedSimData();
      return _instance;
    };

    return SharedSimData;

  })();
});
