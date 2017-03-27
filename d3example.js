/* global d3, sharedObject */
(function () {
    "use strict";

// array of the attribute options
	  var attribute_options =
        ["Type",
         "Charge",
         "Arrest",
         "Article",
         "Agency",
         "Accident",
         "Use of Belt",
         "Injuries",
         "Damage",
         "Fatal",
         "Hazardous Materials",
         "Alcohol consumption",
         "Vehicle type",
         "Vechicle Make",
         "Race",
         "Gender"];

    sharedObject.showBy = attribute_options[0];

    function attribute_value(a,d) {
      if (a==attribute_options[0])  return typeof d[32] == "undefined"? d.type: d[32];
      if (a==attribute_options[1])  return typeof d[33] == "undefined"? d.charge: d[33];
      if (a==attribute_options[2])  return typeof d[41] == "undefined"? d.arrest: d[41];
      if (a==attribute_options[3])  return typeof d[34] == "undefined"? d.article: d[34];
      if (a==attribute_options[4])  return typeof d[10] == "undefined"? d.agency: d[10];
      if (a==attribute_options[5])  return typeof d[16] == "undefined"? d.accident: d[16];
      if (a==attribute_options[6])  return typeof d[17] == "undefined"? d.belt: d[17];
      if (a==attribute_options[7])  return typeof d[18] == "undefined"? d.injury: d[18];
      if (a==attribute_options[8])  return typeof d[19] == "undefined"? d.damage: d[19];
      if (a==attribute_options[9])  return typeof d[20] == "undefined"? d.fatal: d[20];
      if (a==attribute_options[10]) return typeof d[22] == "undefined"? d.hazmat: d[22];
      if (a==attribute_options[11]) return typeof d[24] == "undefined"? d.alcohol: d[24];
      if (a==attribute_options[12]) return typeof d[27] == "undefined"? d.vehicle: d[27];
      if (a==attribute_options[13]) return typeof d[29] == "undefined"? d.make: d[29];
      if (a==attribute_options[14]) return typeof d[36] == "undefined"? d.race: d[36];
      if (a==attribute_options[15]) return typeof d[37] == "undefined"? d.gender: d[37];
    }

    // Various accessors that specify the four dimensions of data to visualize.
    function x(d) { return d.longitude; }
    function y(d) { return d.latitude; }
    function radius(d) { return 10000000; }
    function show(d) { return d.show; }
    function key(d) { return d.vid; }
    function color(d) { return attribute_value(sharedObject.showBy,d); }

    // Chart dimensions.
    var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
        width = 960 - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Various scales. These domains make assumptions of data, naturally.
    var xScale = d3.scale.linear().domain([-77.4, -76.8]).range([0, width]),
        yScale = d3.scale.linear().domain([38.95, 39.35]).range([height, 0]),
        radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
        colorScale = d3.scale.category10(),
        formatxAxis = d3.format('.1f');

    var xAxis = d3.svg.axis().scale(xScale).orient("top")
        .tickFormat(formatxAxis).ticks(5).tickValues([]).tickSize([height],[height]).tickSubdivide([5]),
        yAxis = d3.svg.axis().scale(yScale).orient("right")
        .tickFormat(formatxAxis).ticks(5).tickValues([]).tickSize([width],[width]).tickSubdivide([5]);

    // Create the SVG container and set the origin.
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add the x-axis.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the y-axis.
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Add an x-axis label.
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("");

    // Add a y-axis label.
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("");

    // Add the year label; the value is set on transition.
    var label = svg.append("text")
        .attr("class", "year label")
        .attr("text-anchor", "start")
        .attr("y", 28)
        .attr("x", 28)
        .text("2012-01-02 00:00:00");

/********************************************************* Grouping options */
    var dropDown =
        d3.select("#groupBy").append("select")
        .attr("name", "attribute-list");

    var options = dropDown.selectAll("option")
           .data(attribute_options)
           .enter()
           .append("option");

    options.text(function (d) { return d; })
       .attr("value", function (d) { return d; });

/********************************************************* Load the data */
    d3.json("traffic.json", function(violations) {

      // A bisector since many violation's data is sparsely-defined.
      var bisect = d3.bisector(function(d) { return d[0]; });

      svg.selectAll("legend_text")
      .data(["Click legend to show/hide data:"])
      .enter()
      .append("text")
      .attr("x", 400)
      .attr("y", function (d, i) { return height-470 + i*14; })
      .attr("class", "legend label")
      .style("font-family", "sans-serif")
      .style("font-size", "10px")
      .text(function (d) { return d; });

 /********************************************************* Grouping and Filtering */

      var element_opacity = function(e) {
        var groupBy = sharedObject.showBy+".";
        var e_value = groupBy+e;
        var opacity = 1.0;
        // If the filters contain the clicked shape hide it
        sharedObject.filter.forEach(function (f) {
          if (f === e_value) opacity = 0.3;
        });
        return opacity;
      }

      var filter_function = function(e) {
        // This indicates whether the item is already visible or not
        var groupBy = sharedObject.showBy+".";
        var e_value = groupBy+e;
        var hide = true;

        // If the filters contain the clicked shape hide it
        sharedObject.filter.forEach(function (f) {
          if (f === e_value) hide = false;
        });
        // Hide the shape or show it
        if (hide) {
          sharedObject.filter.push(e_value);
          d3.select(this).style("opacity", 0.3);
        } else {
          var index = sharedObject.filter.indexOf(e_value);
          if (index > -1) sharedObject.filter.splice(index, 1);
          d3.select(this).style("opacity", 1.0);
        }
        //show filtering status
        sharedObject.dispatchf.filterMouseover();
      }

      var data_group = d3.nest()
      .key(function(d) {return d[32];})
      .entries(violations.data);

      var distinct_values = d3.values(data_group).map(function(d) { return d.key; });

      // the legend color guide
      var legend = svg.selectAll("rect")
      .data(distinct_values)
      .enter().append("rect")
      .attr({
        x: function(d, i) { return (400 + i*80); },
        y: height-450,
        width: 40,
        height: 12
      }).style("fill", function(d,i) { return colorScale(d); });
      svg.selectAll("rect").on("click",filter_function);

      var legend_labels = svg.selectAll("legend")
      .data(distinct_values)
      .enter().append("text")
      .attr({
        x: function(d, i) { return (400 + i*80); },
        y: height-425,
        class: "legend label"
      }).text(function(d) { return d.substring(0,10); });

      var filter_date = function (d) {
        var date = typeof d.date !== 'undefined'?d.date:d[8];
        return date.substring(0,10) < sharedObject.date;
      }

      var filter_dots = function (d) {
        var b = true;
        if (filter_date(d)) {
          sharedObject.filter.forEach(function (f) {
            var a = f.split(".");
            var v = attribute_value(a[0],d);
            if (a[1]==v) b = false;
          });
        } else b = false;
        return b;
      }

/********************************************************* Dot drawing */
      function position(dot) {
          dot .attr("cx", function(d) { return d.show?xScale(x(d)):-180; })
              .attr("cy", function(d) { return d.show?yScale(y(d)):-90; })
              .attr("r",  function(d) { return d.show?radiusScale(radius(d)):0.0; });
      }

      function order(a, b) {
        return radius(b) - radius(a);
      }

      // Interpolates the dataset for the given (fractional) year.
      function interpolateData(year) {
        sharedObject.yearData = violations.data.map(function(d) {
          return {
            id: d[0],
            date: d[8],
            time: d[9],
            type: d[32],
            charge: d[33],
            arrest: d[41],
            article: d[34],
            description: d[12],
            location: d[13],
            agency: d[10],
            accident: d[16],
            belt: d[17],
            injury: d[18],
            damage: d[19],
            fatal: d[20],
            hazmat: d[22],
            alcohol: d[24],
            vehicle: d[27],
            year: d[28],
            make: d[29],
            model: d[30],
            color: d[31],
            city: d[38],
            state: d[39],
            race: d[36],
            gender: d[37]==='M'?"Male":"Female",
            latitude: d[14],
            longitude: d[15],
            show: filter_dots(d),
          };
        });
        return sharedObject.yearData;
      }

      // Add a dot per violation. Initialize the data at 2012, and set the colors.
      var dot = svg.append("g")
          .attr("class", "dots")
          .selectAll(".dot")
          .data(interpolateData("2012-01-02"))
          .enter().append("circle")
          .attr("class", "dot")
          .style("fill", function(d) { return colorScale(color(d)); })
          .call(position)
          .sort(order)
		      .on("mouseover", function(d) {
				    sharedObject.dispatch.nationMouseover(d);})
          .on("mouseout", mouseOff)
          .on("click", function(d){
            sharedObject.flyTo(d);});

      // Add a title.
      dot.append("title").text(function(d) { return "ID:"+d.id+" Date:"+d.date.substring(0,10)+" "+"Latitude:"+y(d).substring(0,5)+" "+"Longitude:"+x(d).substring(0,5) ; })
      $(".dot").tipsy({ gravity: 's', });

      // Tweens the entire chart by first tweening the year, and then the data.
      // For the interpolated data, the dots and label are redrawn.
      function tweenYear() {
        var year = d3.interpolateNumber(2012, 2017);
        return function(t) { displayYear(year(t)); };
      }

      // Updates the display to show the specified year.
      function displayYear(year) {
        var hour = year.toString().substring(11, 19);
        sharedObject.date = year.toString().substring(0, 10);
        dot.data(interpolateData(sharedObject.date)).call(position).sort(order);
        label.text(sharedObject.date+" "+hour);
      }

      // make displayYear global
      window.displayYear = displayYear;

      // Finds (and possibly interpolates) the value for the specified year.
      function interpolateValues(values, year) {
        var i = bisect.left(values, year, 0, values.length - 1),
            a = values[i];
        if (i > 0) {
          var b = values[i - 1],
              t = (year - a[0]) / (b[0] - a[0]);
          return a[1] * (1 - t) + b[1] * t;
        }
        return a[1];
      }

      sharedObject.dispatch.on("nationMouseover.d3", function(violationObject) {
          dot.transition()
          .duration(800).style("opacity", 1)
          .attr("r", function(d) {
                 if (typeof violationObject !== 'undefined' && d.id === violationObject.id)
                     return 10;
                     return 5;
                }).ease("elastic");
      });

      // what happens when we leave a bubble?
      var mouseOff = function() {
        var selection = d3.select(this);
        // go back to original size and opacity
        selection.transition()
        .duration(800).style("opacity", .5)
        .attr("r", 8).ease("elastic");
        // fade out guide lines, then remove them
        d3.selectAll(".dots").transition().duration(100).styleTween("opacity",
        function() { return d3.interpolate(.5, 0); }).remove()
      };

      dropDown.on("change", function() {
          sharedObject.showBy = this.value;
          dot.style("fill", function(d) {
          return colorScale(color(d));
          });

          data_group = d3.nest()
          .key(function(d) {
            if (sharedObject.showBy==attribute_options[0])  return d[32];
            if (sharedObject.showBy==attribute_options[1])  return d[33];
            if (sharedObject.showBy==attribute_options[2])  return d[41];
            if (sharedObject.showBy==attribute_options[3])  return d[34];
            if (sharedObject.showBy==attribute_options[4])  return d[10];
            if (sharedObject.showBy==attribute_options[5])  return d[16];
            if (sharedObject.showBy==attribute_options[6])  return d[17];
            if (sharedObject.showBy==attribute_options[7])  return d[18];
            if (sharedObject.showBy==attribute_options[8])  return d[19];
            if (sharedObject.showBy==attribute_options[9])  return d[20];
            if (sharedObject.showBy==attribute_options[10]) return d[22];
            if (sharedObject.showBy==attribute_options[11]) return d[24];
            if (sharedObject.showBy==attribute_options[12]) return d[27];
            if (sharedObject.showBy==attribute_options[13]) return d[29];
            if (sharedObject.showBy==attribute_options[14]) return d[36];
            if (sharedObject.showBy==attribute_options[15]) return d[37];})
          .entries(violations.data);

          distinct_values = d3.values(data_group).map(function(d) { return d.key; });

          // the legend color guide
          legend.remove();
          legend = svg.selectAll("rect")
          .data(distinct_values)
          .enter().append("rect")
          .attr({
            x: function(d, i) { return (400 + i*80); },
            y: height-450,
            width: 40,
            height: 12 })
          .style("fill", function(d,i) { return colorScale(d); })
          .style("opacity", function(d,i) { return element_opacity(d);});
          svg.selectAll("rect").on("click",filter_function);

          legend_labels.remove();
          legend_labels = svg.selectAll("legend")
          .data(distinct_values)
          .enter().append("text")
          .attr({
            x: function(d, i) { return (400 + i*80); },
            y: height-425,
            class: "legend label"
          })
          .text(function(d) { return d; });

      });

/***************************************************** Clear Filters */
      var clear_filter = function() {
        //show filtering status

        if (sharedObject.filter.length>0) {
            sharedObject.filter = [];
            sharedObject.dispatchf.filterMouseover();
            legend.remove();
            legend = svg.selectAll("rect")
            .data(distinct_values)
            .enter().append("rect")
            .attr({
              x: function(d, i) { return (400 + i*80); },
              y: height-450,
              width: 40,
              height: 12 })
            .style("fill", function(d,i) { return colorScale(d); })
            .style("opacity", function(d,i) { return element_opacity(d);});
            svg.selectAll("rect").on("click",filter_function);
        }
      }

      svg.selectAll("clear_text")
      .data(["Clear filter"])
      .enter()
      .append("text")
      .attr("x", 550)
      .attr("y", function (d, i) { return height-470 + i*14; })
      .attr("class", "legend label")
      .style("font-family", "sans-serif")
      .style("font-weight", "bold")
      .style("text-decoration", "underline")
      .style("font-size", "10px")
      .text(function (d) { return d; })
      .on("click",clear_filter);


      function wrap(text, width) {
        text.each(function() {
          var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 1.1, // ems
              y = text.attr("y"),
              dy = parseFloat(text.attr("dy")),
              tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
          }})
      };
    });
}());
