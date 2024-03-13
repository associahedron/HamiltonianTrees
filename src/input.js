import { dispatch } from "d3";
export const input = () => {
  let id;
  const listeners = dispatch("confirm");

  const my = (selection) => {
    selection
      .selectAll("input")
      .data([null])
      .join("input")
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

  my.on = function () {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? my : value;
  };

  return my;
};
