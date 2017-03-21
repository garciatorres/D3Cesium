/*global sharedObject, d3*/

(function() {
    "use strict";
    var yearPerSec = 864000;
    var gregorianDate = new Cesium.GregorianDate();
    var cartesian3Scratch = new Cesium.Cartesian3();

    var TrafficDataSource = function() {
        // private declarations
        this._name = "Traffic violations";
        this._entityCollection = new Cesium.EntityCollection();
        this._clock = new Cesium.DataSourceClock();
        this._clock.startTime = Cesium.JulianDate.fromIso8601("2012-01-02");
        this._clock.stopTime = Cesium.JulianDate.fromIso8601("2017-01-02");
        this._clock.currentTime = Cesium.JulianDate.fromIso8601("2012-01-02");
        this._clock.clockRange = Cesium.ClockRange.LOOP_STOP;
        this._clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
        this._clock.multiplier = yearPerSec * 5;
        this._changed = new Cesium.Event();
        this._error = new Cesium.Event();
        this._isLoading = false;
        this._loading = new Cesium.Event();
        this._date = this._clock.currentTime;
        this._year = 2012;
        this._wealthScale = d3.scale.log().domain([300, 1e5]).range([0, 10000000.0]);
        this._healthScale = d3.scale.linear().domain([10, 85]).range([0, 10000000.0]);
        this._populationScale = d3.scale.sqrt().domain([0, 5e8]).range([5.0, 30.0]);
        this._colorScale = d3.scale.category20c();
        this._selectedEntity = undefined;
    };

    Object.defineProperties(TrafficDataSource.prototype, {
        name : {
            get : function() {
                return this._name;
            }
        },
        clock : {
            get : function() {
                return this._clock;
            }
        },
        entities : {
            get : function() {
                return this._entityCollection;
            }
        },
        selectedEntity : {
            get : function() {
                return this._selectedEntity;
            },
            set : function(e) {
                if (Cesium.defined(this._selectedEntity)) {
                    var entity = this._selectedEntity;
                    entity.point.material.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString(this._colorScale(entity.type)));
                }
                if (Cesium.defined(e)) {
				            	e.point.material.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#00ff00'));
                }
                this._selectedEntity = e;
            }
        },
        /**
         * Gets a value indicating if the data source is currently loading data.
         * @memberof TrafficDataSource.prototype
         * @type {Boolean}
         */
        isLoading : {
            get : function() {
                return this._isLoading;
            }
        },
        /**
         * Gets an event that will be raised when the underlying data changes.
         * @memberof TrafficDataSource.prototype
         * @type {Event}
         */
        changedEvent : {
            get : function() {
                return this._changed;
            }
        },
        /**
         * Gets an event that will be raised if an error is encountered during
         * processing.
         * @memberof TrafficDataSource.prototype
         * @type {Event}
         */
        errorEvent : {
            get : function() {
                return this._error;
            }
        },
        /**
         * Gets an event that will be raised when the data source either starts or
         * stops loading.
         * @memberof HealthAndWealthDataSource.prototype
         * @type {Event}
         */
        loadingEvent : {
            get : function() {
                return this._loading;
            }
        }
    });

    TrafficDataSource.prototype.loadUrl = function(url) {
        if (!Cesium.defined(url)) {
            throw new Cesium.DeveloperError("url must be defined.");
        }

        var that = this;
        return Cesium.when(Cesium.loadJson(url), function(json) {
            return that.load(json);
        }).otherwise(function(error) {
            this._setLoading(false);
            that._error.raiseEvent(that, error);
            return Cesium.when.reject(error);
        });
    };

    TrafficDataSource.prototype.load = function(data) {
        if (!Cesium.defined(data)) {
            throw new Cesium.DeveloperError("data must be defined.");
        }
        var ellipsoid = viewer.scene.globe.ellipsoid;

        this._setLoading(true);
        var entities = this._entityCollection;
        //It's a good idea to suspend events when making changes to a
        //large amount of entities.  This will cause events to be batched up
        //into the minimal amount of function calls and all take place at the
        //end of processing (when resumeEvents is called).
        entities.suspendEvents();
        entities.removeAll();

        // for each violation defined in traffic.json, create a circle at that lat, lon
        for (var i = 0; i < data.data.length; i++){
            var violation = data.data[i];
            var surfacePosition = Cesium.Cartesian3.fromDegrees(violation[15], violation[14], 0.0);

            // Construct Wealth related Properties
            var instance = new Cesium.SampledPositionProperty();
            var longitude = new Cesium.SampledProperty(Number);
            var latitude = new Cesium.SampledProperty(Number);
            var heightPosition = Cesium.Cartesian3.fromDegrees(violation[15], violation[14], 0.0, ellipsoid, cartesian3Scratch);

//          instance.addSample(Cesium.JulianDate.fromIso8601("2012"), heightPosition);
            instance.addSample(Cesium.JulianDate.fromIso8601(violation[8]), heightPosition);
            instance.addSample(Cesium.JulianDate.fromIso8601("2017"), heightPosition);
            latitude.addSample(Cesium.JulianDate.fromIso8601(violation[8]), violation[14]);
            longitude.addSample(Cesium.JulianDate.fromIso8601(violation[8]), violation[15]);
            instance.addSample(Cesium.JulianDate.fromIso8601(violation[8]), surfacePosition);

            var entity = new Cesium.Entity(violation[0]);

            // Add data properties to entity
            entity.addProperty('vid');
            entity.vid = violation[0];
            entity.addProperty('type');
            entity.type = violation[32];
            entity.addProperty('date');
            entity.date = violation[8];
            entity.addProperty('time');
            entity.time = violation[9];
            entity.addProperty('lat');
            entity.lat = latitude;
            entity.addProperty('lon');
            entity.lon = longitude;

            // if we wanted to use points instead ...
            entity.position = instance;
            entity.point = new Cesium.PointGraphics();
            entity.point.pixelSize = new Cesium.ConstantProperty(10);
            entity.point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString(this._colorScale(violation[32])));
            entity.point.outlineColor = new Cesium.ConstantProperty(new Cesium.Color(0.0, 0.0, 0.0, 1.0));
            entity.point.outlineWidth = new Cesium.ConstantProperty(3);
            entity.point.show = new Cesium.ConstantProperty(true);
            //Add the entity to the collection.
            entities.add(entity);
        }

        //Once all data is processed, call resumeEvents and raise the changed event.
        entities.resumeEvents();
        this._changed.raiseEvent(this);
        this._setLoading(false);
    };

    TrafficDataSource.prototype._setLoading = function(isLoading) {
        if (this._isLoading !== isLoading) {
            this._isLoading = isLoading;
            this._loading.raiseEvent(this, isLoading);
        }
    };

    TrafficDataSource.prototype._setInfoDialog = function(time) {
        if (Cesium.defined(this._selectedEntity)) {
            var vid = this._selectedEntity.vid;
            var date = this._selectedEntity.date;
            var time = this._selectedEntity.time;
            var type = this._selectedEntity.type;
            $("#info table").remove();
            $("#info").append("<table> \
            <tr><td>Date:</td><td>" +date+"</td></tr>\
            <tr><td>Time:</td><td>" +time+"</td></tr>\
            <tr><td>Type of stop:</td><td>" +type+"</td></tr>\
            </table>\
            ");
            $("#info table").css("font-size", "10px");
            $("#info").dialog({
                title : this._selectedEntity.id,
                width: 200,
                height: 150,
                modal: false,
                position: {my: "right center", at: "right center", of: "canvas"},
                show: "slow",
                beforeClose: function(event, ui) {
                    $("#info").data("dataSource").selectedEntity = undefined;
                }
            });
            $("#info").data("dataSource", this);
        }
    };

    TrafficDataSource.prototype.update = function(time) {
        Cesium.JulianDate.toGregorianDate(time, gregorianDate);
        var currentYear = gregorianDate.year + gregorianDate.month / 12;
        if (currentYear !== this._year && typeof window.displayYear !== 'undefined'){
            window.displayYear(time);
            this._year = currentYear;
            this._setInfoDialog(time);
        }
        return true;
    };

    $("#radio").buttonset();
    $("#radio").css("font-size", "12px");
    $("#radio").css("font-size", "12px");
    $("body").css("background-color", "black");

    $("input[name='healthwealth']").change(function(d){
        var entities = healthAndWealth.entities.entities;
        healthAndWealth.entities.suspendEvents();
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (d.target.id === 'health') {
                entity.polyline.positions = new Cesium.PositionPropertyArray([new Cesium.ConstantPositionProperty(entity.surfacePosition), entity.health]);
            } else {
                entity.polyline.positions = new Cesium.PositionPropertyArray([new Cesium.ConstantPositionProperty(entity.surfacePosition), entity.wealth]);
            }
        }
        healthAndWealth.entities.resumeEvents();
    });

    var viewer = new Cesium.Viewer('cesiumContainer',
            {
                fullscreenElement : document.body,
                infoBox : false
            });

    var stamenTonerImagery = viewer.baseLayerPicker.viewModel.imageryProviderViewModels[8];
    viewer.baseLayerPicker.viewModel.selectedImagery = stamenTonerImagery;

    // setup clockview model
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.startTime = Cesium.JulianDate.fromIso8601("2012-01-02");
    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601("2012-01-02");
    viewer.clock.stopTime = Cesium.JulianDate.fromIso8601("2017-01-02");
    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    viewer.clock.multiplier = yearPerSec * 5;
    viewer.animation.viewModel.setShuttleRingTicks([yearPerSec, yearPerSec*5, yearPerSec*10, yearPerSec*50]);

    viewer.animation.viewModel.dateFormatter = function(date, viewModel) {
        Cesium.JulianDate.toGregorianDate(date, gregorianDate);
        return 'Date: ' + gregorianDate.year + '.' + gregorianDate.month + '.' + gregorianDate.day;
    };
    viewer.animation.viewModel.timeFormatter = function(date, viewModel) {
        return '';
    };
    viewer.scene.skyBox.show = true;
    viewer.scene.sun.show = true;
    viewer.scene.moon.show = true;

    viewer.scene.morphToColumbusView(5.0)

    var traffic = new TrafficDataSource();

    traffic.loadUrl('traffic.json');
    viewer.dataSources.add(traffic);

    // If the mouse is over the billboard, change its scale and color
    var highlightBarHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    highlightBarHandler.setInputAction(
        function (movement) {
            var pickedObject = viewer.scene.pick(movement.endPosition);
            if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
                if (Cesium.defined(pickedObject.id.nationData)) {
                    sharedObject.dispatch.nationMouseover(pickedObject.id.nationData, pickedObject);
                    healthAndWealth.selectedEntity = pickedObject.id;
                }
            }
        },
        Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );

    var flyToHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    flyToHandler.setInputAction(
        function (movement) {
            var pickedObject = viewer.scene.pick(movement.position);
            if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
                sharedObject.flyTo(pickedObject.id);
//                sharedObject.flyTo(pickedObject.id.nationData);
            }
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK
    );

    // Response to a violation's mouseover event
    sharedObject.dispatch.on("nationMouseover.cesium", function(violationObject) {
        $("#info table").remove();
        $("#info").append("<table> \
        <tr><td>Date:</td><td>" +violationObject.date.substring(0,10)+"</td></tr>\
        <tr><td>Time:</td><td>" +violationObject.time+"</td></tr>\
        <tr><td>Type:</td><td>" +violationObject.type+"</td></tr>\
        <tr><td>Charge:</td><td>" +violationObject.charge+"</td></tr>\
        <tr><td>Arrest:</td><td>" +violationObject.arrest+"</td></tr>\
        <tr><td>Article:</td><td>" +violationObject.article+"</td></tr>\
        <tr><td>Agency:</td><td>" +violationObject.agency+"</td></tr>\
        <tr><td>Description:</td><td>" +violationObject.description+"</td></tr>\
        <tr><td>Location:</td><td>" +violationObject.location+"</td></tr>\
        <tr><td>Accident:</td><td>" +violationObject.accident+"</td></tr>\
        <tr><td>Belt (use of):</td><td>" +violationObject.belt+"</td></tr>\
        <tr><td>Injuries:</td><td>" +violationObject.injury+"</td></tr>\
        <tr><td>Damage:</td><td>" +violationObject.damage+"</td></tr>\
        <tr><td>Fatal:</td><td>" +violationObject.fatal+"</td></tr>\
        <tr><td>Haz.Materials:</td><td>" +violationObject.hazmat+"</td></tr>\
        <tr><td>Alcohol:</td><td>" +violationObject.alcohol+"</td></tr>\
        <tr><td>Vechicle:</td><td>" +violationObject.vehicle+"</td></tr>\
        <tr><td>Year:</td><td>" +violationObject.year+"</td></tr>\
        <tr><td>Make:</td><td>" +violationObject.make+"</td></tr>\
        <tr><td>Model:</td><td>" +violationObject.model+"</td></tr>\
        <tr><td>Color:</td><td>" +violationObject.color+"</td></tr>\
        <tr><td>Driver's city:</td><td>" +violationObject.city+"</td></tr>\
        <tr><td>Driver's state:</td><td>" +violationObject.state+"</td></tr>\
        <tr><td>Race:</td><td>" +violationObject.race+"</td></tr>\
        <tr><td>Gender:</td><td>" +violationObject.gender+"</td></tr>\
        </table>\
        ");
        $("#info table").css("font-size", "14px");
        $("#info").dialog({
            title : "Violation N."+violationObject.id,
            width: 400,
            height: 575,
            modal: false,
            position: {my: "right center", at: "right center", of: "canvas"},
            show: "slow"
        });
      });


    // define functionality for flying to a violation
    // this callback is triggered when a violation is clicked
    sharedObject.flyTo = function(violationData) {
        var ellipsoid = viewer.scene.globe.ellipsoid;
        var destination = Cesium.Cartographic.fromDegrees(violationData.longitude, violationData.latitude, 1000.0);
        var destCartesian = ellipsoid.cartographicToCartesian(destination);
        destination = ellipsoid.cartesianToCartographic(destCartesian);

        // only fly there if it is not the camera's current position
        if (!ellipsoid
                   .cartographicToCartesian(destination)
                   .equalsEpsilon(viewer.scene.camera.positionWC, Cesium.Math.EPSILON6)) {

            viewer.scene.camera.flyTo({
                destination: destCartesian,
                duration: 4.0
            });
        }
    };

})();
