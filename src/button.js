import { dispatch } from 'd3';
export const button = () => {
  let id;
  let labelText;
  const listeners = dispatch('click');
  
  const my = (selection) => {
    selection
      .selectAll('button')
      .data([null])
      .join('button')
      .attr('id', id)
      .text(labelText)
      .on('click', () => {
        listeners.call('click', null);
      })
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
