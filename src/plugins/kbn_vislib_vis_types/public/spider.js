define(function (require) {
  return function RelationVisType(Private) {
    var VislibVisType = Private(require('ui/vislib_vis_type/VislibVisType'));
    var Schemas = Private(require('ui/Vis/Schemas'));

    return new VislibVisType({
      name: 'spider',
      title: 'Spider chart',
      icon: 'fa-support',
      description: 'Spider chart visualize more than three attributes at same time',
      schemas: new Schemas([
        {
          group: 'metrics',
          name: 'metric',
          title: 'Axis',
          min: 1,
          max: 12,
          aggFilter: ['max','min','avg','count','median','cardinality'],
          defaults: [
            { schema: 'metric', type: 'count' }
          ]
        },
        {
          group: 'buckets',
          name: 'segment',
          title: 'Segments',
          min: 0,
          max: 1,
          aggFilter: ['terms'],
        },
      ])
    });
  };
});
