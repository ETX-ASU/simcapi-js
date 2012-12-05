define (require) ->
  describe 'context', ->
    it 'should run without problems', ->
      expect('example').to.be.a 'string'
      expect('example').to.not.equal 'something different'

    it 'should fail', ->
      expect('example').to.equal 'something different'

    it 'uses jquery-chai', ->
      expect($('body')).not.to.have.class 'myClass'
      $('body').addClass('myClass')
      expect($('body')).to.have.class 'myClass'
