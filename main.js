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
        scene: 'scene.yaml',
        attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
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

    function setCamera(type) {
        if (scene.camera.type != type) {
            scene.config.cameras.camera1.type = type;
            scene.config.lights.light1.radius = [controllerByName("radius_inner").getValue()+"px", controllerByName("radius_outer").getValue()+"px"];
            scene.config.lights.light1.attenuation = controllerByName("attenuation").getValue();
            scene.updateConfig();
            switch(type) {
                case "perspective":
                    controllerByName("axis_toggle").setValue(false);
                    scene.camera.focal_length = controllerByName("focal_length").getValue();
                    break;
                case "isometric":
                    controllerByName("vanishing_point_toggle").setValue(false);
                    break;
            }
        }
    }
    function setLight(type) {
        if (scene.lights.light1.type != type) {
            scene.config.lights.light1.type = type;
            scene.config.cameras.camera1.focal_length = controllerByName("focal_length").getValue();
            scene.config.cameras.camera1.axis = {x: controllerByName("axis_x").getValue(), y: controllerByName("axis_y").getValue()};
            scene.updateConfig();
            switch(type) {
                case "directional":
                    controllerByName("point_toggle").setValue(false);
                case "point":
                    controllerByName("direction_toggle").setValue(false);
                    scene.config.lights.light1.radius = [controllerByName("radius_inner").getValue()+"px", controllerByName("radius_outer").getValue()+"px"];
                    scene.config.lights.light1.attenuation = controllerByName("attenuation").getValue();
                    scene.updateConfig();
            }
        }
    }

    function controllerByName(which) {
        for (var i = 0; i < gui.__controllers.length; i++) {
            if (gui.__controllers[i].property == which) {
                return gui.__controllers[i];
            }
        }
    }

    // GUI options for rendering modes/effects
    var controls = {
        'Perspective' : function() {
            setCamera("perspective");
        },
        'Isometric' : function() {
            setCamera("isometric");
        },
        'Flat' : function() {
            setCamera("flat");
        },
        'focal_length' : 2,
        'axis_x' : 0,
        'axis_y' : 1,
        'axis_toggle' : false,
        'vanishing_point_x' : 0,
        'vanishing_point_y' : 0,
        'vanishing_point_toggle' : false,
        'Directional' : function() {
            setLight("directional");
        },
        'direction_x' : 0,
        'direction_y' : 1,
        'direction_z' : 0,
        'direction_toggle' : false,
        'direction_diffuse' : 1,
        'direction_ambient' : .3,
        'Point' : function() {
            setLight("point");
        },
        'point_x' : 0,
        'point_y' : 0,
        'point_z' : 50,
        'point_toggle' : false,
        'point_diffuse' : 1,
        'point_ambient' : .5,
        'attenuation' : 2,
        'radius_inner' : 100,
        'radius_outer' : 250,

    };
    var vanishing_point_mouse = false;
    var axis_mouse = false;
    var directional_mouse = false;
    var point_mouse = false;
    // Create dat GUI
    var gui = new dat.GUI({ autoPlace: true, width: 300 });
    function addGUI () {
        gui.domElement.parentNode.style.zIndex = 500;
        window.gui = gui;
        var folder = gui.addFolder("Click a style:");
        folder.open(); // this just points the arrow downward

        // CAMERAS 
        gui.add(controls, 'Perspective').name("Perspective Camera");
        gui.add(controls, 'focal_length', 0.1, 5).name("&nbsp;&nbsp;focal_length").onChange(function(value) {
            setCamera("perspective");
            scene.camera.focal_length = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'vanishing_point_x', -1000, 1000).name("&nbsp;&nbsp;vanishing_point x").onChange(function(value) {
            setCamera("perspective");
            scene.camera.vanishing_point[0] = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'vanishing_point_y', -1000, 1000).name("&nbsp;&nbsp;vanishing_point y").onChange(function(value) {
            setCamera("perspective");
            scene.camera.vanishing_point[1] = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'vanishing_point_toggle').name("&nbsp;&nbsp;mouse control").onChange(function(value) {
            if (value) {
                setCamera("perspective");
            }
            vanishing_point_mouse = value;
        });
        gui.add(controls, 'Isometric').name("Isometric Camera");
        gui.add(controls, 'axis_x', -5, 5).name("&nbsp;&nbsp;axis x").onChange(function(value) {
            setCamera("isometric");
            scene.camera.axis.x = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'axis_y', -5, 5).name("&nbsp;&nbsp;axis y").onChange(function(value) {
            setCamera("isometric");
            scene.camera.axis.y = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'axis_toggle').name("&nbsp;&nbsp;mouse control").onChange(function(value) {
            if (value) {
                setCamera("isometric");
            }
            axis_mouse = value;
        });
        gui.add(controls, 'Flat').name("Flat Camera");

        // LIGHTS
        gui.add(controls, 'Directional').name("Directional Light");
        gui.add(controls, 'direction_x', -1, 1).name("&nbsp;&nbsp;direction x").onChange(function(value) {
            setLight("directional");
            scene.lights.light1.direction[0] = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'direction_y', -1, 1).name("&nbsp;&nbsp;direction y").onChange(function(value) {
            setLight("directional");
            scene.lights.light1.direction[1] = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'direction_z', -1, 1).name("&nbsp;&nbsp;direction z").onChange(function(value) {
            setLight("directional");
            scene.lights.light1.direction[2] = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'direction_toggle').name("&nbsp;&nbsp;mouse control").onChange(function(value) {
            if (value) {
                setLight("directional");
            }
            directional_mouse = value;
        });
        gui.add(controls, 'direction_diffuse', 0, 2).name("&nbsp;&nbsp;diffuse").onChange(function(value) {
            setLight("directional");
            scene.lights.light1.diffuse = [value, value, value, 1];
            scene.requestRedraw();
        });
        gui.add(controls, 'direction_ambient', 0, 1).name("&nbsp;&nbsp;ambient").onChange(function(value) {
            setLight("directional");
            scene.lights.light1.ambient = [value, value, value, 1];
            scene.requestRedraw();
        });
        gui.add(controls, 'Point').name("Point Light");
        gui.add(controls, 'point_x', -1000, 1000).name("&nbsp;&nbsp;point x").onChange(function(value) {
            setLight("point");
            scene.lights.light1.position[0] = value+"px";
            scene.requestRedraw();
        });
        gui.add(controls, 'point_y', -1000, 1000).name("&nbsp;&nbsp;point y").onChange(function(value) {
            setLight("point");
            scene.lights.light1.position[1] = value+"px";
            scene.requestRedraw();
        });
        gui.add(controls, 'point_z', -1000, 1000).name("&nbsp;&nbsp;point z").onChange(function(value) {
            setLight("point");
            scene.lights.light1.position[2] = value+"px";
            scene.requestRedraw();
        });
        gui.add(controls, 'point_toggle').name("&nbsp;&nbsp;mouse control").onChange(function(value) {
            if (value) {
                setLight("point");
            }
            point_mouse = value;
        });
        gui.add(controls, 'point_diffuse', 0, 2).name("&nbsp;&nbsp;diffuse").onChange(function(value) {
            setLight("point");
            scene.lights.light1.diffuse = [value, value, value, 1];
            scene.requestRedraw();
        });
        gui.add(controls, 'point_ambient', 0, 1).name("&nbsp;&nbsp;ambient").onChange(function(value) {
            setLight("point");
            scene.lights.light1.ambient = [value, value, value, 1];
            scene.requestRedraw();
        });
        gui.add(controls, 'attenuation', 0, 10).name("&nbsp;&nbsp;attenuation").onChange(function(value) {
            setLight("point");
            scene.lights.light1.attenuation = value;
            scene.requestRedraw();
        });
        gui.add(controls, 'radius_inner', 0, 500).name("&nbsp;&nbsp;radius_inner").onChange(function(value) {
            setLight("point");
            scene.lights.light1.radius = [value+"px", (scene.lights.light1.radius === null) ? 0 : scene.lights.light1.radius[1]];
            scene.requestRedraw();
        });
        gui.add(controls, 'radius_outer', 0, 500).name("&nbsp;&nbsp;radius_outer").onChange(function(value) {
            setLight("point");
            scene.lights.light1.radius = [(scene.lights.light1.radius === null) ? 0 : scene.lights.light1.radius[0], value+"px"];
            scene.requestRedraw();
        });


    }


    // mouse position listener

    var mouse_monitor = function(e) {
        var height = document.body.clientHeight;
        var width = document.body.clientWidth;

        var x = e.clientX;
        var y = e.clientY;
        var xpos = ((x - (width / 2)));
        var ypos = ((y - (height / 2)))*-1.;
        var xpercent = x/width * 2. - 1.;
        var ypercent = y/height * 2. - 1.;

        if (vanishing_point_mouse) {
            scene.camera.vanishing_point = [xpos,ypos];
            gui.__controllers[2].setValue(scene.camera.vanishing_point[0]);
            gui.__controllers[3].setValue(scene.camera.vanishing_point[1]);
            scene.requestRedraw();
        }
        if (axis_mouse) {
            scene.camera.axis = {x: xpos/(width/5), y: ypos/(height/5)};
            gui.__controllers[6].setValue(scene.camera.axis.x);
            gui.__controllers[7].setValue(scene.camera.axis.y);
            scene.requestRedraw();
        }
        if (directional_mouse) {
            scene.lights.light1.direction = [xpercent,ypercent*-1,scene.lights.light1.direction[2]];
            gui.__controllers[11].setValue(scene.lights.light1.direction[0]);
            gui.__controllers[12].setValue(scene.lights.light1.direction[1]);
            scene.requestRedraw();
        }
        if (point_mouse) {
            scene.lights.light1.position = [xpos,ypos,scene.lights.light1.position[2]];
            gui.__controllers[18].setValue(scene.lights.light1.position[0]);
            gui.__controllers[19].setValue(scene.lights.light1.position[1]);
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
