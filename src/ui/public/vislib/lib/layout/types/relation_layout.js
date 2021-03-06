define(function (require) {
  return function ColumnLayoutFactory(Private) {
    var d3 = require('d3');
    var chartSplit = Private(require('ui/vislib/lib/layout/splits/relation_chart/chart_split'));

    /**
     * Specifies the visualization layout for chart charts.
     *
     * This is done using an array of objects. The first object has
     * a `parent` DOM element,  a DOM `type` (e.g. div, svg, etc),
     * and a `class` (required). Each child can omit the parent object,
     * but must include a type and class.
     * Objects in children arrays are children of the current object and return
     * DOM elements which are children of their respective parent element.
     */

    return function (el, data) {
      if (!el || !data) {
        throw new Error('Both an el and data need to be specified');
      }

      return [
        {
          parent: el,
          type: 'div',
          class: 'vis-wrapper',
          datum: data,
          children: [
            {
              type: 'div',
              class: 'vis-col-wrapper',
              children: [
                {
                  type: 'div',
                  class: 'chart-wrapper',
                  splits: chartSplit
                },
              ]
            },
          ]
        }
      ];
    };
  };
});