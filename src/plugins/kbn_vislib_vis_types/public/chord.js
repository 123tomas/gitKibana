define(function (require) {
  return function ChordVisType(Private) {
    var VislibVisType = Private(require('ui/vislib_vis_type/VislibVisType'));
    var Schemas = Private(require('ui/Vis/Schemas'));

    return new VislibVisType({
      name: 'chord',
      title: 'Chord chart',
      icon: 'fa-spinner',
      description: 'Chord chart displays relationship between group of data in circle view.',
      params: {
        defaults: {
          addLegend: true
        },
        editor: require('plugins/kbn_vislib_vis_types/editors/chord.html')
      },
      schemas: new Schemas([
        {
          group: 'metrics',
          name: 'metric',
          title: 'Relation between data',
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
