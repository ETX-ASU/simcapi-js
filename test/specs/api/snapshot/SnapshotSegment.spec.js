define(function(require){
   
    var SnapshotSegment = require('api/snapshot/SnapshotSegment');
    
    describe('SnapshotSegment', function(){
        
        var snapshot = null;
        
        beforeEach(function(){
            snapshot = new SnapshotSegment('stage.text1.text.path', 'value');
        });
        
        it('should remember the fullpath and value', function(){
            expect(snapshot.fullPath).toBe('stage.text1.text.path');
            expect(snapshot.value).toBe('value');
        });
        
        it('should split the fullpath into a list of subpaths', function(){
            expect(snapshot.path.length).toBe(4);
            expect(snapshot.path[0]).toBe('stage');
            expect(snapshot.path[1]).toBe('text1');
            expect(snapshot.path[2]).toBe('text');
            expect(snapshot.path[3]).toBe('path');
        });
        
    });
    
});