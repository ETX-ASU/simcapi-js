
define(function(require) {
  var SharedSimData, eventBus;
  eventBus = require('eventBus');
  SharedSimData = require('api/snapshot/SharedSimData');
  return describe('SharedSimData', function() {
    it('returns same object in two getInstance() invocations', function() {
      return expect(SharedSimData.getInstance()).to.be(SharedSimData.getInstance());
    });
    return it('updates the shared state', function() {
      var data, sharedSimData;
      sharedSimData = SharedSimData.getInstance();
      eventBus.trigger('simData:lessonId', '123');
      eventBus.trigger('simData:servicesBaseUrl', 'baseUrl');
      data = sharedSimData.getData();
      expect(data.lessonId).to.be('123');
      return expect(data.servicesBaseUrl).to.be('baseUrl');
    });
  });
});
