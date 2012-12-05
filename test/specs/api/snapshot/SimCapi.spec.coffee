define (require) ->
  SimCapi        = require("api/snapshot/SimCapi").SimCapi
  SimCapiValue   = require("api/snapshot/SimCapiValue")
  SimCapiMessage = require("api/snapshot/SimCapiMessage")

  describe "SimCapi", ->
    requestToken = "requestToken"
    authToken    = "testToken"
    simCapi      = null

    beforeEach ->
      # mock out event registration on the window
      sinon.stub(window, "addEventListener", (eventType, callback) ->
        expect(eventType).to.equal "message"
        expect(callback).to.be.exist
      )

      simCapi = new SimCapi(requestToken: requestToken)

    #
    # Helper to mock out PostMessage on the window object.
    #
    mockPostMessage = (assertCallback) ->
      # mock out postMessage on the window object
      if simCapi.sendMessage.isSpy
        simCapi.sendMessage.reset()
        simCapi.sendMessage.andCallFake assertCallback
      else
        sinon.stub(simCapi, "sendMessage", assertCallback)

    describe "HANDSHAKE_REQUEST", ->
      it "should send a requestHandshake when trying to send ON_READY notification", ->

        # mock out handshake request upon initialization
        mockPostMessage (message) ->

          # verify that the handshake request has a request token
          expect(message.type).to.equal SimCapiMessage.TYPES.HANDSHAKE_REQUEST
          expect(message.handshake.requestToken).to.equal requestToken
          expect(message.handshake.authToken).to.be.null

        simCapi.notifyOnReady()
        sinon.assert(window.addEventListener).called()
        sinon.assert(simCapi.sendMessage).called()


    describe "HANDSHAKE_RESPONSE", ->
      it "should ignore HANDSHAKE_RESPONSE when requestToken does not match", ->

        # create a handshakeResponse message with a different request token
        handshakeResponse = new SimCapiMessage(
          type: SimCapiMessage.TYPES.HANDSHAKE_RESPONSE
          handshake:
            requestToken: "bad request token"
            authToken: authToken
        )

        # mock out postMessage for ON_READY. This shouldn't be called
        mockPostMessage ->

        simCapi.capiMessageHandler handshakeResponse

        # verify that the message was not called
        sinon.assert(simCapi).notCalled()


    describe "ON_READY", ->
      it "should send ON_READY followed by a VALUE_CHANGE message when told", ->

        # create a handshakeResponse message
        handshakeResponse = new SimCapiMessage(
          type: SimCapiMessage.TYPES.HANDSHAKE_RESPONSE
          handshake:
            requestToken: requestToken
            authToken: authToken
        )

        # process handshake response so it remembers the auth token
        simCapi.capiMessageHandler handshakeResponse
        invoked = 0
        gotOnReady = -1
        gotValueChange = -1

        # mock out postMessage for ON_READY message
        mockPostMessage (message) ->

          # remember the order that we recieved messages
          switch message.type
            when SimCapiMessage.TYPES.ON_READY
              gotOnReady = ++invoked
            when SimCapiMessage.TYPES.VALUE_CHANGE
              gotValueChange = ++invoked

          # verify that the tokens are remembered
          expect(message.handshake.requestToken).toBe requestToken
          expect(message.handshake.authToken).toBe authToken

        simCapi.notifyOnReady()

        # verify that a message was sent
        expect(simCapi.sendMessage).toHaveBeenCalled()
        expect(gotOnReady < gotValueChange).toBe true

      it """should remember pending ON_READY notification and send it
            after a succesfull HANDSHAKE_RESPONSE""", ->
        invoked = 0
        gotOnReady = -1
        gotValueChange = -1

        # mock out postMessage for ON_READY message
        mockPostMessage (message) ->

          # remember the order that we recieved messages
          switch message.type
            when SimCapiMessage.TYPES.ON_READY
              gotOnReady = ++invoked
            when SimCapiMessage.TYPES.VALUE_CHANGE
              gotValueChange = ++invoked

        simCapi.notifyOnReady()

        # verify that the notification was not sent
        expect(gotOnReady is gotValueChange).toBe true

        # create a handshakeResponse message
        handshakeResponse = new SimCapiMessage(
          type: SimCapiMessage.TYPES.HANDSHAKE_RESPONSE
          handshake:
            requestToken: requestToken
            authToken: authToken
        )

        # process handshake response so it sends the pending notificaiton
        simCapi.capiMessageHandler handshakeResponse

        # verify that a message was sent
        expect(simCapi.sendMessage).toHaveBeenCalled()
        expect(gotOnReady < gotValueChange).toBe true


    describe "VALUE_CHANGE", ->
      outgoingMap = null
      beforeEach ->
        outgoingMap =

          # create two attributes (float and string types) with expected
          # updates of:
          # attr1 -> value1
          # attr2 -> value2
          # value1 and value2 are NOT the current values.
          # @see createAttr for more details
          attr1: createAttr(SimCapi.TYPES.NUMBER, false, "attr1", 0.222)
          attr2: createAttr(SimCapi.TYPES.STRING, false, "attr2", "value2")


        # create a new instance with outgoingMap parameters
        simCapi = new SimCapi(
          requestToken: requestToken
          authToken: authToken
          outgoingMap: outgoingMap
        )


      # helper to create entries in outgoing map. expectedKey and expectedValue represent
      # expected updates. Eg, the value of expectedKey changes to expectedValue.
      createAttr = (type, readOnly, expectedKey, expectedValue) ->
        type: type
        parent:
          set: (key, value) ->

            # verify that the value is updated
            expect(key).toBe expectedKey
            expect(value).toBe expectedValue

        readOnly: readOnly


      #
      #             * create a value change message that performs the following changes:
      #             * attr1 -> value1
      #             * attr2 -> value2
      #
      createGoodValueChangeMessage = ->
        new SimCapiMessage(
          type: SimCapiMessage.TYPES.VALUE_CHANGE
          handshake:
            requestToken: requestToken
            authToken: authToken


          # create two attribute changes as mentioned above
          values:
            attr1: new SimCapiValue(
              type: SimCapiValue.TYPES.STRING
              value: "0.222"
            )
            attr2: new SimCapiValue(
              type: SimCapiValue.TYPES.STRING
              value: "value2"
            )
        )

      it "should attempt to update the model when a VALUE_CHANGE message is recieved", ->
        valueChangeMsg = createGoodValueChangeMessage()

        # spy on simCapi to verify that values are updated.
        # Verifying that the updates are correct are performed @ createAttr
        spyOn(outgoingMap.attr1.parent, "set").andCallThrough()
        spyOn(outgoingMap.attr2.parent, "set").andCallThrough()
        simCapi.capiMessageHandler valueChangeMsg

        # verify that there were two updates
        expect(outgoingMap.attr1.parent.set).toHaveBeenCalled()
        expect(outgoingMap.attr2.parent.set).toHaveBeenCalled()

      it "should ignore VALUE_CHANGE message if values is undefined", ->

        # create a bad value change message with values = undefined
        badValueChangeMsg = new SimCapiMessage(
          type: SimCapiMessage.TYPES.VALUE_CHANGE
          handshake:
            requestToken: requestToken
            authToken: authToken

          values: undefined
        )
        spyOn(outgoingMap.attr1.parent, "set").andCallThrough()
        spyOn(outgoingMap.attr2.parent, "set").andCallThrough()
        simCapi.capiMessageHandler badValueChangeMsg

        # verify that nothing was updated
        expect(outgoingMap.attr1.parent.set).not.toHaveBeenCalled()
        expect(outgoingMap.attr2.parent.set).not.toHaveBeenCalled()

      it "should ignore VALUE_CHANGE when authToken does not match", ->

        # create a bad value change message with values = undefined
        badValueChangeMsg = new SimCapiMessage(
          type: SimCapiMessage.TYPES.VALUE_CHANGE
          handshake:
            requestToken: requestToken
            authToken: "bad auth token"

          values: undefined
        )
        spyOn(outgoingMap.attr1.parent, "set").andCallThrough()
        spyOn(outgoingMap.attr2.parent, "set").andCallThrough()
        simCapi.capiMessageHandler badValueChangeMsg

        # verify that nothing was updated
        expect(outgoingMap.attr1.parent.set).not.toHaveBeenCalled()
        expect(outgoingMap.attr2.parent.set).not.toHaveBeenCalled()

      it "should not update readonly values", ->
        valueChangeMsg = createGoodValueChangeMessage()

        # change attr2 to be readonly
        outgoingMap.attr2.readonly = true
        spyOn(outgoingMap.attr1.parent, "set").andCallThrough()
        spyOn(outgoingMap.attr2.parent, "set").andCallThrough()
        simCapi.capiMessageHandler valueChangeMsg

        # verify that only attr1 is updated
        expect(outgoingMap.attr1.parent.set).toHaveBeenCalled()
        expect(outgoingMap.attr2.parent.set).not.toHaveBeenCalled()
