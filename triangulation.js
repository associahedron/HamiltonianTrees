
function getCodeWords(n) {    
    const UP = 0;
    const DOWN = 1;
    
    let codeword = new Array(n).fill(-1); 
    let direction = new Array(n).fill(-1);  
    let pushPoint = new Array(n).fill(-1); 
    let maxValue = new Array(n).fill(-1);  
    let codeWordList = []


    function initialize() {
       codeword[0] = n - 1
        for (let j = 1; j < n; j++) {
            codeword[j] = 0;
            pushPoint[j] = 0;
        }
        codeWordList.push([...codeword])
    }
    

    function generate_all_trees(position) {

        if (position === 0) {
            return
        }
    
        if (position === n - 1) {
            maxValue[position] = 1
        } else if (position !== 0) {
            maxValue[position] = maxValue[position + 1] + 1 - codeword[position + 1]
        }
    
    
        if (codeword[position] == 0) {
            direction[position] = UP
        } else {
            direction[position] = DOWN
        }
    
        generate_all_trees(position - 1)
    
        for (let i = 0; i < maxValue[position]; i++) {
            if (direction[position] == UP) {
                pull(position, pushPoint[position])
            } else {
                push(position, pushPoint[position])
            }
            generate_all_trees(position - 1)
        }
    
        if (position !== n - 1) {
            if (direction[position] == UP) {
                pushPoint[position + 1] = position
            } else {
                pushPoint[position + 1] = pushPoint[position]
            }
        }
    }

    function push(i, j) {
        codeword[i] = codeword[i] - 1
        codeword[j] = codeword[j] + 1
        codeWordList.push([...codeword])
    }
        //codeword.push(codeword)
    
    function pull(i, j) {
        codeword[i] = codeword[i] + 1
        codeword[j] = codeword[j] - 1
        codeWordList.push([...codeword])
    }
    
    initialize();
    generate_all_trees(n - 1)

    return codeWordList
}

class TriangulationPoint {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

class TriangulationPolygon {
    constructor(N, R) {
        this.r = R
        this.N = N
        this.points = []
        this.codewords = getCodeWords(N - 2)
        this._init()
    }

    _init() {

        // The increment of the N-sided polygon from 2PI / N
        let inc = (2 * Math.PI) / this.N
        for (let i = 0; i < this.N; i++) {
          let theta = inc * (i + 1) - Math.PI / 2 - inc / 2;
          let x = this.r * Math.cos(theta) + this.r;
          let y = this.r * Math.sin(theta) + this.r;
          let point = new TriangulationPoint(x, y)
          this._addPoint(point)
        }
        this._addPoint(this.points[0])
        // // console.log("HELLO")
        // for (let i = 0; i < this.N; i++) {
        //     let x = this.r * Math.cos(2 * Math.PI * (i / this.N)) + this.r
        //     let y = this.r * Math.sin(2 * Math.PI * (i / this.N)) + this.r
        //     let point = new TriangulationPoint(x, y)
        //     this._addPoint(point)
        //     console.log(x, y)
        // }
        // Add the final point to connect it self
        // this._addPoint(this.points[0])
        
    }

    _addPoint(point) {
        this.points.push(point)
    }


    print() {
        console.log(this.points)
        console.log(this.codewords)
    }


    _getWrapIndex(idx) {
        return idx % this.N
    }

    // Assume that end is a bigger index and will be wrapped to get to the beginning points
    _fillCrossing(crossings, beginning, end) {
        for (let i = beginning + 1; i < end; i++) {
            crossings[this._getWrapIndex(i)] = true
        }
    }

     // Returns a list of indexes that the vertices connects to
    _findCodeEdges(crossings, point, code) {
        // Offset by 2 vertices
        let edgePoint = point + 2
        let edges = []
        while(code > 0) {
            let ind = this._getWrapIndex(edgePoint) 
            // If there are no crossing at the index, then it's a probably a valid edge
            if (!crossings[ind]) {
                edges.push(this._getWrapIndex(ind))
                code--
                this._fillCrossing(crossings, point, edgePoint)
            }
            edgePoint++
        }
        return edges
    }


    draw() {
        // let codeWord = [1, 0, 3, 0, 1, 0, 1]
        // console.log(this.codewords)
        let codeWord = this.codewords[20] // Choose the 6th
        console.log("CODEWORD", codeWord)
        let startIndex = this.N - 3;

        // Contains all the vertices that are "crossed" over,
        // meaning if there is an edge drawn between point 1 to point 3, then crossings[2] would be true now
        let crossings = new Array(this.N).fill(false); 


        // let interior_lines = []
        for (let i = startIndex; i >= 0; i--) {
            let code = codeWord[i]
            if (code != 0) {
                console.log(`Point ${i}...`)
                let edges = this._findCodeEdges(crossings, i, code)
                for (let edge of edges) {

                    let line = d3.line()
                        .x((p) => p.x)
                        .y((p) => p.y)
                    let point1 = this.points[i]
                    let point2 = this.points[edge]
                    let p = [point1, point2]


                    d3.select("#polygon")
                        .append("path")
                        .attr("d", line(p))
                        .attr("fill", "none")
                        .attr("stroke", "green")
                    console.log(`Connects to ${edge}...`)
                }
            }
        }
        
        

        let line = d3.line()
            .x((p) => p.x)
            .y((p) => p.y)
        

        // NOTE: This can be better
        for (let i = 0; i < this.points.length - 1; i++) {
            d3.select("#polygon")
            .append("text")
            .attr("x", this.points[i].x)
            .attr("y", this.points[i].y)
            .attr("text-anchor", "middle")
            .text(i);
        }

        // let draw_points = this.points.append
        d3.select("#polygon")
            .append("path")
            .attr("d", line(this.points))
            .attr("fill", "none")
            .attr("stroke", "red")
    }
}