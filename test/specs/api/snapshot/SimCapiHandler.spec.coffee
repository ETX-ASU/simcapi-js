define (require) ->

  $               = require "jquery"
  SimCapiHandler  = require "api/snapshot/SimCapiHandler"
  SimCapiMessage  = require "api/snapshot/SimCapiMessage"
  SimCapiValue    = require "api/snapshot/SimCapiValue"
  SnapshotSegment = require "api/snapshot/SnapshotSegment"

  $(document).ready ->
    describe "CapiHandler", ->

      $container = null
      handler    = null

      beforeEach ->
        # this should be ignored in the search
        $container = $(
          """
          <div>
            <iframe id=\"iframe1\"></iframe>
            <iframe id=\"iframe2\"></iframe>
            <iframe id=\"iframe3\" style=\"display:none\"></iframe>
          </div>
          """)

        # add iframes to the dom
        $("body").append $container

        # stub out event registration
        sinon.stub(window, "addEventListener", (type, callback) ->
          expect(type).to.equal "message"
          expect(callback).to.exist
        )

        handler = new SimCapiHandler($container: $container)

        # make sure it doesn't send any messages to iframe3 because it has display:none
        mockPostMessage "#iframe3", ->
          expect(false).toBe true


      afterEach ->

        # remove spies
        window.addEventListener.reset()

        # remove from the dom
        $container.remove()


      # Helper to mock postMessage event
      mockPostMessage = (assertCallback) ->
        callback = (message, id) ->
          expect(id).not.toBe "iframe3"
          assertCallback message, id

        if handler.sendMessage.isSpy
          handler.sendMessage.reset()
          handler.sendMessage.andCallFake callback
        else
          spyOn(handler, "sendMessage").andCallFake callback

      it "should broadcast a reply to an HANDSHAKE_REQUEST message with a HANDSHAKE_RESPONSE", ->

        # create a handshakerequest
        message = new SimCapiMessage()
        message.type = SimCapiMessage.TYPES.HANDSHAKE_REQUEST
        message.handshake = requestToken: "token1"

        # remember tokens for each frame so we can check that they are different
        iframe1Token = null
        iframe2Token = null

        # mock out postMessage for all iframe windows
        mockPostMessage (response, id) ->
          expect(response.type).toBe SimCapiMessage.TYPES.HANDSHAKE_RESPONSE
          expect(response.handshake.requestToken).toBe "token1"

          # remember which token is assigned to which frame
          iframe1Token = (if id is "iframe1" then response.handshake.authToken else iframe1Token)
          iframe2Token = (if id is "iframe2" then response.handshake.authToken else iframe1Token)

        handler.capiMessageHandler message

        # verify that all iframe tokens are different
        expect(iframe1Token).toBeTruthy()
        expect(iframe2Token).toBeTruthy()
        expect(iframe1Token isnt iframe2Token).toBe true
        expect(handler.sendMessage.calls.length).toBe 2


      #
      #         * Helper to setup handshake to an iframe
      #
      setupHandshake = (iframeid, token) ->

        # setup a handshake
        handshakeMsg = new SimCapiMessage(
          type: SimCapiMessage.TYPES.HANDSHAKE_REQUEST
          handshake:
            requestToken: token
            authToken: null
        )
        authToken = null

        # mock the postMessage so we can remember the authToken
        mockPostMessage (response, id) ->
          authToken = (if id is iframeid then response.handshake.authToken else authToken)

        handler.capiMessageHandler handshakeMsg
        authToken

      describe "getSnapshot", ->
        authToken = null
        beforeEach ->

          # create handshake
          authToken = setupHandshake("iframe1", "token1")

        it "should return the snapshot remembered from a VALUE_CHANGE event", ->

          # create a VALUE_CHANGE message with three values
          valueChangeMsg = new SimCapiMessage(
            type: SimCapiMessage.TYPES.VALUE_CHANGE
            handshake:
              requestToken: null
              authToken: authToken

            values:
              value1: new SimCapiValue(value: "value1")
              value2: new SimCapiValue(value: "value2")
              value3: new SimCapiValue(value: "value3")
          )

          # send the message to the handler
          handler.capiMessageHandler valueChangeMsg

          # retrieve the snapshot from the handler
          snapshot = handler.getSnapshot(new SnapshotSegment("stage.iframe1"))

          # verify the snapshot contains three values that were sent in the VALUE_CHANGE message
          expect(_.size(snapshot)).toBe 3
          expect(snapshot["iframe1.value1"]).toBe "value1"
          expect(snapshot["iframe1.value2"]).toBe "value2"
          expect(snapshot["iframe1.value3"]).toBe "value3"

        it "should overwrite snapshot with the latest values retrieve from VALUE_CHANGE", ->

          # create a VALUE_CHANGE message with one value
          valueChangeMsg = new SimCapiMessage(
            type: SimCapiMessage.TYPES.VALUE_CHANGE
            handshake:
              requestToken: null
              authToken: authToken

            values:
              value1: new SimCapiValue(value: "value1")
          )

          # send the message to the handler
          handler.capiMessageHandler valueChangeMsg

          # retrieve the snapshot from the handler
          snapshot = handler.getSnapshot(new SnapshotSegment("stage.iframe1"))

          # verify the snapshot contains one value
          expect(_.size(snapshot)).toBe 1
          expect(snapshot["iframe1.value1"]).toBe "value1"

          # create another VALUE_CHANGE message with three values, one of which overrides value1
          valueChangeMsg.values.value1 = new SimCapiValue(value: "changed1")
          valueChangeMsg.values.value2 = new SimCapiValue(value: "value2")
          valueChangeMsg.values.value3 = new SimCapiValue(value: "value3")

          # send the update message
          handler.capiMessageHandler valueChangeMsg

          # retrieve the updated snapshot
          snapshot = handler.getSnapshot(new SnapshotSegment("stage.iframe1"))

          # verify that the update has taken affect
          expect(_.size(snapshot)).toBe 3
          expect(snapshot["iframe1.value1"]).toBe "changed1"
          expect(snapshot["iframe1.value2"]).toBe "value2"
          expect(snapshot["iframe1.value3"]).toBe "value3"


      describe "setSnapshot", ->
        it "should keep things pending until an ON_READY message has been recieved", ->

          # create handshake
          authToken = setupHandshake("iframe1", "token1")
          invoked = 0
          mockPostMessage (response, iframeid) ->

            # verify snapshot that is sent to the iframe
            expect(response.type).toBe SimCapiMessage.TYPES.VALUE_CHANGE
            expect(response.handshake.authToken).toBe authToken
            expect(_.size(response.values)).toBe 1
            expect(response.values["value"].value).toBe "1"
            expect(response.values["value"].type).toBe SimCapiValue.TYPES.STRING
            expect(iframeid).toBe "iframe1"
            invoked++


          # force a pending messages
          segment = new SnapshotSegment("stage.iframe1.value", "1")
          handler.setSnapshot [segment]

          # a quicker way of checking if the mock is invoked.
          expect(invoked).toBe 0

          # create an ON_READY messages
          onReadyMsg = new SimCapiMessage(
            type: SimCapiMessage.TYPES.ON_READY
            handshake:
              requestToken: null
              authToken: authToken
          )
          handler.capiMessageHandler onReadyMsg

          # a quicker way of checking if the mock is invoked.
          expect(invoked).toBe 1

        it "should NOT send snapshot immediately when a handshake has been established", ->

          # create handshake
          setupHandshake "iframe2", "token1"
          invoked = 0
          mockPostMessage (response, iframeid) ->
            invoked++

          segment = new SnapshotSegment("stage.iframe2.value2", "1")
          handler.setSnapshot [segment]

          # a quicker way of checking if the mock is invoked.
          expect(invoked).toBe 0

        it "should send snapshot immediately when ON_READY has been established", ->

          # create handshake
          authToken = setupHandshake("iframe2", "token1")
          invoked = 0
          mockPostMessage (response, iframeid) ->

            # verify snapshot that is sent to the iframe
            expect(response.type).toBe SimCapiMessage.TYPES.VALUE_CHANGE
            expect(response.handshake.authToken).toBe authToken
            expect(_.size(response.values)).toBe 1
            expect(response.values["value2"].value).toBe "1"
            expect(response.values["value2"].type).toBe SimCapiValue.TYPES.STRING
            expect(iframeid).toBe "iframe2"
            invoked++


          # create an ON_READY messages
          onReadyMsg = new SimCapiMessage(
            type: SimCapiMessage.TYPES.ON_READY
            handshake:
              requestToken: null
              authToken: authToken
          )
          handler.capiMessageHandler onReadyMsg

          # a quicker way of checking if the mock is invoked.
          expect(invoked).toBe 0
          segment = new SnapshotSegment("stage.iframe2.value2", "1")
          handler.setSnapshot [segment]

          # a quicker way of checking if the mock is invoked.
          expect(invoked).toBe 1

        it "should handle multiple snapshots in a single call", ->

          # create handshake
          authToken = setupHandshake("iframe2", "token1")
          invoked = 0
          mockPostMessage (response, iframeid) ->

            # verify snapshot that is sent to the iframe
            expect(response.type).toBe SimCapiMessage.TYPES.VALUE_CHANGE
            expect(response.handshake.authToken).toBe authToken
            expect(_.size(response.values)).toBe 3
            expect(iframeid).toBe "iframe2"
            invoked++


          # create an ON_READY messages
          onReadyMsg = new SimCapiMessage(
            type: SimCapiMessage.TYPES.ON_READY
            handshake:
              requestToken: null
              authToken: authToken
          )
          handler.capiMessageHandler onReadyMsg
          handler.setSnapshot [
            new SnapshotSegment("stage.iframe2.value1", "1"),
            new SnapshotSegment("stage.iframe2.value2", "2"),
            new SnapshotSegment("stage.iframe2.value3", "3")]

          # a quicker way of checking if the mock is invoked.
          expect(invoked).toBe 1




