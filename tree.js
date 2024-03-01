import { dispatch, transition } from 'd3';
export const tree = () => {
  let width;
  let height;
  let margin; 
  let nodes; // Dictionary of nodes 
  let transDuration;
  let treeInterp;
  let interp;
  let points;
  let maxXTransform;
  let nodeSize;
  
  const my = (selection) => {
    const t = transition().duration(transDuration);
    const tree = d3.tree().size([width, height]).separation((a, b) => {
      return (a.parent == b.parent ? 1 : 2) / a.depth;
    })

    // let color = 
    const initializeRadius = (circles) => {
      circles.attr("r", 0);
    };

    const growRadius = (enter, color) => {
      enter.transition(t).attr("r", nodeSize).attr("fill", color);
    };

    const positionCircles = (circles) => {
      circles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    };

    const rootKey = `${Object.keys(nodes).length + 1},0`

    let links = []
    let n = []
    let treeHeight = 1
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
      root.x0 = width / 2
      root.y0 = 0
      const treeData = tree(root)
      n = treeData.descendants()
      links = treeData.descendants().slice(1) 
      treeHeight = treeData.height

      let s = {}
      links[0].parent.x -= 150
      links[0].parent.y += 20

      for (let i = 0; i < links.length; i++) {
        let currLink = links[i]
        s[currLink.value] = currLink.x
        
        if (currLink.parent.value in s) {
          currLink.parent.value = s[currLink.parent.value]
        }

        if (currLink.parent.data.left == currLink.data.value) {
          currLink.x = currLink.parent.x - maxXTransform * (1 / currLink.depth)
        } else {
          currLink.x = currLink.parent.x + maxXTransform * (1 / currLink.depth)
        }

        s[currLink.value] = currLink.x
      }
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
            .attr("stroke", (d) => treeInterp(1-(d.depth / 11)))
        },
        (update) => {
          update
            .transition(t)
              .attr('x1', d => d.parent.x)
              .attr('y1', d => d.parent.y)
              .attr('x2', d => d.x)
              .attr('y2', d => d.y)
              .attr("stroke", (d) => treeInterp(1-(d.depth / 11)))
        }, 
        (exit) => {
          exit
            .transition(t)
            .attr("stroke-width", "0.0")
            // .call(exitLines)
            .remove();
            // .attr('stroke-width', 0)
            // .remove()
        },
      )  
      selection
      .selectAll(".real-tree-node")
      .data(n)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr('data-value', d => d.data.value)
            .attr("class", "real-tree-node")
            .attr("opacity", "0.0")
            .attr("fill", (d, i) => interp(i == 0 ? 0 : +d.data.value.split(",")[0] / (n.length - 1)))
            // .delay((_, i) => i * drawDelay)
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
              .attr("fill", (d, i) => interp(i == 0 ? 0 : +d.data.value.split(",")[0] / (n.length - 1)))
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
    return my;
  };

  my.update = function(poly) {
    nodes = poly.nodes()
    points = poly.treePath()
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
