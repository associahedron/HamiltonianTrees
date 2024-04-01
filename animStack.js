import { Associahedron } from './codewords.js'

let a = new Associahedron(6, {"diameter":100, "show_circle":true, "show_map":true}, "Canvas2DContainer");
async function animate() {
  while (!a.finishedAnimation()) {
    await a.moveToNext(1000);
  }
}
animate();