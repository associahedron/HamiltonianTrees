import { Associahedron } from './codewords.js'

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

let n = getParameterByName("n");
if (n === null) {
  n = 7;
}

let a = new Associahedron(n, {"diameter":100, "show_map":true, "show_circle":true}, "Canvas2DContainer");