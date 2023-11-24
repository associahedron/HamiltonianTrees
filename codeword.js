/**
 * @param {number} n  N-polygon sides
 * @return {number[][]} All valid codewords for an N-polygon
 */
export function getCodeWords(n) {
  const UP = 0;
  const DOWN = 1;

  let codeword = new Array(n).fill(-1);
  let direction = new Array(n).fill(-1);
  let pushPoint = new Array(n).fill(-1);
  let maxValue = new Array(n).fill(-1);
  let codeWordList = [];

  function initialize() {
    codeword[0] = n - 1;
    for (let j = 1; j < n; j++) {
      codeword[j] = 0;
      pushPoint[j] = 0;
    }
    codeWordList.push([...codeword]);
  }

  function generate_all_trees(position) {
    if (position === 0) {
      return;
    }

    if (position === n - 1) {
      maxValue[position] = 1;
    } else if (position !== 0) {
      maxValue[position] =
        maxValue[position + 1] +
        1 -
        codeword[position + 1];
    }

    if (codeword[position] == 0) {
      direction[position] = UP;
    } else {
      direction[position] = DOWN;
    }

    generate_all_trees(position - 1);

    for (let i = 0; i < maxValue[position]; i++) {
      if (direction[position] == UP) {
        pull(position, pushPoint[position]);
      } else {
        push(position, pushPoint[position]);
      }
      generate_all_trees(position - 1);
    }

    if (position !== n - 1) {
      if (direction[position] == UP) {
        pushPoint[position + 1] = position;
      } else {
        pushPoint[position + 1] =
          pushPoint[position];
      }
    }
  }

  function push(i, j) {
    codeword[i] = codeword[i] - 1;
    codeword[j] = codeword[j] + 1;
    codeWordList.push([...codeword]);
  }

  function pull(i, j) {
    codeword[i] = codeword[i] + 1;
    codeword[j] = codeword[j] - 1;
    codeWordList.push([...codeword]);
  }

  initialize();
  generate_all_trees(n - 1);

  return codeWordList;
}