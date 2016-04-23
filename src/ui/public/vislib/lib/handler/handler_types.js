define(function (require) {
  return function HandlerTypeFactory(Private) {
    var pointSeries = Private(require('ui/vislib/lib/handler/types/point_series'));
    var relationSeries = Private(require('ui/vislib/lib/handler/types/relation'));

    /**
     * Handles the building of each visualization
     *
     * @return {Function} Returns an Object of Handler types
     */
    return {
      histogram: pointSeries.column,
      line: pointSeries.line,
      chord: Private(require('ui/vislib/lib/handler/types/relation')),
      pie: Private(require('ui/vislib/lib/handler/types/pie')),
      area: pointSeries.area,
      tile_map: Private(require('ui/vislib/lib/handler/types/tile_map')),
      relation: Private(require('ui/vislib/lib/handler/types/relation')),
	  spider: Private(require('ui/vislib/lib/handler/types/relation'))
    };
  };
});
