import { select } from "d3";
import { getCodeWords, isValidCodeword } from "./codeword";
import { polygon } from "./polygon";
import { menu } from "./menu";
import { input } from "./input";
import { button } from "./button";
import { tree } from "./tree";
import { Associahedron } from "../codewords"


// https://gist.github.com/mbostock/1125997
// https://observablehq.com/@mbostock/scrubber
// https://stackoverflow.com/questions/23048263/pausing-and-resuming-a-transition
// http://www.ams.org/publicoutreach/feature-column/fcarc-associahedra

const margin = {
  top: 20,
  right: 30,
  bottom: 7,
  left: 20,
};

const treeMargin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

const treeWidth = 600;
const treeHeight = 250;

const N = 2;
let codewords = getCodeWords(N);

const mapCodewords = (cws) =>
  cws.map((code) => ({
    value: code,
    text: code,
  }));

const createCodewordOptions = (cws) => {
  const noneOption = [
    {
      value: "none",
      text: "None",
    },
  ];
  const options = noneOption.concat(mapCodewords(cws));
  return options;
};

let codeword = [];

const width = window.innerWidth - margin.left - margin.right;
const height = window.innerHeight - margin.top - margin.bottom;

const codewordHeader = select("#codeword-text")

const exploreLink = select("#stack-explore-link").text("Click to explore stack for n=2").attr("href", "scrollStack.html?n=2");


const menuContainer = select(".menu-container")

const polySvg = select("#polygon")
  .attr("width", 250)
  .attr("height", height - 500);

const treeSvg = select("#tree")
  .attr("width", 300)
  .attr("height", height - 500);

  

const NInputLabel = menuContainer.append("label").text("Type N and press Enter: ");
const NInput = menuContainer.append("div");
const codewordMenu = menuContainer.append("div");

const codewordLabel = menuContainer.append("label").text("Type codeword and press Enter: ");
const inputButton = menuContainer.append("div");

menuContainer.append("br")
const startAnimationButton = menuContainer.append("div").attr("id", "anim-buttons").append("span");

const restartDrawButton = menuContainer.select("#anim-buttons").append("span");

// menuContainer.append("hr").attr("color", "#DCDCDC")
const radius = 100;
const pointSize = 4;

const color = "black";
const pointColor = "black";
const interp = d3["interpolateViridis"];
const treeInterp = d3["interpolatePlasma"];

let animationInter = null;
let warned = false;
let endAnimation = false;
let isAnimating = false;

function playAnimation(poly, t) {
  if (!isAnimating) {
    isAnimating = true
    animate(poly, t)  
  }
}


async function animate(poly, t) {

  function update() {
    let index = associahedron.animIndex
    let cw = codewords[index];
    polySvg.call(poly.codeword(cw));
    treeSvg.call(t.update(poly));
    select("#codeword-menu").property("selectedIndex", index + 1);
    codewordHeader.text(`Codeword: ${cw}`);
  }
  let started = poly.treePath().length == 0
  

  await new Promise(resolve => {
    setTimeout(() => resolve(), 1000);
  });

  while (!associahedron.finishedAnimation() && !endAnimation) {
    if (endAnimation) {
      break
    }
    update()
    let timeout = 0
    if (started) {
      started = false
      timeout = 250 * poly.N() + 1000
    }
    await new Promise(resolve => {
      setTimeout(() => resolve(), Math.max(timeout, 1000));
    });

    if (endAnimation) {
      break
    }

    await associahedron.moveToNext(1000);  
  }

  if (!endAnimation) {
    update()
  }
  isAnimating = false
}


const toggle = (disable) => {
  select("#codeword-menu").property("disabled", disable);
  select("#n-menu").property("disabled", disable);
  select("#n-input").property("disabled", disable);
  select("#start-button").property("disabled", disable);
};

let associahedron = new Associahedron(2, {"diameter": 100, "show_circle": true, "show_map": true}, "polygon-container");
 
function main() {
  const cw = menu()
    .id("codeword-menu")
    .labelText("Codeword:")
    .options(createCodewordOptions(codewords))
    .on("focus", () => {
      const n = poly.N() - 2
      if (!codewords.length || codewords[0].length != n) {
        const cws = getCodeWords(n);
        codewords = cws;
        const options = createCodewordOptions(cws);
        select("#codeword-menu").property("selectedIndex", -1);
        codewordMenu.call(cw.options(options));
      }
    })
    .on("change", (cw) => {
      let parsedCodeword = [];
      if (cw != "none") {
        parsedCodeword = cw.split(",");
      } else {
        poly.reset();
      }
      clearInterval(animationInter);
      polySvg.call(poly.codeword(parsedCodeword));
      codewordHeader.text(`Codeword: ${parsedCodeword}`);
      codewordLabel.text("Type codeword and press Enter:  ").style("color", "black");

      endAnimation = true
      if (cw != "none") {
        associahedron.animateToCodeword(cw, 1000)
        treeSvg.call(t.update(poly));
      } else {
        treeSvg.call(t.reset());
      }
    });

  // const nChoiceMenu = menu()
  //   .id("n-menu")
  //   .labelText("N:")
  //   .options(NOptions)
  //   .on("focus", () => {
  //     const n = poly.N() - 2
  //     const cws = getCodeWords(n);
  //     codewords = cws;
  //     const options = createCodewordOptions(cws);
  //     select("#codeword-menu").property("selectedIndex", -1);
  //     codewordMenu.call(cw.options(options));
  //   })
  //   .on("change", (n) => {
  //     const cws = getCodeWords(n);
  //     codewords = cws;
  //     const options = createCodewordOptions(cws);
  //     select("#codeword-menu").property("selectedIndex", -1);
  //     codewordMenu.call(cw.options(options));
  //     clearInterval(animationInter);
  //     polySvg.call(poly.N(+n + 2));
  //     codewordHeader.text(`Codeword: ${[]}`);
  //     treeSvg.call(t.update(poly));
  //     codewordLabel.text("Enter codeword: ").style("color", "black");
  //   });

  const restartButton = button()
    .labelText("Restart")
    .id("restart-button")
    .on("click", (_) => {
      endAnimation = true
      associahedron.resetAnimation()
      associahedron.animateToCodeword(associahedron.codewords[0].c.w.join(","), 1000)
      polySvg.call(poly.reset());
      treeSvg.call(t.reset());
    });

  const startButton = button()
    .labelText("View Hamiltonian Path")
    .id("start-button")
    .on("click", (_) => {
      const n = poly.N() - 2
      associahedron.resetAnimation()
      associahedron.animateToCodeword(associahedron.codewords[0].c.w.join(","), 1000)
      if (!codewords.length || codewords[0].length != n) {
        const cws = getCodeWords(n);
        codewords = cws;
        const options = createCodewordOptions(cws);
        select("#codeword-menu").property("selectedIndex", -1);
        codewordMenu.call(cw.options(options));
      }
      endAnimation = false
      playAnimation(poly, t);
    });

  


  const onNConfirm = (value) => {
    const validationRegex = /^[1-9][0-9]*$/;
    if (validationRegex.test(value)) {
      const n  = parseInt(value)

      if (+n + 2 == poly.N()) {
        return
      } 
      
      if (n >= 2) {
        endAnimation = true
        // const cws = getCodeWords(n);
        // codewords = cws;
        // const options = createCodewordOptions(cws);
        select("#codeword-menu").property("selectedIndex", -1);
        // codewordMenu.call(cw.options(options));
        clearInterval(animationInter);
        poly.reset()
        polySvg.call(poly.N(+n + 2));
        codewordHeader.text(`Codeword: ${[]}`);
        treeSvg.call(t.update(poly));
        NInputLabel.text("Type N and press Enter: ").style("color", "black");
        exploreLink.text("Click to explore stack for n=" + n).attr("href", "scrollStack.html?n=" + n);
        
        d3.selectAll("#polygon-container_Canvas") 
          .remove(); 
        associahedron = new Associahedron(+n, {"diameter": 80, "show_circle": true, "show_map": true}, "polygon-container");


        if (n > 9 && !warned) {
          warned = true
          alert("Note: When viewing the codewords or visualizing the Hamiltonian path for n > 9, your browser may slow down, especially for larger values of n")
        }
        
      } else {
        NInputLabel.text("N must be greater than 1.").style("color", "red");
      }
    } else {
      NInputLabel.text("Invalid N.").style("color", "red");
    }

  }

  const nInput = input()
    .id("n-input")
    // .placeholder("2, 7, etc")
    .on("focusout", (value) => {
      onNConfirm(value)
    })
    .on("confirm", (value) => {
      onNConfirm(value)
      
    });



  const onCodewordConfirm = (value) => {
    value = value.replaceAll(" ", "");
    const validationRegex = /^(\d+,)*\d+$/;
    if (validationRegex.test(value)) {
      const codeword = value.split(",");
      const n = poly.N();
      if (codeword.length == n - 2 && isValidCodeword(codeword, n - 2)) {
        endAnimation = true
        clearInterval(animationInter);
        polySvg.call(poly.codeword(codeword));
        codewordHeader.text(`Codeword: ${codeword}`);
        treeSvg.call(t.update(poly));
        codewordLabel.text("Type codeword and press Enter: ").style("color", "black");
        associahedron.animateToCodeword(value, 1000)
      } else {
        codewordLabel.text("Invalid codeword.").style("color", "red");
      }
    } else {
      codewordLabel.text("Invalid input.").style("color", "red");
    }
  }

  const codewordInput = input()
    .id("codeword-input")
    .on("focusout", (value) => {
      onCodewordConfirm(value)
    })
    .on("confirm", (value) => {
      onCodewordConfirm(value)
    });

  const poly = polygon()
    .N(N + 2)
    .codeword(codeword)
    .radius(radius)
    .pointSize(pointSize)
    .pointColor(pointColor)
    .strokeWidth(2)
    .color(color)
    .margin(margin)
    .drawDelay(100)
    .transDuration(1000)
    .interp(interp)
    .treeInterp(treeInterp)
    .dash("3, 2")
    .fontSize("16px")
    .on("animstart", (_) => toggle(true))
    .on("animend", (_) => toggle(false));

  startAnimationButton.call(startButton);
  restartDrawButton.call(restartButton);
  inputButton.call(codewordInput);
  codewordMenu.call(cw);
  NInput.call(nInput);
  polySvg.call(poly);
  // NMenu.call(nChoiceMenu);

  const t = tree()
    .width(treeWidth)
    .height(treeHeight)
    .nodes({})
    .margin(treeMargin)
    .transDuration(1000)
    .interp(interp)
    .treeInterp(treeInterp)
    .maxXTransform(50)
    .nodeSize(4);
  treeSvg.call(t);
}

main();
