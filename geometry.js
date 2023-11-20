const createEdge = (p1, p2, start, end) => {
  let x = (p1.x + p2.x) / 2;
  let y = (p2.y + p2.y) / 2;

  let x_diff = p1.x - p2.x;
  let y_diff = p1.y - p2.y;
  let dist = Math.hypot(x_diff, y_diff);
  return { p1, p2, midpoint: { x, y }, dist, start_idx: start, end_idx: end };
};

export const createPolygonPoints = (
  N,
  r,
  leftOffset,
  topOffset
) => {
  let points = [];
  let inc = (2 * Math.PI) / N;
  for (let i = 0; i < N; i++) {
    let theta =
      inc * (i + 1) + (Math.PI * 3) / 2 - inc / 2;

    let r_x = r + leftOffset;
    let r_y = r + topOffset;

    let x = r * Math.cos(theta) + r_x;
    let y = r * Math.sin(theta) + r_y;

    let vec_x = x - r_x;
    let vec_y = y - r_y;
    let mag = Math.sqrt(
      vec_x * vec_x + vec_y * vec_y
    );
    let ux = vec_x / mag;
    let uy = vec_y / mag;

    let point = { x, y, ux, uy };
    console.log(point);
    points.push(point);
  }
  points.reverse();
  return points;
};

export const createPolygonEdges = (points) => {
  let edges = [];
  const N = points.length;
  for (let i = 0; i < N; i++) {
    let curr_point = points[i];

    let next_point_idx = (i + 1) % N
    let next_point = points[next_point_idx];
    let edge = createEdge(curr_point, next_point, i, next_point_idx);
    edges.push(edge);
  }
  return edges;
};

export const getCodewordEdges = (points, codeword) => {
  const N = points.length;
  const getWrapIndex = (idx) => idx % N;
  const fillCrossings = (
    crossings,
    start,
    end
  ) => {
    for (let i = start + 1; i < end; i++) {
      crossings[getWrapIndex(i)] = true;
    }
  };
  const findCodeEdges = (
    crossings,
    point,
    code
  ) => {
    // Offset by 2 vertices since edges cannot be next to each other
    let edgePoint = point + 2;
    let edges = [];
    while (code > 0) {
      let ind = getWrapIndex(edgePoint);
      // If there are no crossing at the index, then it's a valid edge
      if (!crossings[ind]) {
        edges.push(getWrapIndex(ind));
        code--;
        fillCrossings(
          crossings,
          point,
          edgePoint
        );
      }
      edgePoint++;
    }
    return edges;
  };

  let all_edges = [];
  let crossings = new Array(N).fill(false);
  let startIndex = codeword.length - 1;
  for (let i = startIndex; i >= 0; i--) {
    let code = codeword[i];
    if (code != 0) {
      let edges = findCodeEdges(
        crossings,
        i,
        code
      );
      for (let j = 0; j < edges.length; j++) {
        let edge = edges[j]
        let p1 = points[i];
        let p2 = points[edge];
        let e = createEdge(p1, p2, i, edge);
        all_edges.push(e);
      }
    }
  }
  
  return all_edges;
};