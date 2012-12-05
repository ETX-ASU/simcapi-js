define (require) ->
  SnapshotSegment = require 'api/snapshot/SnapshotSegment'

  describe 'SnapshotSegment', ->

    snapshot = null

    beforeEach ->
      snapshot = new SnapshotSegment 'stage.text1.text.path', 'value'

    it 'should remember the fullpath and value', ->
      expect(snapshot.fullPath).to.equal 'stage.text1.text.path'
      expect(snapshot.value).to.equal 'value'

    it 'should split the fullpath into a list of subpaths', ->
      expect(snapshot.path.length).to.equal 4
      expect(snapshot.path[0]).to.equal 'stage'
      expect(snapshot.path[1]).to.equal 'text1'
      expect(snapshot.path[2]).to.equal 'text'
      expect(snapshot.path[3]).to.equal 'path'
