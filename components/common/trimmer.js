define([], function() {
  var ltrim = function(s) {
    var l = 0, spacesAtBeginning = true;
    while (spacesAtBeginning) {
      var c = s.charAt(l);
      if (l < s.length && (c === ' ' || c === '\n' || c === '\t')) {
        l++;
      }
      else {
        spacesAtBeginning = false;
      }
    }
    return s.substring(l, s.length);
  };

  var rtrim = function(s) {
    var r = s.length -1, spacesAtEnd = true;
    while (spacesAtEnd) {
      var c = s.charAt(r);
      if (r > 0 && (c === ' ' || c === '\n' || c === '\t')) {
        r--;
      } 
      else {
        spacesAtEnd = false;
      }
    }
    return s.substring(0, r+1);
  };

  return function(s) {
    return rtrim(ltrim(s));
  };
});