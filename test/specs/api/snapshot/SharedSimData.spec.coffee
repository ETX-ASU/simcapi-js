define (require) ->
  log           = require 'log'
  eventBus      = require 'eventBus'
  SharedSimData = require 'api/snapshot/SharedSimData'

  describe 'SharedSimData', ->
    beforeEach ->
      log.start()
    afterEach ->
      eventBus.off null, null, null
      log.stop()

    it 'returns same object in two getInstance() invocations', ->
      expect(SharedSimData.getInstance()).to.equal(SharedSimData.getInstance())

    it 'updates the shared state', ->
      sharedSimData = new SharedSimData()
      eventBus.trigger 'simData:authToken', 'whatAToken'
      eventBus.trigger 'simData:lessonId', '123'
      eventBus.trigger 'simData:viewerServiceEndpoint', 'urlToViewerService'

      data = sharedSimData.getData()
      expect(data.authToken).to.equal 'whatAToken'
      expect(data.lessonId).to.equal '123'
      expect(data.viewerServiceEndpoint).to.equal 'urlToViewerService'