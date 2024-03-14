import { select } from "d3";
import { getCodeWords, isValidCodeword } from "./codeword";
import { polygon } from "./polygon";
import { menu } from "./menu";
import { input } from "./input";
import { button } from "./button";
import { tree } from "./tree";

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

select("body").append("h1").text(`Rotational Hamiltonian Trees`);

const codewordHeader = select("body")
  .append("h3")
  .text(`Codeword: ${codeword}`);

const menuContainer = select("body")
  .append("div")
  .attr("class", "menu-container");

const polySvg = select("body")
  .append("svg")
  .attr("id", "polygon")
  .attr("width", 250)
  .attr("height", height - 300);

polySvg.append('g').attr('id', 'poly-links')
polySvg.append('g').attr('id', 'poly-interior-links')
polySvg.append('g').attr('id', 'poly-nodes')

const treeSvg = select("body")
  .append("svg")
  .attr("id", "tree")
  .attr("width", 800)
  .attr("height", height - 300);

const NMenu = menuContainer.append("div");

const NInputLabel = select("div").append("label").text("Enter N: ");
const NInput = menuContainer.append("div");


const codewordMenu = menuContainer.append("div");
const startAnimationButton = menuContainer.append("div");
const restartDrawButton = menuContainer.append("div");
const codewordLabel = select("div").append("label").text("Enter codeword: ");
const inputButton = menuContainer.append("div");

const radius = 100;
const pointSize = 4;

const color = "black";
const pointColor = "black";
const interp = d3["interpolateViridis"];
const treeInterp = d3["interpolatePlasma"];

// const NOptions = d3.range(2, 10).map((n) => ({
//   value: n,
//   text: n,
// }));

let animationInter = null;
let warned = false;

let index = 0;
function playAnimation(poly, t) {
  let started = poly.treePath().length == 0
  function callback() {
    if (index >= codewords.length) {
      index = 0;
      clearInterval(animationInter);
    } else {
      let cw = codewords[index];
      polySvg.call(poly.codeword(cw));
      treeSvg.call(t.update(poly));
      select("#codeword-menu").property("selectedIndex", index + 1);
      codewordHeader.text(`Codeword: ${cw}`);
      index += 1;

      clearInterval(animationInter)
      let timeout = 0
      if (started) {
        started = false
        timeout = 250 * poly.N()
      }

      setTimeout(() => {
        animationInter = setInterval(callback, 1000);
      }, timeout)


    }
  }

  clearInterval(animationInter);
  index = 0;
  animationInter = setInterval(callback, 1000);
}

const toggle = (disable) => {
  select("#codeword-menu").property("disabled", disable);
  select("#n-menu").property("disabled", disable);
  select("#n-input").property("disabled", disable);
  select("#start-button").property("disabled", disable);
};

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
      codewordLabel.text("Enter codeword: ").style("color", "black");

      if (cw != "none") {
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
      clearInterval(animationInter);
      polySvg.call(poly.reset());
      treeSvg.call(t.reset());
    });

  const startButton = button()
    .labelText("View Hamiltonian Path")
    .id("start-button")
    .on("click", (_) => {
      const n = poly.N() - 2
      if (!codewords.length || codewords[0].length != n) {
        const cws = getCodeWords(n);
        codewords = cws;
        const options = createCodewordOptions(cws);
        select("#codeword-menu").property("selectedIndex", -1);
        codewordMenu.call(cw.options(options));
      }
      playAnimation(poly, t);
    });

  const nInput = input()
    .id("n-input")
    // .placeholder("2, 7, etc")
    .on("confirm", (value) => {
      const validationRegex = /^[1-9][0-9]*$/;
      if (validationRegex.test(value)) {
        const n  = parseInt(value)
        if (n >= 2) {
        // const cws = getCodeWords(n);
        // codewords = cws;
        // const options = createCodewordOptions(cws);
        select("#codeword-menu").property("selectedIndex", -1);
        // codewordMenu.call(cw.options(options));
        clearInterval(animationInter);
        polySvg.call(poly.N(+n + 2));
        codewordHeader.text(`Codeword: ${[]}`);
        treeSvg.call(t.update(poly));
        NInputLabel.text("Enter N:").style("color", "black");
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
  });


  const codewordInput = input()
    .id("codeword-input")
    .on("confirm", (value) => {
      value = value.replaceAll(" ", "");
      const validationRegex = /^(\d+,)*\d+$/;
      if (validationRegex.test(value)) {
        const codeword = value.split(",");
        const n = poly.N();
        if (codeword.length == n - 2 && isValidCodeword(codeword, n - 2)) {
          clearInterval(animationInter);
          polySvg.call(poly.codeword(codeword));
          codewordHeader.text(`Codeword: ${codeword}`);
          treeSvg.call(t.update(poly));
          codewordLabel.text("Enter codeword: ").style("color", "black");
        } else {
          codewordLabel.text("Invalid codeword.").style("color", "red");
        }
      } else {
        codewordLabel.text("Invalid input.").style("color", "red");
      }
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
