import { select } from "d3";
import { getCodeWords } from "./codeword";
import { polygon } from "./polygon";
import { menu } from "./menu";
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

const treeWidth = 600
const treeHeight = 250

const N = 4;
let codewords = getCodeWords(N - 2);

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
  .attr("height", height - 400)

const treeSvg = select("body")
  .append("svg")
  .attr("id", "tree")
  .attr("width", 300)
  .attr("height", height - 400)

const NMenu = menuContainer.append("div");
const codewordMenu = menuContainer.append("div");
const startAnimationButton = menuContainer.append("div");
const restartDrawButton = menuContainer.append("div");

const treeContainer = select("body")
  .append("div")
  .attr('class', "tree")

const radius = 100;
const pointSize = 4;

const color = "black";
const pointColor = "black";
const interp = d3["interpolateViridis"];
const treeInterp = d3["interpolatePlasma"];

// interpolateYlOrRd

const NOptions = d3.range(4, 12).map((n) => ({
  value: n,
  text: n,
}));

let animationInter = null;

let index = 0;
function playAnimation(poly, t) {
  clearInterval(animationInter);
  index = 0;
  animationInter = setInterval(() => {
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
    }
  }, 1000);
}

const toggle = (disable) => {
  select("#codeword-menu").property("disabled", disable);
  select("#n-menu").property("disabled", disable);
  select("#start-button").property("disabled", disable);
}


function main() {
  const cw = menu()
    .id("codeword-menu")
    .labelText("Codeword:")
    .options(createCodewordOptions(codewords))
    .on("change", (cw) => {
      let parsedCodeword = [];
      let newNodes = {}
      if (cw != "none") {
        parsedCodeword = cw.split(",");
      } else {
        poly.reset();
      }
      clearInterval(animationInter);
      polySvg.call(poly.codeword(parsedCodeword));
      codewordHeader.text(`Codeword: ${parsedCodeword}`);

      if (cw != "none") {
        treeSvg.call(t.update(poly));
      } else {
        treeSvg.call(t.reset())
      }
    });

  const nChoiceMenu = menu()
    .id("n-menu")
    .labelText("N:")
    .options(NOptions)
    .on("change", (n) => {
      const cws = getCodeWords(n - 2);
      codewords = cws;
      const options = createCodewordOptions(cws);
      select("#codeword-menu").property("selectedIndex", -1);
      codewordMenu.call(cw.options(options));
      clearInterval(animationInter);
      polySvg.call(poly.N(n));
      codewordHeader.text(`Codeword: ${[]}`);
      treeSvg.call(t.update(poly));
    });

  const restartButton = button()
    .labelText("Restart")
    .id("restart-button")
    .on("click", (_) => {
      clearInterval(animationInter);
      polySvg.call(poly.reset());
      treeSvg.call(t.reset())
    });

  const startButton = button()
    .labelText("Start anim")
    .id("start-button")
    .on("click", (_) => {
      playAnimation(poly, t);
    });

  const poly = polygon()
    .N(N)
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
  codewordMenu.call(cw);
  polySvg.call(poly);
  NMenu.call(nChoiceMenu);

  const t = tree()
    .width(treeWidth)
    .height(treeHeight)
    .nodes({})
    .margin(treeMargin)
    .transDuration(1000)
    .interp(interp)
    .treeInterp(treeInterp)
    .maxXTransform(50)
    .nodeSize(4)
  treeSvg.call(t);
}

main();
