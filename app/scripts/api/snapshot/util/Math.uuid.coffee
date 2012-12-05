# SimCapi.js requires Math.uuid.js to be available at 'util/Math.uuid.js'.
# Math.uuid.js is an modified old version of 'node-uuid'.
# 'node-uuid' can be downloaded using bower, but in order to make available
# its functionality, instead of modifying the source, we wrap it in this file.
define (require) ->
  require "uuid"

  # By default, 'uuid' function will be appended to the global context (window)
  {
    uuid: window.uuid
  }
