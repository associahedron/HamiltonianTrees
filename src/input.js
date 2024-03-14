import { dispatch } from "d3";
export const input = () => {
  let id;
  let placeholder;
  const listeners = dispatch("confirm");

  const my = (selection) => {
    selection
      .selectAll("input")
      .data([null])
      .join("input")
      .attr("placeholder", placeholder)
      .attr("id", id)
      .on("keyup", (e) => {
        if (e.key == "Enter") {
          listeners.call("confirm", null, e.target.value);
        }
      });
  };

  my.id = function (_) {
    return arguments.length ? ((id = _), my) : id;
  };

  my.placeholder = function (_) {
    return arguments.length ? ((placeholder = _), my) : placeholder;
  };

  my.on = function () {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? my : value;
  };

  return my;
};
