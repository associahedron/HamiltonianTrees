const MAP_HEIGHT = 2;

/**
 * Sum up all of the elements of the array starting
 * at index i
 * @param {list} arr Array
 * @param {int} idx Start index
 */
function arrsum(arr, idx) {
    let res = 0;
    for (let i = idx; i < arr.length; i++) {
        res += arr[i];
    }
    return res;
}

/**
 * Make a comma separated string out of an array
 * 
 * @param {list} arr Array
 * @param {str} sep Separator
 */
function arrstr(arr, sep) {
    let s = "";
    if (sep == undefined) {
        sep = ""
    }
    for (let i = 0; i < arr.length; i++) {
        s += arr[i];
        if (i < arr.length-1) {
            s += sep;
        }
    }
    return s;
}

/**
 * Search for an array in an array of arrays
 * @param {array of arrays} arr Array of arrays
 * @param {array} inarr Array we're searching for
 */
function arrInArr(arr, inarr) {
    let found = false;
    for (let i = 0; i < arr.length; i++) {
        let equals = (arr[i].length == inarr.length);
        if (equals) {
            for (let k = 0; k < arr[i].length; k++) {
                equals = equals && (arr[i][k] == inarr[k]);
            }
            found = found || equals;
        }
    }
    return found;
}

class Codeword {
    constructor(w) {
        this.w = new Int32Array(w);
    }

    /**
     * Extract the internal edges from the codeword
     * @param {int} min_idx Minimum index at which to start
     * throwing down edges
     * @returns 
     */
    get_edges(min_idx) {
        if (min_idx === undefined) {
            min_idx = 0;
        }
        const w = this.w;
        const N = w.length;
        const visible = new Int32Array(N+2);
        for (let k = 0; k < N+2; k++) {
            visible[k] = 1;
        }
        let i = N-1;
        let edges = [];
        while (i >= min_idx) {
            let wi = w[i];
            let j = i+2;
            while (wi > 0) {
                // Find closest visible vertex
                while (j < N+2 && visible[j] == 0) {
                    j += 1;
                }
                edges.push([i, j]);
                for (let k = i+1; k < j; k++) {
                    visible[k] = 0;
                }
                wi -= 1;
                j += 1;
            }
            i -= 1;
        }
        return edges;
    }

    /**
     * @param {svg Element} g SVG element on which to draw this
     * @param {float} d Diameter of circle in which the polygon is inscribed
     * @param {list of [float, float]} c  Center of circle in which the polygon is inscribed
     * @param {object} options 
     *  {
            show_codeword: bool
                If True, show codeword values at vertices (default True)
            min_idx: int
                Minimum index from which to draw edges or numbers
            bold_idxs: set
                Bold the indices in this set (useful for stacks)
            bold_color
                Color to draw bolded items
            color:
                Color to draw polygon (default 'k')
            circled_vertices: list of int
                Indices of vertices to circle
            dotted_edges: list of [int, int]
                Edges to draw dotted (not necessarily in the triangulation)
            dotted_color: 
                Color to draw dotted edges if they exist
            draw_index: bool
                If True, draw indices instead of values
            stroke_width: float
                With of edges
        }
     */
    draw(g, d, c, options) {
        if (options == undefined) {
            options = {};
        }
        if (!("show_codeword" in options)) {
            options["show_codeword"] = true;
        }
        if (!("min_idx" in options)) {
            options["min_idx"] = 0;
        }
        if (!("bold_idxs" in options)) {
            options["bold_idxs"] = [];
        }
        if (!("bold_color" in options)) {
            options["bold_color"] = d3.rgb(255, 128, 12);
        }
        if (!("color" in options)) {
            options["color"] = d3.rgb(0, 0, 0);
        }
        if (!("circled_vertices" in options)) {
            options["circled_vertices"] = [];
        }
        if (!("dotted_edges" in options)) {
            options["dotted_edges"] = [];
        }
        if (!("dotted_color" in options)) {
            options["dotted_color"] = d3.rgb(0, 0, 0);
        }
        if (!("draw_index" in options)) {
            options["draw_index"] = false;
        }
        if (!("stroke_width" in options)) {
            options["stroke_width"] = 2.5;
        }
        const stroke_width = options["stroke_width"];
        
        // Step 1: Draw polygon boundary
        const min_idx = options["min_idx"];
        const r = d/2;
        const w = this.w;
        const N = w.length;
        const dTheta = (2*Math.PI/(N+2));
        let theta = Math.PI/2 + Math.PI/(N+2);
        let Xx = [];
        let Tx = [];
        let Xy = [];
        let Ty = [];
        for (let i = 0; i < N+3; i++) {
            const x = r*Math.cos(theta) + c[0];
            const y = -r*Math.sin(theta) + c[1];
            Xx.push(x);
            Xy.push(y);
            Tx.push(r*1.25*Math.cos(theta) + c[0]);
            Ty.push(-r*1.25*Math.sin(theta) + c[1]);
            if (options["circled_vertices"].includes(i)) {
                g.append("circle")
                .attr("r", 10)
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 1.5)
                .attr("cx", Tx[i]).attr("cy", Ty[i]);
            }
			g.append("circle")
				.attr("r", 5)
				.attr("fill", options["color"])
				.attr("cx", x).attr("cy", y);
            theta += dTheta;
        }
        let rg = N;
        if (options["draw_index"]) {
            rg = N+2;
        }
        if (options["show_codeword"]) {
            for (let i = 0; i < rg; i++) {
                if (i >= min_idx) {
                    let c = options["color"];
                    let font_weight = 100;
                    if (options["bold_idxs"].includes(i)) {
                        c = options["bold_color"];
                        font_weight = 700;
                    }
                    let val = i;
                    if (!options["draw_index"]) {
                        val = w[i];
                    }  
                    g.append("text")
                        .attr("x", Tx[i])
                        .attr("y", Ty[i])
                        .attr("text-anchor", "middle")
                        .attr("dy", 5)
                        .attr("fill", c)
                        .style("font-weight", font_weight)
                        .text(""+val);
                }
            }
        }

        // Step 2: Draw polygon edges
        // Step 2a: Boundary edges
        for (let i = 0; i < N+2; i++) {
            g.append("line")
            .attr("x1", Xx[i])
            .attr("y1", Xy[i])
            .attr("x2", Xx[i+1])
            .attr("y2", Xy[i+1])
            .attr("stroke", options["color"])
            .attr("stroke-width", stroke_width);
        }
        // Step 2b: Internal edges
        const edges = this.get_edges(min_idx);
        for (let k = 0; k < edges.length; k++) {
            let e = edges[k];
            const i = e[0];
            const j = e[1];
            g.append("line")
            .attr("x1", Xx[i])
            .attr("y1", Xy[i])
            .attr("x2", Xx[j])
            .attr("y2", Xy[j])
            .attr("stroke", options["color"])
            .attr("stroke-width", stroke_width);
        }

        // Step 3: Draw any dotted edges
        for (let idx = 0; idx < options["dotted_edges"].length; idx++) {
            const e = options["dotted_edges"][idx];
            const i = e[0];
            const j = e[1];
            g.append("line")
            .attr("x1", Xx[i])
            .attr("y1", Xy[i])
            .attr("x2", Xx[j])
            .attr("y2", Xy[j])
            .attr("stroke", options["dotted_color"])
            .attr("stroke-width", stroke_width)
            .style("stroke-dasharray", "10, 5");
        }

    }
}


class Associahedron {
    /**
     * 
     * @param {int} n 
     * @param {object} opts 
        {
            "diameter": How big each polygon is,
            "g_x_offset": Global x offset
            "g_y_offset": Global y offset
            "show_circle": Whether to show the dotted circle around where we are
            "show_map": Whether to show the reversal map
        }
     * @param {string} domStr ID of the DOM element to fill with this
     */
    constructor(n, opts, domStr) {
        if (opts == undefined) {
            opts = {};
        }
        if (!("diameter" in opts)) {
            opts["diameter"] = 100;
        }
        if (!("g_x_offset" in opts)) {
            opts["g_x_offset"] = opts["diameter"]*n*1.5;
        }
        if (!("g_y_offset" in opts)) {
            opts["g_y_offset"] = 40;
        }
        if (!("show_circle" in opts)) {
            opts["show_circle"] = false;
        }
        if (!("show_map" in opts)) {
            opts["show_map"] = false;
        }
        this.n = n;
        const diam = opts["diameter"];
        this.diam = diam;
        this.g_x_offset = opts["g_x_offset"];
        this.g_y_offset = opts["g_y_offset"];

        // Step 1: Setup container and canvas
		const container = document.getElementById(domStr);
		container.addEventListener("contextmenu", e => e.preventDefault());
		this.width = window.innerWidth * 0.9;
		this.height = window.innerHeight * 0.9;
		this.container = container;

        this.text = document.createElement("h4");
        this.container.appendChild(this.text);

        let canvasDOM = document.createElement("div");
        canvasDOM.id = domStr + "_Canvas";
        container.appendChild(canvasDOM);
		this.canvas = d3.select("#"+domStr+"_Canvas")
		.append("svg")
		.attr("width", this.width)
		.attr("height", this.height)
		.call(d3.drag().on("drag", this.dragNode.bind(this)))
		.attr("style", "border-style: dotted;");
		this.container.obj = this;
		// Clear all graph elements if any exist
		this.canvas.selectAll("*").remove();

		this.g = this.canvas.append("g");
		this.xoffset = 0;
		this.yoffset = 0;

        if (opts["show_circle"]) {
            const cg = this.canvas.append("g");
            cg.append("circle")
            .attr("r", 0.9*diam)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 3)
            .style("stroke-dasharray", "10, 5")
            .attr("cx", opts["g_x_offset"]-1.5*diam*(n-2))
            .attr("cy", opts["g_y_offset"]+diam*0.6);
        }
        this.show_map = false;
        if (opts["show_map"]) {
            this.mg = this.canvas.append("g");
            this.show_map = true;
        }

        this.w = new Int32Array(n);
        this.stack_index = new Int32Array(n);
        this.codewords = [];
        this.last_codeword = null;
        this.codeword_obj = {};
        this.make_stack_rec(this.w, n-1, this.g_x_offset, this.g_y_offset, opts, this.g);
        if (this.show_map) {
            this.initializeMap();
        }
        this.resetAnimation();
    }

    resetAnimation() {
        this.animIndex = 0;
    }

    finishedAnimation() {
        return this.animIndex >= this.codewords.length-1;
    }

    /**
     * 
     * @param {float} moveTime Animation timestep, in milliseconds
     * @returns 
     */
    async moveToNext(moveTime) {
        if (this.finishedAnimation()) {
            return;
        }
        const c1 = this.codewords[this.animIndex];
        const s1 = c1.s;
        this.animIndex += 1;
        const c2 = this.codewords[this.animIndex];
        const s2 = c2.s;

        // First check if we're jumping to a new stack
        let newStack = false;
        let i = s1.length-1;
        while (i >= 0 && !newStack) {
            if (s1[i] != s2[i]) {
                newStack = true;
            }
            else {
                i--;
            }
        }
        let x = 0;
        const y = -c2.y+0.065*this.diam*this.n;
        if (newStack) {
            /*this.text.innerHTML = "Moving to new stack of dimension " + i;
            this.text.innerHTML += " where w["+(i+1)+"] = " + c2.c.w[i+1];
            if (s2[i]%2 == 0) {
                this.text.innerHTML += " and where w["+i+"] goes down in reverse from " + c2.c.w[i];
            }
            else {
                this.text.innerHTML += " and where w["+i+"] goes up from " + c2.c.w[i];
            }*/
            x = -this.diam*i*1.5;
            this.g.transition().duration(moveTime*2)
            .attr("transform", "translate("+x+","+y+")");
            await new Promise(resolve => {setTimeout(() => resolve(), moveTime*2)});
            x = 0;
        }
        //this.text.innerHTML = arrstr(c2.c.w);
        this.xoffset = x;
        this.yoffset = y;
        this.updateMap();
        
        this.g.transition().duration(moveTime)
            .attr("transform", "translate(0,"+y+")");
        await new Promise(resolve => {setTimeout(() => resolve(), moveTime)});
    }

    updateMap() {
        if (this.show_map) {
            let y = this.height/2 + this.yoffset*MAP_HEIGHT/(1.5*this.diam);
            this.mg.attr("transform", "translate(0,"+y+")");
        }
    }

    dragNode() {
		this.xoffset += d3.event.dx;
		this.yoffset += d3.event.dy;
		this.g.attr("transform", "translate("+this.xoffset+" "+this.yoffset+")");
        this.updateMap();
	}

	/**
	 * React to a mouse down event by adding a node
	 */
	mouseDown() {
		let point = d3.mouse(d3.event.currentTarget);
	}

	/**
	 * A function which toggles all of the visible elements to show
	 */
	show = function() {
		this.container.style("display", "block");
	}

	/**
	 * A function which toggles all of the visible elements to hide
	 */
	hide = function() {
		this.container.style("display", "none");
	}

    initializeMap() {
        const that = this;
        const g = this.mg;
        const width = this.diam/this.n;
        const height = MAP_HEIGHT;
        let y = 0;
        for (let i = 0; i < this.codewords.length; i++) {
            const s = this.codewords[i].s;
            for (let j = 1; j < s.length; j++) {
                let x = this.width - this.diam + j*width;
                let r = g.append("rect")
                .attr("i", i)
                .attr("j", j)
                .attr("x", x)
                .attr("y", y)
                .attr("width", width)
                .attr("height", height)
                .attr("stroke", "none")
                if (s[j]%2 == 0) {
                    r = r.attr("fill", "gray")
                }
                else {
                    r = r.attr("fill", "white")
                }
                r.on("mousedown", function() {
                    let xoffset = -(j-1)*1.5*that.diam;
                    let yoffset = -i*that.diam*1.5;
                    that.g.attr("transform", "translate("+xoffset+" "+yoffset+")");
                    that.xoffset = xoffset;
                    that.yoffset = yoffset;
                    that.updateMap();
                });
            }
            y += height;
        }
        g.append("rect")
        .attr("x", this.width-this.diam+width)
        .attr("y", 0)
        .attr("width", this.diam*(this.n-2)/this.n)
        .attr("height", MAP_HEIGHT*this.codewords.length)
        .attr("stroke", "black")
        .attr("fill", "none")
        
        const lg = this.canvas.append("g");
        lg.append("line")
        .attr("x1", this.width-this.diam+width)
        .attr("y1", this.height/2)
        .attr("x2", this.width-this.diam+width+this.diam*(this.n-2)/this.n)
        .attr("y2", this.height/2)
        .attr("stroke", d3.rgb(255, 128, 12))
        .attr("stroke-width", 2)
        .style("stroke-dasharray", "10, 5");

        this.updateMap();
    }

    make_stack_rec(w, d, g_x_offset, y_offset, opts, g) {
        const n = w.length;
        const diam = opts["diameter"];
        let dy = -0.1*diam;
        let h = w.length-d-arrsum(w, d+1)+1;
        let x_offset = g_x_offset - 1.5*diam*(n-d-1);
        g.append("text")
        .attr("x", x_offset)
        .attr("y", y_offset)
        .attr("text-anchor", "middle")
        .text("d = " + d + ", h = " + h, dy=0.7*diam);
        let y1 = y_offset-diam/7;
        let n_items = 0;
        let vals = [];
        if (this.stack_index[d]%2 == 0) {
            vals = (new Int32Array(h)).map((_, idx) => idx);
        }
        else {
            vals = (new Int32Array(h)).map((_, idx) => h-idx-1);            
        }
        this.stack_index[d] += 1;
        const stackorder = new Int32Array(this.stack_index);
        for (let ival = 0; ival < vals.length; ival++) {
            let val = vals[ival];
            let wi = new Int32Array(w);
            wi[d] = val;
            let ni = 0;
            if (d == 1) {
                // Base case
                wi[0] = n-1-arrsum(wi, 1);
                ni = 1;
                let c = new Codeword(wi);
                this.codewords.push({
                    "c":c, 
                    "s":stackorder,
                    "x":x_offset,
                    "y":y_offset
                });
                this.codeword_obj[arrstr(wi, ",")] = this.codewords[this.codewords.length-1];
                
                let dotted_edges = [];
                let circled_vertices = [];
                if (this.codewords.length > 1) {
                    // Indicate quad where flip happened
                    let e1 = c.get_edges();
                    let c2 = this.last_codeword;
                    let e2 = c2.get_edges();
                    for (let k = 0; k < e2.length; k++) {
                        if (!arrInArr(e1, e2[k])) {
                            dotted_edges.push(e2[k]);
                        }
                    }
                    for (let k = 0; k < w.length; k++) {
                        if (c.w[k] != c2.w[k]) {
                            circled_vertices.push(k);
                        }
                    }
                }
                c.draw(g, diam, [x_offset, y_offset+dy], {
                    "bold_idxs":[1],
                    "circled_vertices":circled_vertices,
                    "dotted_edges":dotted_edges
                });
                let t = g.append("text")
                .attr("x", x_offset-diam-n*diam*0.07)
                .attr("y", y_offset+dy)
                .attr("text-anchor", "middle");
                for (let k = 0; k < wi.length; k++) {
                    t = t.append("tspan");
                    if (circled_vertices.includes(k)) {
                        t = t.style("font-weight", "700");
                    }
                    else {
                        t = t.style("font-weight", "100");
                    }
                    t = t.text(""+wi[k]);
                }
                this.last_codeword = c;
            }
            else {
                let c = new Codeword(wi);
                c.draw(g, diam, [x_offset, y_offset+dy], {
                    "min_idx":d,
                    "bold_idxs":[d]
                });
                let s = "";
                for (let k = d; k < wi.length; k++) {
                    s += wi[k];
                }
                g.append("text")
                .attr("x", x_offset)
                .attr("y", y_offset-diam/3.2+dy)
                .attr("text-anchor", "middle")
                .text(s);
                ni = this.make_stack_rec(wi, d-1, g_x_offset, y_offset, opts, g);
            }
            n_items += ni;
            y_offset += diam*1.5*ni
        }
        let y2 = y_offset - diam/7;
        let x1 = x_offset - 1.5*diam/2;
        let x2 = x1 + 1.5*diam;

        let r = g.append("rect")
        .attr("x", x1)
        .attr("y", y1)
        .attr("width", x2-x1)
        .attr("height", y2-y1)
        .attr("stroke", "black")
        if (this.stack_index[d]%2 == 0) {
            r.attr("fill-opacity","0.3")
            .attr("fill", "gray")
        }
        else {
            r.attr("fill", "none");
        }
        return n_items;
    }

}