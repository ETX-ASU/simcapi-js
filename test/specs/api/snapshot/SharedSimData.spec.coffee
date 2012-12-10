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
      expect(SharedSimData.getInstance()).toEqual(SharedSimData.getInstance())

    it 'updates the shared state', ->
      sharedSimData = new SharedSimData()
      eventBus.trigger 'simData:lessonId', '123'
      eventBus.trigger 'simData:servicesBaseUrl', 'baseUrl'

      data = sharedSimData.getData()
      expect(data.lessonId).toEqual '123'
      expect(data.servicesBaseUrl).toEqual 'baseUrl'