# Holds important information about the current user,
# and the current state of the viewer (lesson id, question id, etc.)
# The eventBus is used to update its state.
define (require) ->
  eventBus = require 'eventBus'

  _instance = null

  data = {}

  class SharedSimData
    constructor: ->
      eventBus.on 'simData:authToken', (authToken) -> data.authToken = authToken
      eventBus.on 'simData:lessonId', (lessonId) -> data.lessonId = lessonId
      eventBus.on(
        'simData:viewerServiceEndpoint',
        (endpoint) -> data.viewerServiceEndpoint = endpoint)

    # A new object is created to ensure that the data cannot be modified
    # outside this class.
    getData: ->
      {
        authToken            : data.authToken,
        lessonId             : data.lessonId,
        viewerServiceEndpoint: data.viewerServiceEndpoint
      }

    # Adding static methods
    @getInstance: ->
      _instance = (_instance || new SharedSimData())

      _instance
