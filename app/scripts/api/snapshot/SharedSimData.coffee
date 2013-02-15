# Holds important information about the current user,
# and the current state of the viewer (lesson id, question id, etc.)
# The eventBus is used to update its state.
define (require) ->
  eventBus = require 'eventBus'

  _instance = null

  data = {}

  class SharedSimData
    constructor: ->
      eventBus.on 'simData:lessonId', (lessonId) -> data.lessonId = lessonId
      eventBus.on 'simData:questionId', (questionId) -> data.questionId = questionId
      eventBus.on('simData:servicesBaseUrl', (endpoint) -> data.servicesBaseUrl = endpoint)

    # A new object is created to ensure that the data cannot be modified
    # outside this class.
    getData: ->
      {
        lessonId       : data.lessonId
        questionId     : data.questionId
        servicesBaseUrl: data.servicesBaseUrl
      }

    # Adding static methods
    @getInstance: ->
      _instance = (_instance || new SharedSimData())

      _instance
