define(function (require) {
  return function ChordChartFactory(Private) {
    var d3 = require('d3');
    var _ = require('lodash');
    var $ = require('jquery');
    var errors = require('ui/errors');

    var PointSeriesChart = Private(require('ui/vislib/visualizations/_point_series_chart'));

	/**
     * Chord Chart Visualization
     *
     * @class ChordChart
     * @constructor
     * @extends Chart
     * @param handler {Object} Reference to the Handler Class Constructor
     * @param el {HTMLElement} HTML element to which the chart will be appended
     * @param chartData {Object} Elasticsearch query results for this specific chart
     */
    _.class(ChordChart).inherits(PointSeriesChart);
    function ChordChart(handler, chartEl, chartData) {
      if (!(this instanceof ChordChart)) {
        return new ChordChart(handler, chartEl, chartData);
      }

      ChordChart.Super.apply(this, arguments);

      this.checkIfEnoughData();
      // Chord chart specific attributes
      this._attr = _.defaults(handler._attr || {}, {
        interpolate: 'linear',
        xValue: function (d) { return d.x; },
        yValue: function (d) { return d.y; },
        zValue: function (d) { return d.label; }
      });
    }

	/**
     * Adds chord graph to SVG
     *
     * @method addChordGraph
     * @param svg {HTMLElement} SVG to which rect are appended
     * @param data {Array} Array of object data points
     * @returns {D3.UpdateSelection} SVG with circles added
     */
    ChordChart.prototype.addChordGraph = function (svg, div, data, width, height) {
      var self = this;
      var scale;
      var parsedData = self.parseData(data);
      var labels = parsedData[0];
      var matrix = parsedData[1];
      var color;
      var tooltip;
      var fill = d3.scale.category10();
      var container = svg.append('g');
      var r1 = height / 2;
      var innerRadius = Math.min(width, height) * .41;
      var outerRadius = innerRadius * 1.1;

      var chord = d3.layout.chord()
        .padding(.05)
        .sortSubgroups(d3.descending)
        .matrix(matrix);

      tooltip = div.append('div')
        .attr('class', 'tooltip-relation')
        .style('opacity', 0);

      container.attr('transform', 'translate(' + (width) / 2 + ',' + (height) / 2 + ')');
      container.append('g').selectAll('path')
        .data(chord.groups)
        .enter().append('path')
        .attr('class', 'arc')
        .style('fill', function (d) {
          return labels[d.index].includes('destination') ? '#444444' : fill(d.index);
        })
        .attr('d', d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .on('mouseover', self.fade(.05, true, svg, labels, tooltip))
        .on('mouseout', self.fade(.8, false, svg, labels, tooltip));

      container.append('g')
        .attr('class', 'chord')
        .selectAll('path')
        .data(chord.chords)
        .enter().append('path')
        .attr('d', d3.svg.chord().radius(innerRadius))
        .style('fill', function (d) { return fill(d.source.index); })
        .style('opacity',0.8)
        .on('mouseover', function (d) {
          console.log(d);
          svg.selectAll('.chord path')
            .filter(function (b) { return b.source.index !== d.source.index || b.target.index !== d.target.index; })
            .transition()
            .style('opacity', 0.1);
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html('<div class="source"><strong>Source:&nbsp</strong>' + labels[d.source.index].replace('source','') + '</div>'
          + '<div class="target"><strong>Destination:&nbsp</strong>' + labels[d.target.index].replace('destination','') + '</div>'
          + '<div class="count"><strong>' + d.source.value + '</strong></div>');
          tooltip.style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY) + 'px');
        })
        .on('mouseout', function (d) {
          svg.selectAll('.chord path')
            .transition()
            .style('opacity', 0.8);
          tooltip.transition()
            .duration(200)
            .style('opacity', 0);
        });
    };

    /**
     * Remove not unique values from array
     *
     * @method toUnique
     * @param a,b,c {Array} Array of object data points
     */
    ChordChart.prototype.toUnique = function (a, b, c) {
      b = a.length;
      while (c = --b) while (c--) a[b] !== a[c] || a.splice(c,1);
    };

    /**
     * Fade HTML element on mouse over/out
     *
     * @method fade
     * @param opacity, visible, svg, labels, tooltip
     */
    ChordChart.prototype.fade = function (opacity, visible, svg, labels, tooltip) {
      return function (g, i) {
        svg.selectAll('.chord path')
          .filter(function (b) { return b.source.index !== i && b.target.index !== i; })
          .transition()
          .style('opacity', opacity);
        var text = labels[i];
        var isSource = false;
        if (text.includes('source')) {
          isSource = true;
        };
        if (isSource) {
          text = text.replace('source','');
          text = '<strong>Source:&nbsp</strong>' + text;
        }else {
          text = text.replace('destination','');
          text = '<strong>Destination:&nbsp</strong>' + text;
        }
        if (visible) {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html('<div class="ip">' + text + '</div>');
          tooltip.style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY) + 'px');
        }else {
          tooltip.transition()
            .duration(200)
            .style('opacity', 0);
        }
      };
    };
    /**
     * Parse data into form suitable form force layered graph
     *
     * @method parseData
     * @param data
     * @return array of parsed data
     */
    ChordChart.prototype.parseData = function (data) {
      var self = this;
      var attributes = [];
      var links = [];
      var matrix = [];
      var matrixId = 0;
      var sourceValues = [];
      var destinationValues = [];
      var sourceValuesHelp = [];
      var destinationValuesHelp = [];
      var i = 0;
      var j = 0;

      //parsing data to links and values
      data.forEach(function (arrayOfLinks) {
        arrayOfLinks.forEach(function (link) {
          links.push([link.x,link.label,link.y]);
          sourceValues.push(link.x);
          destinationValues.push(link.label);
        });
      });

      self.toUnique(sourceValues);
      self.toUnique(destinationValues);

      //initializing helping arrays which allow to recognize source and destination data
      sourceValues.forEach(function (sourceValue) {
        sourceValuesHelp.push(sourceValue + ' source');
      });

      destinationValues.forEach(function (destinationValue) {
        destinationValuesHelp.push(destinationValue + ' destination');
      });

      attributes = sourceValuesHelp.concat(destinationValuesHelp);

      // Initialize result matrix
      attributes.forEach(function (attr) {
        matrix.push([]);
        j = 0;
        attributes.forEach(function (attr1) {
          matrix[i][j] = 0;
          j++;
        });
        i++;
      });

      var index1;
      var index2;

      links.forEach(function (link) {
        index1 = attributes.indexOf(link[0] + ' source');
        index2 = attributes.indexOf(link[1] + ' destination');
        matrix[index1][index2] = matrix[index1][index2] + link[2];
        matrix[index2][index1] = matrix[index2][index1] + link[2];
      });

      return [attributes,matrix];
    };

    /**
     * Adds SVG clipPath
     *
     * @method addClipPath
     * @param svg {HTMLElement} SVG to which clipPath is appended
     * @param width {Number} SVG width
     * @param height {Number} SVG height
     * @returns {D3.UpdateSelection} SVG with clipPath added
     */
    ChordChart.prototype.addClipPath = function (svg, width, height) {
      var clipPathBuffer = 5;
      var startX = 0;
      var startY = 0 - clipPathBuffer;
      var id = 'chart-area' + _.uniqueId();

      return svg
      .attr('clip-path', 'url(#' + id + ')')
      .append('clipPath')
      .attr('id', id)
      .append('rect')
      .attr('x', startX)
      .attr('y', startY)
      .attr('width', width)
      // Adding clipPathBuffer to height so it doesn't
      // cutoff the lower part of the chart
      .attr('height', height + clipPathBuffer);
    };

    /**
     * Check, if there is enough data to display
     *
     * @method draw
     * @returns {Function} Creates the relation chart
     */
    ChordChart.prototype.checkIfEnoughData = function () {
      var series = this.chartData.series;
      var message = 'Relation charts require Source and Destination to be set and this properties must be different ';

      var notEnoughData = series.some(function (obj) {
        return !(obj.values[0].hasOwnProperty('series') && obj.values[0].x !== '_all' && obj.values[0].x !== obj.values[0].series);
      });

      if (notEnoughData) {
        throw new errors.NotEnoughData(message);
      }
    };

    /**
     * Renders d3 visualization
     *
     * @method draw
     * @returns {Function} Creates the relation chart
     */
    ChordChart.prototype.draw = function () {
      var self = this;
      var $elem = $(this.chartEl);
      var margin = this._attr.margin;
      var elWidth = this._attr.width = $elem.width();
      var elHeight = this._attr.height = $elem.height();
      var minWidth = 20;
      var minHeight = 20;
      var div;
      var svg;
      var width;
      var height;

      return function (selection) {
        selection.each(function (data) {
          var el = this;

          var layers = data.series.map(function mapSeries(d) {
            var label = d.label;
            return d.values.map(function mapValues(e, i) {
              return {
                _input: e,
                label: label,
                x: self._attr.xValue.call(d.values, e, i),
                y: self._attr.yValue.call(d.values, e, i)
              };
            });
          });

          width = elWidth - margin.left - margin.right;
          height = elHeight - margin.top - margin.bottom;

          if (width < minWidth || height < minHeight) {
            throw new errors.ContainerTooSmall();
          }

          div = d3.select(el);

          svg = div.append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom);

          self.addClipPath(svg, width, height);
          self.addChordGraph(svg, div, layers,width, height);

          return svg;
        });
      };
    };

    return ChordChart;
  };
});