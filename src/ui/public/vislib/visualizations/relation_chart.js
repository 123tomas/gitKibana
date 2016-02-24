define(function (require) {
  return function RelationChartFactory(Private) {
    var d3 = require('d3');
    var _ = require('lodash');
    var $ = require('jquery');
    var errors = require('ui/errors');

    var PointSeriesChart = Private(require('ui/vislib/visualizations/_point_series_chart'));

    /**
     * Relation Chart Visualization
     *
     * @class RelationChart
     * @constructor
     * @extends Chart
     * @param handler {Object} Reference to the Handler Class Constructor
     * @param el {HTMLElement} HTML element to which the chart will be appended
     * @param chartData {Object} Elasticsearch query results for this specific chart
     */
    _.class(RelationChart).inherits(PointSeriesChart);
    function RelationChart(handler, chartEl, chartData) {
      if (!(this instanceof RelationChart)) {
        return new RelationChart(handler, chartEl, chartData);
      }

      RelationChart.Super.apply(this, arguments);

      this.checkIfEnoughData();

      // Relation chart specific attributes
      this._attr = _.defaults(handler._attr || {}, {
        interpolate: 'linear',
        xValue: function (d) { return d.x; },
        yValue: function (d) { return d.y; },
        zValue: function (d) { return d.label; }
      });
    }

    /**
     * Adds forced layered graph to SVG
     *
     * @method addForcedGraph
     * @param svg {HTMLElement} SVG to which rect are appended
     * @param div {HTMLElement} DIV to which tooltip is appended
     * @param data {Array} Array of object data points
     * @param names {Array} Array of length 3 with names of data
     * @param width, height {number} width and height of new svg element
     * @returns {D3.UpdateSelection} SVG with force layered graph added
     */
    RelationChart.prototype.addForcedGraph = function (svg, div, data, names, width, height) {
      var self = this;
      var scale;
      var parsedData = self.parseData(data);
      var nodes = parsedData[0];
      var nodesObjects = parsedData[1];
      var links = parsedData[2];
      var counts = [];
      var color;
      var colorAttribute;
      var tooltip;

      var container = svg.append('g');
      var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on('zoom', zoomed);

      //enable graph to be zoomed
      function zoomed() {
        container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
      }

      var force = d3.layout.force()
        .size([width, height])
        .charge(-150)
        .linkDistance(50)
        .nodes(nodesObjects)
        .links(links)
        .start();

      //loading count of links to count max and min to scale it
      links.forEach(function (linkIterated) {
        counts.push(linkIterated.count);
      });
      svg.call(zoom);

      color = d3.scale.category20();

      tooltip = div.append('div')
      .attr('class', 'tooltip-relation')
      .style('opacity', 0);

      scale = d3.scale.linear()
        .domain([d3.min(counts),d3.max(counts)])
        .range(['#d1d1d1', '#000000']);

      var link = container.selectAll('.link')
        .data(links)
        .enter().append('svg:path')
        .attr('stroke', function (d) {
          return scale(d.count);})
        .attr('stroke-width',1)
        .on('mouseover', function (d) {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html('<div class="source"><strong>Source&nbsp(' + names[1] + '):&nbsp</strong>' + d.source.name + '</div>'
          + '<div class="target"><strong>Destination&nbsp(' + names[2] + '):&nbsp</strong>' + d.target.name + '</div>'
          + '<div class="count"><strong>' + names[0] + ':&nbsp</strong>' + d.count + '</div>');
          tooltip.style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY) + 'px');
        })
        .on('mouseout', function (d) {
          tooltip.transition()
            .duration(200)
            .style('opacity', 0);
        });

      counts = [];

      //loading count of nodes to count max and min to scale it
      nodesObjects.forEach(function (nodesObject) {
        counts.push(nodesObject.count);
      });

      scale = d3.scale.linear()
        .domain([d3.min(counts),d3.max(counts)])
        .range([5,20]);

      var node = container.selectAll('.node')
        .data(nodesObjects)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('id', function (d) {return d.name;})
        .attr('r', function (d) {return scale(d.count);})
        .attr('fill',function (d,i) {
          colorAttribute = color(i);
          d.color = colorAttribute;
          return colorAttribute;
        })
        .call(force.drag)
        .on('mouseover', function (d) {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html('<div class="ip">' + d.name + '</div>');
          tooltip.style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY) + 'px');
        })
        .on('mouseout', function (d) {
          tooltip.transition()
            .duration(200)
            .style('opacity', 0);
        })
        .on('click', connectedNodes); //Added cod

      //setup to ligt up the neighbour nodes on dblclick
      var toggle = 0;
      //Create an array logging what is connected to what
      var linkedByIndex = {};

      for (i = 0; i < nodesObjects.length; i++) {
        linkedByIndex[i + "," + i] = 1;
      };
      links.forEach(function (d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
      });

      //Control up whether a pair are neighbours
      function neighboring(a, b) {
        return linkedByIndex[a.index + "," + b.index];
      };

      function connectedNodes() {
        if (toggle == 0) {
          //Reduce the opacity of all but the neighbouring nodes
          d = d3.select(this).node().__data__;
          node.style("opacity", function (o) {
            return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
          });
          link.style("opacity", function (o) {
            return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
          });
          //Reduce the op
          toggle = 1;
        } else {
          //Put them back to opacity=1
          node.style("opacity", 1);
          link.style("opacity", 1);
          toggle = 0;
        }
      }

      force.on('tick', function () {
        link.attr('d', function (d) {
          var dx = d.target.x - d.source.x;
          var dy = d.target.y - d.source.y;
          var dr = Math.sqrt(dx * dx + dy * dy);
          return 'M' + d.source.x + ',' + d.source.y + 'A' +
          dr + ',' + dr + ' 0 0 1,' + d.target.x + ',' + d.target.y +
          'A' + dr + ',' + dr + ' 0 0 0,' + d.source.x + ',' + d.source.y;
        });

        node.attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        });
      });

      //forced graph should not move before visualisation
      var k = 0;
      while ((force.alpha() > 1e-3) && (k < 150)) {
        force.tick();
        k = k + 1;
      }

      this.addLegend(div, width, height, nodesObjects);
      
    };

    /**
     * Remove not unique values from array
     *
     * @method toUnique
     * @param array
     */
    RelationChart.prototype.toUnique = function (a, b, c) {
      b = a.length;
      while (c = --b) while (c--) a[b] !== a[c] || a.splice(c,1);
    };

    /**
     * Add legend to a chart
     *
     * @method addLegend
     * @param div {HTMLElement} Element to which legend is added
     * @param width,height {number} Width and height to calculate legend width and height
     * @param nodesObjects {Array} Array of nodes which will be added to legend	 
     */
    RelationChart.prototype.addLegend = function (div, width, height, nodesObjects) {
      var legend1 = div.append('div').attr('class','legendClass');
      legend1.style('height',height + 'px');
      legend1.style('width','110x');
      legend1.style('left', width-130 + 'px')
      legend1.html('<span id="legendButton">Legend</span>');

      var legendDiv = legend1.append('div')
      .attr('class', 'legendDiv')
      .attr('min-height', height + 'px');

      var legendSvg = legendDiv.append('svg')
      .attr('class','legendSvg')
      .attr('height', nodesObjects.length*27)
      .attr('width',130);

      var legend = legendSvg.append('g')
      .attr('id', 'legend')
      .attr('x', 0)
      .attr('y', -20)
      .attr('height', 100)
      .attr('width', 100);

      legend.selectAll('g').data(nodesObjects)
      .enter()
      .append('g')
      .each(function(d, i) {
        var g = d3.select(this);
        g.append('circle')
          .attr('cx', 5)
          .attr('cy', i*25+20)
          .attr('r', 5)
          .on('mouseover', function() {
            var node = document.getElementById(d.name);
            node.style.fill = 'black';
          })
          .on('mouseout', function() {
            var node = document.getElementById(d.name);
            node.style.fill = d.color;
          })
          .style('fill', d.color);

        g.append('text')
          .attr('x', 15)
          .attr('y', i * 25 + 25)
          .attr('height',30)
          .attr('width',100)
          .style('cursor','default')
          .on('mouseover', function() {
            var node = document.getElementById(d.name);
            node.style.fill = 'black';
          })
          .on('mouseout', function() {
            var node = document.getElementById(d.name);
            node.style.fill = d.color;
          })
          .text(d.name)
      });

      $('#legendButton').click(function() {
        $('.legendSvg').toggle();
      });

    };

    /**
     * Parse data into form suitable form force layered graph
     *
     * @method parseData
     * @param data {Array} data which will be parsed to suitable form
     * @return array of parsed data
     */
    RelationChart.prototype.parseData = function (data) {
      var self = this;
      var nodes = [];
      var nodesObjects = [];
      var links = [];

      //Data parsing into form which are suitable to d3.force function
      data.forEach(function (row) {
        row.forEach(function (datas) {
          nodes.push(datas.x);
          nodes.push(datas.label);
          self.toUnique(nodes);
          links.push({source:datas.x,target:datas.label,count:datas.y});
        });
      });

      //adding to nodesObject array Nodes object which has attributes name and count
      nodes.forEach(function (node) {
        nodesObjects.push({name:node,count:0,color:null});
      });

      //every node need to have number of communication going to or from its
      nodesObjects.forEach(function (node) {
        links.forEach(function (link1) {
          if ((node.name === link1.source) || (node.name === link1.target)) {
            node.count = node.count + link1.count;
          };
        });
      });

      //mapping source and target of link to index of node in nodes
      links.forEach(function (link1) {
        link1.source = nodes.indexOf(link1.source);
        link1.target = nodes.indexOf(link1.target);

      });
      return [nodes,nodesObjects,links];
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
    RelationChart.prototype.addClipPath = function (svg, width, height) {
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
    RelationChart.prototype.checkIfEnoughData = function () {
      var series = this.chartData.series;
      var message = 'Relation charts require Source and Destination to be set and this properties must be different ';

      var notEnoughData = series.some(function (obj) {
        return !(obj.values[0].hasOwnProperty('series') && obj.values[0].x !== '_all' && obj.values[0].x !== obj.values[0].series
        && obj.values[0].y !== null);
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
    RelationChart.prototype.draw = function () {
      var self = this;
      var $elem = $(this.chartEl);
      var margin = this._attr.margin;
      var elWidth = this._attr.width = $elem.width();
      var elHeight = this._attr.height = $elem.height();
      var minWidth = 350;
      var minHeight = 20;
      var div;
      var svg;
      var width;
      var height;
      var names = [];

      return function (selection) {
        selection.each(function (data) {
          var el = this;

          var layers = data.series.map(function mapSeries(d) {
            names[0] = d.values[0].aggConfig.vis.aggs[0]._opts.type;
            names[1] = d.values[0].aggConfig.vis.aggs[1]._opts.params.field;
            names[2] = d.values[0].aggConfig.vis.aggs[2]._opts.params.field;
            names[3] = d.values[0].aggConfig.vis.aggs[1].__schema.title;
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

          if(names[3] === 'Destination') {
            throw new errors.NotEnoughData('Be careful to add Source before Destination! It can confuse you.');
          }

          if (width < minWidth || height < minHeight) {
            throw new errors.ContainerTooSmall();
          }

          div = d3.select(el);

          svg = div.append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          self.addClipPath(svg, width, height);
          self.addForcedGraph(svg, div, layers, names, width, height);

          return svg;
        });
      };
    };

    return RelationChart;
  };
});