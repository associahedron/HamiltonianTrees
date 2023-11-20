(function (d3$1) {
  'use strict';

  /**
   * @param {number} n  N-polygon sides
   * @return {number[][]} All valid codewords for an N-polygon
   */
  function getCodeWords(n) {
    var UP = 0;
    var DOWN = 1;

    var codeword = new Array(n).fill(-1);
    var direction = new Array(n).fill(-1);
    var pushPoint = new Array(n).fill(-1);
    var maxValue = new Array(n).fill(-1);
    var codeWordList = [];

    function initialize() {
      codeword[0] = n - 1;
      for (var j = 1; j < n; j++) {
        codeword[j] = 0;
        pushPoint[j] = 0;
      }
      codeWordList.push([].concat( codeword ));
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

      for (var i = 0; i < maxValue[position]; i++) {
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
      codeWordList.push([].concat( codeword ));
    }

    function pull(i, j) {
      codeword[i] = codeword[i] + 1;
      codeword[j] = codeword[j] - 1;
      codeWordList.push([].concat( codeword ));
    }

    initialize();
    generate_all_trees(n - 1);

    return codeWordList;
  }

  var createEdge = function (p1, p2, start, end) {
    var x = (p1.x + p2.x) / 2;
    var y = (p2.y + p2.y) / 2;

    var x_diff = p1.x - p2.x;
    var y_diff = p1.y - p2.y;
    var dist = Math.hypot(x_diff, y_diff);
    return { p1: p1, p2: p2, midpoint: { x: x, y: y }, dist: dist, start_idx: start, end_idx: end };
  };

  var createPolygonPoints = function (
    N,
    r,
    leftOffset,
    topOffset
  ) {
    var points = [];
    var inc = (2 * Math.PI) / N;
    for (var i = 0; i < N; i++) {
      var theta =
        inc * (i + 1) + (Math.PI * 3) / 2 - inc / 2;

      var r_x = r + leftOffset;
      var r_y = r + topOffset;

      var x = r * Math.cos(theta) + r_x;
      var y = r * Math.sin(theta) + r_y;

      var vec_x = x - r_x;
      var vec_y = y - r_y;
      var mag = Math.sqrt(
        vec_x * vec_x + vec_y * vec_y
      );
      var ux = vec_x / mag;
      var uy = vec_y / mag;

      var point = { x: x, y: y, ux: ux, uy: uy };
      console.log(point);
      points.push(point);
    }
    points.reverse();
    return points;
  };

  var createPolygonEdges = function (points) {
    var edges = [];
    var N = points.length;
    for (var i = 0; i < N; i++) {
      var curr_point = points[i];

      var next_point_idx = (i + 1) % N;
      var next_point = points[next_point_idx];
      var edge = createEdge(curr_point, next_point, i, next_point_idx);
      edges.push(edge);
    }
    return edges;
  };

  var getCodewordEdges = function (points, codeword) {
    var N = points.length;
    var getWrapIndex = function (idx) { return idx % N; };
    var fillCrossings = function (
      crossings,
      start,
      end
    ) {
      for (var i = start + 1; i < end; i++) {
        crossings[getWrapIndex(i)] = true;
      }
    };
    var findCodeEdges = function (
      crossings,
      point,
      code
    ) {
      // Offset by 2 vertices since edges cannot be next to each other
      var edgePoint = point + 2;
      var edges = [];
      while (code > 0) {
        var ind = getWrapIndex(edgePoint);
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

    var all_edges = [];
    var crossings = new Array(N).fill(false);
    var startIndex = codeword.length - 1;
    for (var i = startIndex; i >= 0; i--) {
      var code = codeword[i];
      if (code != 0) {
        var edges = findCodeEdges(
          crossings,
          i,
          code
        );
        for (var j = 0; j < edges.length; j++) {
          var edge = edges[j];
          var p1 = points[i];
          var p2 = points[edge];
          var e = createEdge(p1, p2, i, edge);
          all_edges.push(e);
        }
      }
    }
    
    return all_edges;
  };

  var polygon = function () {
    var N;
    var codeword;
    var color;
    var pointColor;
    var radius;
    var pointSize;
    var margin;
    var transDuration;
    var strokeWidth;

    var drawDelay;
    var interp;

    var listeners = d3$1.dispatch('end');

    var my = function (selection) {


      var points = createPolygonPoints(N, radius, margin.left, margin.top);
      var polygonEdges = createPolygonEdges(points);
      var interiorEdges = getCodewordEdges(points, codeword);
      var indexPoints = interiorEdges.map(function (e) { return [e.start_idx, e.end_idx]; });
      console.log(indexPoints, "IDX POINTS");
      var t = d3$1.transition().duration(transDuration);
      var pointLine = d3$1.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; });

      var positionLines = function (lines) {
        lines
          .attr('x1', function (d) { return d.p1.x; })
          .attr('y1', function (d) { return d.p1.y; })
          .attr('x2', function (d) { return d.p2.x; })
          .attr('y2', function (d) { return d.p2.y; });
      };

      var initializeRadius = function (circles) {
        circles.attr('r', 0);
      };

      var growRadius = function (enter) {
        enter
          .transition(t)
          .attr('r', pointSize)
          .attr('fill', pointColor);
      };

      var positionCircles = function (circles) {
        circles
          .attr('cx', function (d) { return d.x; })
          .attr('cy', function (d) { return d.y; });
      };

      selection
        .selectAll('text')
        .data(points)
        .join(
          function (enter) {
            enter
              .append('text')
              .attr('font-size', '0px')
              .attr('x', function (d) { return d.x - 3 + d.ux * 15; })
              .attr('y', function (d) { return d.y + 6 + d.uy * 15; })
              .transition(t)
              .attr('font-size', '16px')
              .text(function (_, i) { return i; });
          },

          function (update) { return update.call(function (update) { return update
                .transition(t)
                .attr(
                  'x',
                  function (d) { return d.x - 3 + d.ux * 15; }
                )
                .attr(
                  'y',
                  function (d) { return d.y + 6 + d.uy * 15; }
                ); }
            ); },
          function (exit) { return exit
              .transition(t)
              .attr('font-size', '0px')
              .remove(); }
        )
        .transition(t)
        .attr('opacity', '1')
        .text(function (_, i) { return i; });

      selection
        .selectAll('circle')
        .data(points)
        .join(
          function (enter) { return enter
              .append('circle')
              .call(positionCircles)
              .call(initializeRadius)
              .call(growRadius); },
          function (update) { return update.call(function (update) { return update
                .transition(t)
                .call(positionCircles); }
            ); },
          function (exit) { return exit
              .transition(t)
              .duration(1000)
              .call(initializeRadius)
              .remove(); }
        );

      selection
        .selectAll('line')
        .data(polygonEdges)
        .join(
          function (enter) { return enter
              .append('line')
              .attr('stroke-opacity', '0.0')
              .transition(t)
              .attr('stroke-opacity', '1.0')
              .call(positionLines); },
          function (update) { return update.call(function (update) { return update
                .transition(t)
                .call(positionLines); }
            ); },
          function (exit) { return exit
              .transition(t)
              .attr('stroke-opacity', '0.0')
              .attr('x1', function (_) { return 0; })
              .attr('y1', function (_) { return 0; })
              .attr('x2', function (_) { return 0; })
              .attr('y2', function (_) { return 0; })
              .remove(); }
        )
        .attr('stroke', color)
        .attr('stroke-width', 2);

      selection
        .selectAll('path')
        .data(interiorEdges)
        .join(
          function (enter) {
            enter
              .append('path')
              .attr('class', 'interior')
              .attr('stroke-width', strokeWidth)
              .attr('d', function (d) { return pointLine([d.p1, d.p2]); }
              )
              .attr(
                'stroke',
                function (d) { return interp((d.start_idx / interiorEdges.length)); }
              )
              .attr('opacity', '0')
              .transition()
              .delay(function (d, i) { return i * drawDelay; })
              .attr(
                'stroke-dasharray',
                function (d) { return d.dist + ' ' + d.dist; }
              )
              .attr(
                'stroke-dashoffset',
                function (d) { return d.dist; }
              )
              .transition()
              .attr('stroke-opacity', '1.0')
              .duration(1000)
              .attr('opacity', '1')            
              .on('end', function (event) {
                listeners.call('end', null);
              })
              .attr('stroke-dashoffset', 0);
          },

          function (update) {
            update.call(function (update) {
              update
                .transition(t)
                .attr('d', function (d) { return pointLine([d.p1, d.p2]); }
                )
                .attr(
                  'stroke',
                  function (d) { return interp((d.start_idx / interiorEdges.length)); }
                );
            });
          },

          function (exit) {
            exit
              .transition(t)
              .attr('stroke-opacity', '0.0')
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', 0)
              .attr('y2', 0)
              .remove();
          }
        );
    };

    my.codeword = function (_) {
      return arguments.length
        ? ((codeword = _), my)
        : codeword;
    };

    my.color = function (_) {
      return arguments.length
        ? ((color = _), my)
        : color;
    };

    my.radius = function (_) {
      return arguments.length
        ? ((radius = _), my)
        : radius;
    };

    my.xOffset = function (_) {
      return arguments.length
        ? ((xOffset = _), my)
        : xOffset;
    };

    my.yOffset = function (_) {
      return arguments.length
        ? ((yOffset = _), my)
        : yOffset;
    };

    my.pointSize = function (_) {
      return arguments.length
        ? ((pointSize = _), my)
        : pointSize;
    };

    my.pointColor = function (_) {
      return arguments.length
        ? ((pointColor = _), my)
        : pointColor;
    };

    my.N = function (_) {
      return arguments.length ? (
        (N = _), my) : N;
    };

    my.margin = function (_) {
      return arguments.length
        ? ((margin = _), my)
        : margin;
    };

    my.strokeWidth = function (_) {
      return arguments.length
        ? ((strokeWidth = _), my)
        : strokeWidth;
    };


    my.interp = function (_) {
      return arguments.length
        ? ((interp = _), my)
        : interp;
    };

    my.drawDelay = function (_) {
      return arguments.length
        ? ((drawDelay = _), my)
        : drawDelay;
    };

    my.transDuration = function (_) {
      return arguments.length
        ? ((transDuration = _), my)
        : transDuration;
    };

    my.on = function () {
      var value = listeners.on.apply(
        listeners,
        arguments
      );
      return value === listeners ? my : value;
    };

    return my;
  };

  // Credits to Curran Kelleher!
  // https://vizhub.com/forum/t/episode-11-charts-with-menus/216

  var menu = function () {
    var id;
    var labelText;
    var options;
    var listeners = d3$1.dispatch('change');
    var my = function (selection) {
      selection
        .selectAll('label')
        .data([null])
        .join('label')
        .attr('for', id)
        .text(labelText);

      selection
        .selectAll('select')
        .data([null])
        .join('select')
        .attr('id', id)
        .on('change', function (event) {
          listeners.call('change', null, event.target.value);
        })
        .selectAll('option')
        .data(options)
        .join('option')
        .attr('value', function (d) { return d.value; })
        .text(function (d) { return d.text; });
    };

    my.id = function (_) {
      return arguments.length ? ((id = _), my) : id;
    };

    my.labelText = function (_) {
      return arguments.length
        ? ((labelText = _), my)
        : labelText;
    };

    my.options = function (_) {
      return arguments.length ? ((options = _), my) : options;
    };

    my.on = function () {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? my : value;
    };

    return my;
  };

  var button = function () {
    var id;
    var labelText;
    var listeners = d3$1.dispatch('click');
    
    var my = function (selection) {
      selection
        .selectAll('button')
        .data([null])
        .join('button')
        .attr('id', id)
        .text(labelText)
        .on('click', function () {
          listeners.call('click', null);
        });
    };

    my.id = function (_) {
      return arguments.length ? ((id = _), my) : id;
    };

    my.labelText = function (_) {
      return arguments.length
        ? ((labelText = _), my)
        : labelText;
    };

    my.on = function () {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? my : value;
    };

    return my;
  };

  // https://gist.github.com/mbostock/1125997
  // https://observablehq.com/@mbostock/scrubber
  // https://stackoverflow.com/questions/23048263/pausing-and-resuming-a-transition
  var margin = {
    top: 20,
    right: 30,
    bottom: 7,
    left: 20,
  };

  var N = 4;
  var codewords = getCodeWords(N - 2);

  var mapCodewords = function (cws) { return cws.map(function (code) { return ({
      value: code,
      text: code,
    }); }); };

  var createCodewordOptions = function (cws) {
    var noneOption = [
      {
        value: 'none',
        text: 'None',
      } ];
    var options = noneOption.concat(
      mapCodewords(cws)
    );
    return options;
  };

  var codeword = [];

  var width =
    window.innerWidth - margin.left - margin.right;
  var height =
    window.innerHeight - margin.top - margin.bottom;

  // const title = select('body')
  //   .append('h3')
  //   .text(`Original: ${codeword}`);

  var codewordHeader = d3$1.select('body')
    .append('h3')
    .text(("Codeword: " + codeword));

  var menuContainer = d3$1.select('body')
    .append('div')
    .attr('class', 'menu-container');

  var svg = d3$1.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  var NMenu = menuContainer.append('div');
  var codewordMenu = menuContainer.append('div');
  var restartDrawButton = menuContainer.append(
    'div'
  );

  var startAnimationButton = menuContainer.append(
    'div'
  );
  var radius = 100;
  var pointSize = 4;

  var color = 'black';
  var pointColor = 'black';
  var interp = d3["interpolateViridis"];

  console.log(codewords);

  // const decLast = (codeword) => {
  //   let N = codeword.length - 1;
  //   while (N >= 0) {
  //     if (codeword[N] > 0) {
  //       codeword[N] -= 1;
  //       break;
  //     }
  //     N -= 1;
  //   }
  // };

  var NOptions = d3.range(4, 12).map(function (n) { return ({
    value: n,
    text: n,
  }); });

  var animationInter = null;


  var index = 0;
  function playAnimation(poly) {
    clearInterval(animationInter);
    index = 0;
    animationInter = setInterval(function () {
      if (index >= codewords.length) {
        index = 0;
        clearInterval(animationInter);
      } else {
        var cw = codewords[index];
        svg.call(poly.codeword(cw));
        d3$1.select("#codeword-menu").property("selectedIndex", index + 1);
        codewordHeader.text(("Codeword: " + cw));
        index += 1;
      }
    }, 1000);
  }

  function main() {
    var cw = menu()
      .id('codeword-menu')
      .labelText('Codeword:')
      .options(createCodewordOptions(codewords))
      .on('change', function (cw) {
        var parsedCodeword = [];
        if (cw != 'none') {
          parsedCodeword = cw.split(',');
        } 
        clearInterval(animationInter);
        svg.call(poly.codeword(parsedCodeword));
        codewordHeader.text(("Codeword: " + parsedCodeword));
        
      });
      
    var nChoiceMenu = menu()
      .id('n-menu')
      .labelText('N:')
      .options(NOptions)
      .on('change', function (n) {
        var cws = getCodeWords(n - 2);
        codewords = cws;
        var options = createCodewordOptions(cws);
        d3$1.select("#codeword-menu").property("selectedIndex", -1);
        codewordMenu.call(cw.options(options));
        poly.codeword([]);
        clearInterval(animationInter);
        svg.call(poly.N(n));
        codewordHeader.text(("Codeword: " + ([])));
      });

    var restartButton = button()
      .labelText('Restart')
      .id('restart-button')
      .on('click', function (_) {
        // const before = poly.interiorEdges();
        // const colormap = poly.colorMap();

        clearInterval(animationInter);
        svg.call(poly.codeword([]));

        //   .call(
        //   poly.updateInteriorEdges(before, colormap)
        // );
      });

    var startButton = button()
      .labelText('Start anim')
      .id('start-button')
      .on('click', function (_) {
        playAnimation(poly);
        //   .call(
        //   poly.updateInteriorEdges(before, colormap)
        // );
      });

    var poly = polygon()
      .N(N)
      .codeword(codeword)
      .radius(radius)
      .pointSize(pointSize)
      .pointColor(pointColor)
      .strokeWidth(2)
      .color(color)
      .margin(margin)
      .drawDelay(200)
      .transDuration(1000)
      .interp(interp)
      .on('end', function (_) {
        // decLast(codeword);
        // codewordHeader.text(
        //   `Codeword: ${codeword}`
        // );
        // codewordHeader.call(setText, cw)
    });
    
    startAnimationButton.call(startButton);
    restartDrawButton.call(restartButton);

    codewordMenu.call(cw);
    svg.call(poly);
    NMenu.call(nChoiceMenu);
  }

  main();

})(d3);
//# sourceMappingURL=bundle.js.map
