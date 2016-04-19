define(function (require) {
  return function ColumnHandler(Private) {
    var injectZeros = Private(require('ui/vislib/components/zero_injection/inject_zeros'));
    var Handler = Private(require('ui/vislib/lib/handler/handler'));
    var Data = Private(require('ui/vislib/lib/data'));

    /*
     * Create handlers for Relation chart and
     */
    return function (vis) {
      var data;

      data = new Data(vis.data, vis._attr);

      return new Handler(vis, {
        data: data,
      });

    };
  };
});
