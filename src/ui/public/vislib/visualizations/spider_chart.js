define(function (require) {
  return function SpiderChartFactory(Private) {
    var d3 = require('d3');
    var _ = require('lodash');
    var $ = require('jquery');
    var errors = require('ui/errors');
    var color = d3.scale.category10();

    var Chart = Private(require('ui/vislib/visualizations/_chart'));

    /**
     * Spider Chart Visualization
     *
     * @class SpiderChart
     * @constructor
     * @extends Chart
     * @param handler {Object} Reference to the Handler Class Constructor
     * @param el {HTMLElement} HTML element to which the chart will be appended
     * @param chartData {Object} Elasticsearch query results for this specific chart
     */
    _.class(SpiderChart).inherits(Chart);
    function SpiderChart(handler, chartEl, chartData) {
      if (!(this instanceof SpiderChart)) {
        return new SpiderChart(handler, chartEl, chartData);
      }

      SpiderChart.Super.apply(this, arguments);

      this.checkIfEnoughData();
      // spider chart specific attributes
      this._attr = _.defaults(handler._attr || {}, {
        interpolate: 'linear',
        xValue: function (d) { return d.x; },
        yValue: function (d) { return d.y; }
      });
    }

    /**
     * Adds spider graph to SVG
     *
     * @method addSpiderGraph
     * @param svg {HTMLElement} SVG to which rect are appended
     * @param div {HTMLElement} DIV to which tooltip is appended
     * @param data {Array} Array of object data points
     * @param names {Array} Array of length 3 with names of data
     * @param width, height {number} width and height of new svg element
     * @returns {D3.UpdateSelection} SVG with force layered graph added
    */
    SpiderChart.prototype.addSpiderGraph = function (svg, div, data, width, height) {
      var radius = 5;
      var w = Math.min(width,height) - 120;
      var h = Math.min(width,height) - 120;
      var factor = 1;
      var factorLegend = 1;
      var levels = 10;
      var maxValue = 1;
      var radians = 2 * Math.PI;
      var opacityArea = 0.35;
      var ToRight = 0;
      var TranslateX = 0;
      if (width < height) {
        TranslateX = 30;
      } else {
        TranslateX = width / 4;
      }
      var TranslateY = 50;
      var ExtraWidthX = 200;
      var ExtraWidthY = 100;
      var d = this.parseData(data)[1];
      maxValue = Math.max(maxValue, d3.max(d, function (i) {return d3.max(i.map(function (o) {return o.value;}));}));
      var allAxis = (d[0].map(function (i, j) {return i.axis;}));
      var total = allAxis.length;
      var radius = factor * Math.min(w / 2, h / 2);

      var g = svg.append('g')
        .attr('transform', 'translate(' + TranslateX + ',' + TranslateY + ')');

      var tooltip;
      var levelsArray = [];
      var j = 0;
      while (j < (levels - 1)) {
        levelsArray.push(1);
        j++;
      }

      //Net axis
      j = 0;
      levelsArray.forEach(function (number) {
        var levelFactor = factor * radius * ((j + 1) / levels);
        g.selectAll('.levels')
         .data(allAxis)
         .enter()
         .append('svg:line')
         .attr('x1', function (d, i) {return levelFactor * (1 - factor * Math.sin(i * radians / total));})
         .attr('y1', function (d, i) {return levelFactor * (1 - factor * Math.cos(i * radians / total));})
         .attr('x2', function (d, i) {return levelFactor * (1 - factor * Math.sin((i + 1) * radians / total));})
         .attr('y2', function (d, i) {return levelFactor * (1 - factor * Math.cos((i + 1) * radians / total));})
         .attr('class', 'lines')
         .style('stroke', 'grey')
         .style('stroke-opacity', '0.75')
         .style('stroke-width', '0.3px')
         .attr('transform', 'translate(' + (w / 2 - levelFactor) + ', ' + (h / 2 - levelFactor) + ')');
        j++;
      });

      var series = 0;

      //axis drawing
      var axis = g.selectAll('.axis')
        .data(allAxis)
        .enter()
        .append('g')
        .attr('class', 'axis');

      axis.append('line')
        .attr('x1', w / 2)
        .attr('y1', h / 2)
        .attr('x2', function (d, i) {return (w) / 2 * (1 - (factor - 0.1) * Math.sin(i * radians / total));})
        .attr('y2', function (d, i) {return (h) / 2 * (1 - (factor - 0.1) * Math.cos(i * radians / total));})
        .attr('class', 'line')
        .style('stroke', 'grey')
        .style('stroke-width', '1px');

      axis.append('text')
        .attr('class', 'legend')
        .text(function (d) {return d;})
        .style('font-family', 'sans-serif')
        .style('font-size', '11px')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.5em')
        .attr('transform', function (d, i) {return 'translate(0, -10)';})
        .attr('x', function (d, i) {return w / 2 * (1 -
          factorLegend * Math.sin(i * radians / total)) - 60 * Math.sin(i * radians / total);})
        .attr('y', function (d, i) {return h / 2 * (1 - Math.cos(i * radians / total)) - 20 * Math.cos(i * radians / total);});

      //area drawing
      d.forEach(function (y, x) {
        var dataValues = [];
        g.selectAll('.nodes')
          .data(y, function (j, i) {
            dataValues.push([
              w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / maxValue) * factor * Math.sin(i * radians / total)),
              h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / maxValue) * factor * Math.cos(i * radians / total))
            ]);
          });
        dataValues.push(dataValues[0]);
        g.selectAll('.area')
          .data([dataValues])
          .enter()
          .append('polygon')
          .attr('class', 'radar-chart-serie' + series)
          .attr('id', 'radar-chart-serie' + series)
          .style('stroke-width', '2px')
          .style('stroke', color(series))
          .attr('points',function (d) {
            var str = '';
            d.forEach(function (pti) {
              str = str + pti[0] + ',' + pti[1] + ' ';
            });
            return str;
          })
          .style('fill', function (j, i) {return color(series);})
          .style('fill-opacity', opacityArea)
          .on('mouseover', function (d) {
            var z = 'polygon.' + d3.select(this).attr('class');
            g.selectAll('polygon')
              .transition(200)
              .style('fill-opacity', 0.1);

            g.selectAll(z)
              .transition(200)
              .style('fill-opacity', 0.9);
          })
          .on('mouseout', function () {
            g.selectAll('polygon')
            .transition(200)
            .style('fill-opacity', opacityArea);
          });
        series++;
      });

      series = 0;

      //circles drawing
      d.forEach(function (y, x) {
        g.selectAll('.nodes')
          .data(y).enter()
          .append('svg:circle')
          .attr('r', '5px')
          .attr('cx', function (j, i) {
            var dataValues = [];
            dataValues.push([
              w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / maxValue) * factor * Math.sin(i * radians / total)),
              h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / maxValue) * factor * Math.cos(i * radians / total))
            ]);
            return w / 2 * (1 - (Math.max(j.value, 0) / maxValue) * factor * Math.sin(i * radians / total));
          })
          .attr('cy', function (j, i) {
            return h / 2 * (1 - (Math.max(j.value, 0) / maxValue) * factor * Math.cos(i * radians / total));
          })
          .style('fill', color(series)).style('fill-opacity', .9)
          .on('mouseover', function (d) {
            tooltip.transition()
              .duration(200)
              .style('opacity', .9);
            tooltip.html('<div>' + d.valueOrig + '</div>');
            tooltip.style('left', (d3.event.pageX) + 'px')
              .style('top', (d3.event.pageY) + 'px');

            var z = 'polygon.' + d3.select(this).attr('class');
            g.selectAll('polygon')
              .transition(200)
              .style('fill-opacity', 0.1);
            g.selectAll(z)
              .transition(200)
              .style('fill-opacity', .75);
          })
          .on('mouseout', function () {
            tooltip.transition(200)
              .style('opacity', 0);
            g.selectAll('polygon')
              .transition(200)
              .style('fill-opacity', opacityArea);
          });

        series++;
      });

      //Tooltip
      tooltip = div.append('div')
        .attr('class', 'tooltip-relation')
        .style('opacity', 0);

      var colorscale = d3.scale.category10();

      //Legend titles
      var legendOptions = this.parseData(data)[0];

      this.addLegend(div,width,height,legendOptions);

    };

    /**
     * Add legend to a chart
     *
     * @method addLegend
     * @param div {HTMLElement} Element to which legend is added
     * @param width,height {number} Width and height to calculate legend width and height
     * @param legendOptions {Array} Legend points
     */
    SpiderChart.prototype.addLegend = function (div, width, height, legendOptions) {

      var legend1 = div.append('div').attr('class','legendClass');
      legend1.style('height',height + 'px');
      legend1.style('width','110x');
      legend1.style('left', width - 130 + 'px');
      legend1.html('<span id="legendButton" style= "background-color:white">Legend</span>');

      var legendDiv = legend1.append('div')
      .attr('class', 'legendDiv')
      .attr('min-height', height + 'px');

      var legendSvg = legendDiv.append('svg')
      .attr('class','legendSvg')
      .attr('height', legendOptions.length * 27)
      .attr('width',130);

      var legend = legendSvg.append('g')
      .attr('id', 'legend')
      .attr('x', 0)
      .attr('y', -20)
      .attr('height', 100)
      .attr('width', 100);

      var series = -1;
      legend.selectAll('g').data(legendOptions)
        .enter()
        .append('g')
        .each(function (d, i) {
          var g = d3.select(this);
          g.append('circle')
            .attr('cx', 5)
            .attr('class', 'node')
            .attr('cy', i * 25 + 20)
            .attr('r', 5)
            .attr('id', function () {series++; return 'radar-chart-serie' + series;})
            .style('fill', function (j, i) {return color(series);})
            .on('mouseover', function () {
              var area = document.getElementById(this.id);
              area.style.fillOpacity = 0.75;
            })
           .on('mouseout', function () {
             var area = document.getElementById(this.id);
             area.style.fillOpacity = 0.35;
           });
          g.append('text')
            .attr('x', 15)
            .attr('y', i * 25 + 25)
            .attr('height',30)
            .attr('width',100)
            .style('cursor','default')
            .attr('id', function () {return 'radar-chart-serie' + series;})
            .on('mouseover', function () {
              var area = document.getElementById(this.id);
              area.style.fillOpacity = 0.75;
            })
           .on('mouseout', function () {
             var area = document.getElementById(this.id);
             area.style.fillOpacity = 0.35;
           })
           .text(d);
        });
    };

    /**
     * Parse data into form suitable form force layered graph
     *
     * @method parseData
     * @param data
     * @return array of parsed data
     */
    SpiderChart.prototype.parseData = function (data) {
      var self = this;
      var splits = [];
      var axis = [];
      var datas = [];
      var pom = [];
      var pom2 = [];
      var i = 0;
      var final = [];

      data.forEach(function (array) {
        axis.push(array[0].label);
      });

      data[0].forEach(function (obj) {
        splits.push(obj.x);
        datas.push([]);
      });

      data.forEach(function (array) {
        i = 0;
        array.forEach(function (obj) {
          if (obj.y === null)  obj.y = 0;
          datas[i].push(obj.y);
          i++;
        });
      });

      datas[0].forEach(function (obj) {
        pom.push([]);
        pom2.push([]);
      });

      datas.forEach(function (data) {
        i = 0;
        data.forEach(function (d) {
          pom[i].push(d);
          i++;
        });
      });


      i = 0;
      if (pom[0].length == 1) {
        var forScale = [];
        pom.forEach(function(x){
          forScale.push(x[0]);
        })
      };

      pom.forEach(function (data) {
        if (pom[0].length === 1) {
          var scale = d3.scale.linear()
           .domain([0,d3.max(forScale)])
           .range([0.05, 0.9]);
        }else {
          var scale = d3.scale.linear()
           .domain([0,d3.max(data)])
           .range([0.05, 0.9]);
        };

        data.forEach(function (d) {
          pom2[i].push(scale(d));
        });
        i++;
      });

      var i = 0;
      var j = 0;
      splits.forEach(function (split) {
        final.push([]);
        j = 0;
        axis.forEach(function (ax) {
          final[i].push({axis:ax,value:pom2[j][i],valueOrig:pom[j][i]});
          j++;
        });
        i++;
      });

      if (splits.length > 8) {
        throw new errors.NotEnoughData('Enough splits terms!');
      }
      return [splits, final];
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
    SpiderChart.prototype.addClipPath = function (svg, width, height) {
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
     * @returns {Function} Creates the spider chart
     */
    SpiderChart.prototype.checkIfEnoughData = function () {
      var series = this.chartData.series;
      var message = 'Spider chart require at least 3 metrics aggreagation';
      if (series.length < 3) {
        throw new errors.NotEnoughData(message);
      }
    };

    /**
     * Renders d3 visualization
     *
     * @method draw
     * @returns {Function} Creates the spider chart
     */
    SpiderChart.prototype.draw = function () {
      var self = this;
      var $elem = $(this.chartEl);
      var margin = this._attr.margin;
      var elWidth = this._attr.width = $elem.width();
      var elHeight = this._attr.height = $elem.height();
      var minWidth = 700;
      var minHeight = 400;
      var div;
      var svg;
      var width;
      var names;
      var height;

      return function (selection) {
        selection.each(function (data) {
          var el = this;

          var layers = data.series.map(function mapSeries(d) {
            return d.values.map(function mapValues(e, i) {
              return {
                _input: e,
                label: d.label,
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
          self.addSpiderGraph(svg, div, layers, width, height);

          return svg;
        });
      };
    };

    return SpiderChart;
  };
});