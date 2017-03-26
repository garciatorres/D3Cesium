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

    var showBy = attribute_options[0];

    // Various accessors that specify the four dimensions of data to visualize.
    function x(d) { return d.longitude; }
    function y(d) { return d.latitude; }
    function radius(d) { return 10000000; }
    function key(d) { return d.vid; }
    function color(d) {
      if (showBy==attribute_options[0])  return d.type;
      if (showBy==attribute_options[1])  return d.charge;
      if (showBy==attribute_options[2])  return d.arrest;
      if (showBy==attribute_options[3])  return d.article;
      if (showBy==attribute_options[4])  return d.agency;
      if (showBy==attribute_options[5])  return d.accident;
      if (showBy==attribute_options[6])  return d.belt;
      if (showBy==attribute_options[7])  return d.injury;
      if (showBy==attribute_options[8])  return d.damage;
      if (showBy==attribute_options[9])  return d.fatal;
      if (showBy==attribute_options[10])  return d.hazmat;
      if (showBy==attribute_options[11]) return d.alcohol;
      if (showBy==attribute_options[12]) return d.vehicle;
      if (showBy==attribute_options[13]) return d.make;
      if (showBy==attribute_options[14]) return d.race;
      if (showBy==attribute_options[15]) return d.gender;
    }

    // Chart dimensions.
    var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
        width = 960 - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Various scales. These domains make assumptions of data, naturally.
    var xScale = d3.scale.linear().domain([-77.4, -76.8]).range([0, width]),
        yScale = d3.scale.linear().domain([38.95, 39.35]).range([height, 0]),
        radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
        colorScale = d3.scale.category20c();

    var xAxis = d3.svg.axis().scale(xScale).orient("bottom"),//.tickValues([]),
        yAxis = d3.svg.axis().scale(yScale).orient("left");//.tickValues([]);

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
        .attr("x", 30)
        .text("2012-01-02 00:00:00");

    var dropDown = d3.select("#filter").append("select")
                  .attr("name", "attribute-list");

    var options = dropDown.selectAll("option")
           .data(attribute_options)
           .enter()
           .append("option");

    options.text(function (d) { return d; })
       .attr("value", function (d) { return d; });

/********************************************************* Load the data.*/
    d3.json("traffic.json", function(violations) {

      // A bisector since many violation's data is sparsely-defined.
      var bisect = d3.bisector(function(d) { return d[0]; });

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

      var legend_labels = svg.selectAll("legend")
      .data(distinct_values)
      .enter().append("text")
      .attr({
        x: function(d, i) { return (400 + i*80); },
        y: height-425,
        class: "legend label"
      })
      .text(function(d) { return d; });


      // Positions the dots based on data.
      function position(dot) {
        dot .attr("cx", function(d) { return xScale(x(d)); })
            .attr("cy", function(d) { return yScale(y(d)); })
            .attr("r",  function(d) { return radiusScale(radius(d)); });
      }

      function order(a, b) {
        return radius(b) - radius(a);
      }

      // Interpolates the dataset for the given (fractional) year.
      function interpolateData(year) {
        sharedObject.yearData = violations.data.map(function(d) {
          var filter = (d[8].substring(0,10) < year.substring(0,10));
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
            latitude: filter?d[14]:-90,
            longitude: filter?d[15]:-180
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
      dot.append("title").text(function(d) { return "ID:"+d.id+" Date:"+d.date.substring(0,10) ; })
      $(".dot").tipsy({ gravity: 's', });

      // Tweens the entire chart by first tweening the year, and then the data.
      // For the interpolated data, the dots and label are redrawn.
      function tweenYear() {
        var year = d3.interpolateNumber(2012, 2017);
        return function(t) { displayYear(year(t)); };
      }

      // Updates the display to show the specified year.
      function displayYear(year) {
        var date = year.toString().substring(0, 10);
        var hour = year.toString().substring(11, 19);
        dot.data(interpolateData(date)).call(position).sort(order);
        label.text(date+" "+hour);
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
          showBy = this.value;
          dot.style("fill", function(d) {
          return colorScale(color(d));
          });

          data_group = d3.nest()
          .key(function(d) {
            if (showBy==attribute_options[0])  return d[32];
            if (showBy==attribute_options[1])  return d[33];
            if (showBy==attribute_options[2])  return d[41];
            if (showBy==attribute_options[3])  return d[34];
            if (showBy==attribute_options[4])  return d[10];
            if (showBy==attribute_options[5])  return d[16];
            if (showBy==attribute_options[6])  return d[17];
            if (showBy==attribute_options[7])  return d[18];
            if (showBy==attribute_options[8])  return d[19];
            if (showBy==attribute_options[9])  return d[20];
            if (showBy==attribute_options[10]) return d[22];
            if (showBy==attribute_options[11]) return d[24];
            if (showBy==attribute_options[12]) return d[27];
            if (showBy==attribute_options[13]) return d[29];
            if (showBy==attribute_options[14]) return d[36];
            if (showBy==attribute_options[15]) return d[37];})
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
            height: 12
          }).style("fill", function(d,i) { return colorScale(d); });

          legend_labels.remove();
          legend_labels = svg.selectAll("legend")
          .data(distinct_values)
          .enter().append("text")
          .attr({
            x: function(d, i) { return (400 + i*80); },
            y: height-425,
            class: "legend label"
          })
          .text(function(d) { return d; })
          call("wrap", 5);

      });

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
