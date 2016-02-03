define(function (require) {
  return function RelationVisType(Private) {
    var VislibVisType = Private(require('ui/vislib_vis_type/VislibVisType'));
    var Schemas = Private(require('ui/Vis/Schemas'));

    return new VislibVisType({
      name: 'relation',
      title: 'Relation chart',
      icon: 'fa-compress',
      description: 'Relation chart allows you to draw easy relations between nodes.',
      params: {
        defaults: {
          shareYAxis: true,
          addTooltip: true,
          addLegend: true,
          showCircles: true,
          smoothLines: false,
          interpolate: 'linear',
          scale: 'linear',
          drawLinesBetweenPoints: true,
          radiusRatio: 9,
          times: [],
          addTimeMarker: false,
          defaultYExtents: false,
          setYExtents: false,
          yAxis: {}
        },
        scales: ['linear', 'log', 'square root'],
        editor: require('plugins/kbn_vislib_vis_types/editors/line.html')
      },
      schemas: new Schemas([
        {
          group: 'metrics',
          name: 'metric',
          title: 'Line between dots',
          min: 1,
          max: 1,
          aggFilter: ['count','sum','min','max'],
          defaults: [
            { schema: 'metric', type: 'count' }
          ]
        },
        {
          group: 'buckets',
          name: 'segment',
          title: 'Source',
          min: 1,
          max: 1,
          aggFilter: ['terms']
        },
        {
          group: 'buckets',
          name: 'group',
          title: 'Destination',
          min: 1,
          max: 1,
          aggFilter: ['terms']
        },
      ])
    });
  };
});
