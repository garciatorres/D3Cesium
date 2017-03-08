/*global sharedObject, d3*/

(function() {
    "use strict";

    var polylines = [];
	var colorScale = d3.scale.category20c();
	var selectedData = "health";
	var selectedNation = 'undefined';
	var selectedViolation = 'undefined';	
	
	$("#radio").buttonset();
	$("#radio").css("font-size", "12px");
	$("#radio").css("font-size", "12px");
	$("body").css("background-color", "black");
	
	$("input[name='healthwealth']").change(function(d){
		selectedData = d.target.id;
		updateLineData();
	});

    // Load the data.
//    d3.json("nations_geo.json", function(nations) {
	  d3.json("traffic.json", function(violations) {

        var ellipsoid = viewer.scene.globe.ellipsoid;
        var primitives = viewer.scene.primitives;
        var polylineCollection = new Cesium.PolylineCollection();

        // for each nation defined in nations_geo.json, create a polyline at that lat, lon
        for (var i = 0; i < violations.data.length; i++){
            var violation = violations.data[i];
			var vlat = parseFloat(violation[14]);
			var vlon = parseFloat(violation[15]);
			
			if (isNaN(vlat) || isNaN(vlon)) continue;		
            var widePolyline = polylineCollection.add();
            widePolyline.positions = ellipsoid.cartographicArrayToCartesianArray([
                Cesium.Cartographic.fromDegrees(vlon, vlat, 0.0),
                Cesium.Cartographic.fromDegrees(vlon, vlat, 100.0)
            ]);

            // Set a polyline's width
            var outlineMaterial = Cesium.Material.fromType('PolylineOutline');
            outlineMaterial.uniforms.outlineWidth = 3000000.0;
            outlineMaterial.uniforms.outlineColor = new Cesium.Color(0.0, 0.0, 0.0, 1.0);
			//the color is the type of the violation
            outlineMaterial.uniforms.color = Cesium.Color.fromCssColorString(colorScale(violation[26]));
            widePolyline.material = outlineMaterial;
            polylines.push(widePolyline);
			}
			
        primitives.add(polylineCollection);
    });

    // called from our custom animate() function whenever the timeline advances 1 year
    // - update all polylines by resizing the polyline
    // - show jquery info window
    function updateLineData() {
        var ellipsoid = viewer.scene.globe.ellipsoid;
        var xScale = d3.scale.log().domain([300, 1e5]).range([0, 10000000.0]);
		var yScale = d3.scale.linear().domain([10, 85]).range([0, 10000000.0]);
        var widthScale = d3.scale.sqrt().domain([0, 5e8]).range([5, 30]);

        for (var i=0; i<polylines.length; i++) {
            var violation = sharedObject.dateData[i];
            var polyline = polylines[i];

/* 			if (selectedData === "health") {
				polyline.positions = ellipsoid.cartographicArrayToCartesianArray([
							   Cesium.Cartographic.fromDegrees(nation.lon, nation.lat, 0.0),
							   Cesium.Cartographic.fromDegrees(nation.lon, nation.lat, yScale(nation.lifeExpectancy))
							   ]);
			} else {
				polyline.positions = ellipsoid.cartographicArrayToCartesianArray([
							   Cesium.Cartographic.fromDegrees(nation.lon, nation.lat, 0.0),
							   Cesium.Cartographic.fromDegrees(nation.lon, nation.lat, xScale(nation.income))
							   ]);
			}
 */            
			polyline.positions = ellipsoid.cartographicArrayToCartesianArray([
			   Cesium.Cartographic.fromDegrees(parseFloat(violation[15]), parseFloat(violation[14]), 0.0),
			   Cesium.Cartographic.fromDegrees(parseFloat(violation[15]), parseFloat(violation[14]), 10000000.0)
			   ]);

//			polyline.width = widthScale(nation.population);
			polyline.width = widthScale(10000000.0);

            // push data to polyline so that we have mouseover information available
            polyline.violationData = violation;
			
			if (violation[0] === selectedViolation) {
				$("#info table").remove();
				$("#info").append("<table> \
				<tr><td>Date of the traffic violation:</td><td>" +violation[8]+"</td></tr>\
				<tr><td>Time of the traffic violation:</td><td>" +violation[9]+"</td></tr>\
				</table>\
				");
				$("#info table").css("font-size", "12px");
			}
            //polyline.material.uniforms.outlineWidth = yScale(nation.lifeExpectancy);
        }
    }

    var viewer = new Cesium.Viewer('cesiumContainer', 
    		{
    			fullscreenElement : document.body
    		});
    
	var date = new Date("2012-01-01");
    function animate() {
        var gregorianDate = viewer.clock.currentTime.toGregorianDate();
//      var currentYear = gregorianDate.year + gregorianDate.month/12;// + gregorianDate.day/31;
		var currentDate = new Date(gregorianDate.year+'-'+gregorianDate.month+'-'+gregorianDate.day);
/*      if (currentYear !== year && typeof window.displayYear !== 'undefined'){*/
		if (currentDate != date && typeof window.displayDate !== 'undefined'){	
            window.displayDate(currentDate);
			date = currentDate;
            updateLineData();
        }
    }
    
    function tick() {
        viewer.scene.initializeFrame();
        animate();
        viewer.scene.render();
        Cesium.requestAnimationFrame(tick);
    }
    tick();

    //viewer.fullscreenButton.viewModel.fullscreenElement = document.body;
    
    var stamenTonerImagery = viewer.baseLayerPicker.viewModel.imageryProviderViewModels[8];
    viewer.baseLayerPicker.viewModel.selectedImagery = stamenTonerImagery;

//  setup clockview model
//  var yearPerSec = 86400*365;
	var yearPerSec = 36000;
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.startTime = Cesium.JulianDate.fromIso8601("2012-01-02");
    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601("2012-01-02");
    viewer.clock.stopTime = Cesium.JulianDate.fromIso8601("2017-02-28");
    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    viewer.clock.multiplier = yearPerSec * 5;
    viewer.animation.viewModel.setShuttleRingTicks([yearPerSec, yearPerSec*5, yearPerSec*10, yearPerSec*50]);
	
    viewer.animation.viewModel.dateFormatter = function(date, viewModel) {
        var gregorianDate = date.toGregorianDate();
        return 'Date: ' +gregorianDate.day+'.'+gregorianDate.month+'.'+gregorianDate.year;
    };
		    
	// setup timeline
	function onTimelineScrub(e) {
		viewer.clock.currentTime = e.timeJulian;
		viewer.clock.shouldAnimate = false;
	}
	viewer.timeline.addEventListener('settime', onTimelineScrub, false);
	viewer.timeline.updateFromClock();
	viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime);	
	
	viewer.scene.morphToColumbusView();
	
	// If the mouse is over the billboard, change its scale and color
	var highlightBarHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
	highlightBarHandler.setInputAction(
		function (movement) {
			var pickedObject = viewer.scene.pick(movement.endPosition);
			if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.primitive)) {
				if (Cesium.defined(pickedObject.primitive.violationData)) {
					sharedObject.dispatch.nationMouseover(pickedObject.primitive.violationData);
				}
			}
		},
		Cesium.ScreenSpaceEventType.MOUSE_MOVE
	);
	
	var flyToHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
	flyToHandler.setInputAction(
		function (movement) {
			var pickedObject = viewer.scene.pick(movement.position);

			if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.primitive)) {
				if (Cesium.defined(pickedObject.primitive.violationData)) {
					sharedObject.flyTo(pickedObject.primitive.violationData);
				}
			}
		},
		Cesium.ScreenSpaceEventType.LEFT_CLICK
	);
	
	// Response to a nation's mouseover event
	sharedObject.dispatch.on("nationMouseover.cesium", function(violationObject) {
        for (var i=0; i<polylines.length; i++) {
			var polyline = polylines[i];
			if (polyline.violationData[0] === violationObject.id) {
				polyline.material.uniforms.color = Cesium.Color.fromCssColorString('#00ff00');
			}
			else {//#32: violation type
				polyline.material.uniforms.color = Cesium.Color.fromCssColorString(colorScale(polyline.violationData[32]));
			}
        }
		
		selectedViolation = violationObject[0];
		
		$("#info table").remove();
		$("#info").append("<table> \
		<tr><td>Date of the traffic violation:</td><td>" +violation[8]+"</td></tr>\
		<tr><td>Time of the traffic violation:</td><td>" +violation[9]+"</td></tr>\
		</table>\
		");
		$("#info table").css("font-size", "12px");
		$("#info").dialog({
			title : violationObject[0],
			width: 300,
			height: 150,
			modal: false,
			position: {my: "right center", at: "right center", of: "canvas"},
			show: "slow"
		});
      });


	// define functionality for flying to a nation
	// this callback is triggered when a nation is clicked
	var dirCartesian = new Cesium.Cartesian3();
    sharedObject.flyTo = function(d) {
		var ellipsoid = viewer.scene.globe.ellipsoid;
		
        var destination = Cesium.Cartographic.fromDegrees(d[15], d[14]-20.0, 10000000.0);
		var destCartesian = ellipsoid.cartographicToCartesian(destination);
		destination = ellipsoid.cartesianToCartographic(destCartesian);

        // only fly there if it is not the camera's current position
        if (!ellipsoid
                   .cartographicToCartesian(destination)
                   .equalsEpsilon(viewer.scene.camera.positionWC, Cesium.Math.EPSILON6)) {

            var flight = Cesium.CameraFlightPath.createAnimationCartographic(viewer.scene, {
                destination : destination
            });
            viewer.scene.animations.add(flight);
        }
    };

})();