/*jslint browser: true*/
/*global Tangram, gui */

(function () {
    'use strict';

    var locations = {
        'London': [51.508, -0.105, 15],
        'New York': [40.70531887544228, -74.00976419448853, 15],
        'Seattle': [47.609722, -122.333056, 15]
    };

    var map_start_location = locations['New York'];

    /*** URL parsing ***/

    // leaflet-style URL hash pattern:
    // #[zoom],[lat],[lng]
    var url_hash = window.location.hash.slice(1, window.location.hash.length).split('/');

    if (url_hash.length == 3) {
        map_start_location = [url_hash[1],url_hash[2], url_hash[0]];
        // convert from strings
        map_start_location = map_start_location.map(Number);
    }

    /*** Map ***/

    var map = L.map('map',
        {'keyboardZoomOffset': .05}
    );


    var layer = Tangram.leafletLayer({
        scene: 'styles.yaml',
        attribution: 'Map data &copy; OpenStreetMap contributors | <a href="https://github.com/tangrams/tangram" target="_blank">Source Code</a>'
    });

    window.layer = layer;
    var scene = layer.scene;
    window.scene = scene;

    map.setView(map_start_location.slice(0, 2), map_start_location[2]);

    var hash = new L.Hash(map);
    
    // Resize map to window
    function resizeMap() {
        document.getElementById('map').style.width = window.innerWidth + 'px';
        document.getElementById('map').style.height = window.innerHeight + 'px';
        map.invalidateSize(false);
    }

    window.addEventListener('resize', resizeMap);
    resizeMap();

    function Perspective() {
        scene.config.cameras.camera1.type = "perspective";
        scene.updateConfig();
    }
    function Isometric() {
        scene.config.cameras.camera1.type = "isometric";
        scene.updateConfig();
    }
    function Flat() {
        scene.config.cameras.camera1.type = "flat";
        scene.updateConfig();
    }
    // GUI options for rendering modes/effects
    var controls = {
        'Perspective' : function() {
            Perspective();
        },
        'Isometric' : function() {
            Isometric();
        },
        'Flat' : function() {
            Flat();
        },
        'focal_length' : 2,
        'axis_x' : 0,
        'axis_y' : 1,
        'axis_toggle' : false,
        'vanishing_point_x' : 0,
        'vanishing_point_y' : 0,
        'vanishing_point_toggle' : false,

    };
    var vanishing_point_mouse = false;
    var axis_mouse = false;
    // Create dat GUI
    var gui = new dat.GUI({ autoPlace: true });
    function addGUI () {
        gui.domElement.parentNode.style.zIndex = 5;
        window.gui = gui;
        var folder = gui.addFolder("Click a style:");
        folder.open(); // this just points the arrow downward
        // Styles
        gui.add(controls, 'Perspective');
        gui.add(controls, 'focal_length', 0, 5).name("focal_length").onChange(function(value) {
            if (scene.camera.type != "perspective") Perspective();
            scene.camera.focal_length = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'vanishing_point_x', -1000, 1000).name("vanishing_point x").onChange(function(value) {
            if (scene.camera.type != "perspective") Perspective();
            scene.camera.vanishing_point[0] = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'vanishing_point_y', -1000, 1000).name("vanishing_point y").onChange(function(value) {
            if (scene.camera.type != "perspective") Perspective();
            scene.camera.vanishing_point[1] = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'vanishing_point_toggle').name("mouse control").onChange(function(value) {
            if (value && scene.camera.type != "perspective") {
                Perspective();
                gui.__controllers[8].setValue(false);
            }
            vanishing_point_mouse = value;
        });
        gui.add(controls, 'Isometric');
        gui.add(controls, 'axis_x', -5, 5).name("axis x").onChange(function(value) {
            if (scene.camera.type != "isometric") Isometric();
            scene.camera.axis.x = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'axis_y', -5, 5).name("axis y").onChange(function(value) {
            if (scene.camera.type != "isometric") Isometric();
            scene.camera.axis.y = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'axis_toggle').name("mouse control").onChange(function(value) {
            if (value && scene.camera.type != "isometric") {
                Isometric();
                gui.__controllers[4].setValue(false);
            }
            axis_mouse = value;
        });
        gui.add(controls, 'Flat');
    }


    // mouse position listener

    var mouse_monitor = function(e) {
        var height = document.body.clientHeight;
        var width = document.body.clientWidth;

        var x = e.clientX;
        var y = e.clientY;
        var xpos = ((x - (width / 2)));
        var ypos = ((y - (height / 2)))*-1.;

        if (vanishing_point_mouse) {
            scene.camera.vanishing_point = [xpos,ypos];
            gui.__controllers[4].setValue(scene.camera.vanishing_point[0]);
            gui.__controllers[5].setValue(scene.camera.vanishing_point[1]);
            scene.requestRedraw();
        }
        if (axis_mouse) {
            scene.camera.axis = {x: xpos/(width/5), y: ypos/(height/5)};
            gui.__controllers[6].setValue(scene.camera.axis.x);
            gui.__controllers[7].setValue(scene.camera.axis.y);
            scene.requestRedraw();
        }
    }

    window.onload = function() {
      this.addEventListener('mousemove', mouse_monitor);
    }

    /***** Render loop *****/
    window.addEventListener('load', function () {
        // Scene initialized
        layer.on('init', function() {
            addGUI();
        });
        layer.addTo(map);

    });


}());
