import { dispatch, transition, cluster } from 'd3';

export const tree = () => {
  let width;
  let height;
  let margin; 
  let nodes; // Dictionary of nodes 
  let N;
  let transDuration;
  let treeInterp;
  let interp;
  let points;
  let maxXTransform;
  let nodeSize;
  
  const my = (selection) => {
    const t = transition().duration(transDuration);
    const tree = d3.cluster()
    .nodeSize([20, 25])
    // .size([width, height])
    // .nodeSize([20, 20])
    // .separation((a, b) => {
    //   return (a.parent == b.parent ? 1 : 10)
    // })

    const initializeRadius = (circles) => {
      circles.attr("r", 0);
    };

    // const growRadius = (enter, color) => {
    //   enter.transition(t).attr("r", nodeSize).attr("fill", color);
    // };

    const positionCircles = (circles) => {
      circles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    };

    const rootKey = `${N - 1},0`

    let links = []
    let n = []
    if (nodes && rootKey in nodes) {
      const root = d3.hierarchy(nodes[rootKey], (d) => {
        d.children = []
        if (d.left) {
          d.children.push(nodes[d.left]) 
        }
        if (d.right) {
          d.children.push(nodes[d.right])
        }
        return d.children
      })

      const treeData = tree(root)
      // treeData.y = treeData.y + 20

      n = treeData.descendants()

      for (let i = 0; i < n.length; i++) {
        n[i].x = n[i].x + 30 * N
        n[i].y = n[i].y + 80
      }

  
      n[0].y = n[0].y - (N * 5)
      links = treeData.descendants().slice(1) 
    }

    selection
      .selectAll('line.link')
      .data(links)
      .join(
        (enter) => {
          enter
            .append('line')
            .attr('class', 'link')
            .attr('data-value', (d) => d.data.value )
            .attr('stroke-width', 2)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 0)
            .transition(t)
            .attr('x1', d => d.parent.x)
            .attr('y1', d => d.parent.y)
            .attr('x2', d => d.x)
            .attr('y2', d => d.y)
            .attr("stroke", (d) => treeInterp(1- (d.depth / 11)))
        },
        (update) => {
          update
            .transition(t)
              .attr('x1', d => d.parent.x)
              .attr('y1', d => d.parent.y)
              .attr('x2', d => d.x)
              .attr('y2', d => d.y)
              .attr("stroke", (d) => treeInterp(1- (d.depth / 11)))
        }, 
        (exit) => {
          exit
            .transition(t)
            .attr("stroke-width", "0.0")
            .remove();
        },
      )  
      selection
      .selectAll(".real-tree-node")
      .data(n)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr('data-value', d => { return d.data.value })
            .attr("class", "real-tree-node")
            .attr("opacity", "0.0")
            .attr("fill", (d) => { 

              return d.data.leaf ? interp(7 / 11) : interp(3 / 11)
            })
            .call(initializeRadius)
            .transition(t)
            .call(positionCircles)
            .attr("r", nodeSize)
            .attr("opacity", "1.0"),
        (update) =>
          update.call((update) =>
            update
              .transition(t)
              .call(positionCircles)
              .attr("fill", (d) => d.data.leaf ? "black" : interp(3 / 11))
          ),
        (exit) => exit.transition(t).call(initializeRadius).remove()
      )    
  };

  my.width = function (_) {
    return arguments.length ? ((width = _), my) : width;
  };

  my.height = function (_) {
    return arguments.length ? ((height = _), my) : height;
  };

  my.margin = function (_) {
    return arguments.length ? ((margin = _), my) : margin;
  };

  my.nodes = function (_) {
    return arguments.length ? ((nodes = _), my) : nodes;
  };

  my.N = function (_) {
    return arguments.length ? ((N = _), my) : N;
  };

  my.transDuration = function (_) {
    return arguments.length ? ((transDuration = _), my) : transDuration;
  };
  
  my.interp = function (_) {
    return arguments.length ? ((interp = _), my) : interp;
  };

  my.treeInterp = function (_) {
    return arguments.length ? ((treeInterp = _), my) : treeInterp;
  };

  my.points = function (_) {
    return arguments.length ? ((points = _), my) : points;
  };

  my.reset = function () {
    nodes = {}
    points = []
    N = null
    return my;
  };

  my.update = function(poly) {
    nodes = poly.nodes()
    points = poly.treePath()
    N = poly.N()
    return my
  }

  my.maxXTransform = function (_) {
    return arguments.length ? ((maxXTransform = _), my) : maxXTransform;
  };

  my.nodeSize = function (_) {
    return arguments.length ? ((nodeSize = _), my) : nodeSize;
  };

  return my;
};
