// TODO: the "color patches" should be threejs canvas themselves
// TODO: should be able to toggle between 1:1:1 aspect ratio and the actual aspect ratio
// TODO: use pretty scales (1, 2, 5, 10 ticks) used in ggplot2, drawing gray lines is good enough
// TODO: should be able to specify a label layer
// TODO: change the "show_datum" to use clicking instead of hovering to select point. add asterisk marking the selected point
// TODO: change the base to something like http://threejs.org/examples/#webgl_geometry_spline_editor, exept it's infinitely large and there's fog
// TODO: add drop shadow to the base, looks great
// TODO: Temporal Anti-Aliasing (TAA), maybe for lines in the future
// TODO: adopt/modify the offical library for canvas material: http://threejs.org/examples/#canvas_interactive_particles


var COLOR_PALETTE = ['#01a0e4','#db2d20','#01a252','#a16a94','#222222','#b5e4f4'];
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45;
var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
var NEAR = 0.1;
var FAR = 20000;
var SPRITE_SIZE = 128;
var RAW_DF, MAPPING;

var OPTIONS = {
  datumInfo: false
};

var container, scene, camera, renderer, orbit, stats, mousestate, points, scale;

var datumDisplay = document.getElementById('datum-display');
var legendDiv = document.getElementById('legend');
var datumButton = document.getElementById('datum-button');
var resetCameraButton = document.getElementById('reset-camera-button');

function getJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("get", url, true);
  xhr.responseType = "json";
  xhr.onload = function() {
    var status = xhr.status;
    if (status == 200) {
      callback(null, xhr.response);
    } else {
      callback(status);
    }
  };
  xhr.send();
}

getJSON('query.json', function(err, p) {
  if (err != null) {
  } else {
    RAW_DF = p.data;
    MAPPING = p.mapping;
    plot();
  }
});

function plot() {
  points = [];
  selecteObj = null;

  var keyboard = new THREEx.KeyboardState();

  var discTxtr = new THREE.TextureLoader().load('textures/disc.png');

  //------------------------- Remap AES -------------------------//

  function normalize11(a, scale, offset) {
    scale = scale || 1;
    offset = offset || 0;
    var i = Math.min.apply(null, a);
    var x = Math.max.apply(null, a);
    return a.map(function(k){return ((k-i)/(x-i)*2-1)*scale + offset});
  }

  function convertFactorsToColors(fs) {
    //       . materials = [ red, blue, blue, red, ... ]
    // scale           
    //       . mapping = { 1: { color: "red",  material: red,  indices: [0,1,4,...], legend: <red_leg> },
    //                     2: { color: "blue", material: blue, indices: [2,3,5,...], legend: <blue_leg> } }
    var materials = [];
    var mapping = {};

    for (var i in fs) {
      var f = fs[i].toString();
      if (f in mapping) {
        materials.push(mapping[f].material);
        mapping[f].indices.push(i);
      } else {
        var color = COLOR_PALETTE[Object.keys(mapping).length];
        var material = new THREE.SpriteMaterial( { map: discTxtr, color: new THREE.Color(color), fog: true } );

        var item = document.createElement('div');
        item.classList.add('item');
        item.innerHTML = '<span class="color-patch" style="background-color: ' + color + '"></span>' + f;
        let ii = f;
        item.addEventListener('mouseover', function(e){highlightGroup(ii)});
        item.addEventListener('mouseout', function(e){resetHighlightGroup(ii)});

        mapping[f] = { color: color, material: material, legendItem: item, indices: [i]};
        materials.push(mapping[f].material);
      }
    }
    return { materials: materials, mapping: mapping };
  }

  var AES_DF = {};
  AES_DF.x = normalize11(RAW_DF[MAPPING.x], 100);
  AES_DF.y = normalize11(RAW_DF[MAPPING.y], 100);
  AES_DF.z = normalize11(RAW_DF[MAPPING.z], 100, 100);
  if ('colour' in MAPPING) {
    scale = convertFactorsToColors(RAW_DF[MAPPING.colour]);
    console.log(scale);
    AES_DF.material = scale.materials;
    drawLegend(scale, MAPPING.colour, 'color_discrete');
  }

  function drawLegend(scale, legendTitle, type) {
    var colorLegend = document.createElement('div');
    var mapping = scale.mapping;

    colorLegend.innerHTML = '<h2>' + legendTitle + '</h2>';
    for (var i in mapping) {
      colorLegend.appendChild(mapping[i].legendItem);
    }
    legendDiv.appendChild(colorLegend);
  }

  function highlightGroup(g) {
    for (var i in scale.mapping) {
      if (i != g) {
        scale.mapping[i].material.opacity = 0.3;
        scale.mapping[i].legendItem.classList.add('dimmed');
      }
    }
  }

  function resetHighlightGroup(g) {
    for (var i in scale.mapping) {
      scale.mapping[i].material.opacity = 1;
      scale.mapping[i].legendItem.classList.remove('dimmed');
    }
  }

  //------------------------ Handle events ----------------------//
  
  datumButton.addEventListener('click', function(e) {
    OPTIONS.datumInfo = !OPTIONS.datumInfo;
    datumDisplay.hidden = !OPTIONS.datumInfo;
    if (OPTIONS.datumInfo) {
      datumButton.classList.add('activated');
    } else {
      datumButton.classList.remove('activated');
    }
  });

  resetCameraButton.addEventListener('click', function(e) {
    orbit.reset();
  });

  document.body.addEventListener('keypress', function(e) {
    switch (e.key) {
      case 'p':
        stats.domElement.hidden = !stats.domElement.hidden;
        break;
      default:
        break;
    }
  });

  init();
  animate();

  //-------------------------------------------------------------//

  function mkDisc(color) {
    var disc = document.createElement('canvas');
        disc.width = 128;
        disc.height = 128;
    var discCtx = disc.getContext('2d');
        discCtx.beginPath();
        discCtx.arc(SPRITE_SIZE / 2, SPRITE_SIZE / 2, SPRITE_SIZE * 0.45, 0, 2 * Math.PI, false);
        discCtx.fillStyle = color;
        discCtx.fill();
    return disc;
  }

  function init() {
    scene = new THREE.Scene();

    scene.fog = new THREE.Fog(0xffffff, 300, 700);
    //scene.fog.color.setHSL( 0.51, 0.6, 0.6 );

    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
    camera.position.set( 165, 120, 371 );
    scene.add( camera );

    renderer = new THREE.WebGLRenderer( { antialias:true } );
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.setClearColor(0xffffff, 1);

    container = document.getElementById( 'plot-container' );
    container.appendChild( renderer.domElement );

    THREEx.WindowResize(renderer, camera);

    orbit = new THREE.OrbitControls( camera, renderer.domElement, new THREE.Vector3(0,100,0));
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.4;
    orbit.update();

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    stats.domElement.hidden = true;
    container.appendChild( stats.domElement );

    var floorMtrl = new THREE.LineBasicMaterial( { color: 0x000000 });
    var floorGtry = new THREE.Geometry();
        floorGtry.vertices.push(new THREE.Vector3( -100, 0, -100));
        floorGtry.vertices.push(new THREE.Vector3(  100, 0, -100));
        floorGtry.vertices.push(new THREE.Vector3(  100, 0,  100));
        floorGtry.vertices.push(new THREE.Vector3( -100, 0,  100));
        floorGtry.vertices.push(new THREE.Vector3( -100, 0, -100));
    var floorLine = new THREE.Line(floorGtry, floorMtrl);
    scene.add(floorLine);

    // Sprites
    
    for (var i in AES_DF.x) {
      var x = AES_DF.x[i];
      var y = AES_DF.y[i];
      var z = AES_DF.z[i];
      var material = AES_DF.material[i];

      var datum = {};
      for (var prop in RAW_DF) {
        datum[prop] = RAW_DF[prop][i];
      }

      var discSprt = new THREE.Sprite( material );
      discSprt.position.set( x, z, y );
      discSprt.scale.set( 5, 5, 1 );
      discSprt.datum = datum;
      scene.add( discSprt );

      points.push(discSprt);
    }

    mousestate = new LIB.MouseState(document, camera, points);

  }

  function animate() 
  {
    requestAnimationFrame( animate );
    render();   
    update();
  }

  function update()
  {
    if ( keyboard.pressed("z") ) 
    { 
      //...
    }

    orbit.update();
    if (OPTIONS.datumInfo) {
      mousestate.detectHovering(
        function(obj) {
          if (OPTIONS.datumInfo) {
            var outputs = [];
            for (var prop in obj.datum) {
              outputs.push(prop + ' = ' + obj.datum[prop]);
            }
            datumDisplay.innerText = outputs.join('\n');
          }
        },

        function(obj) {
          //datumDisplay.innerText = '';
        }
      );
    }
    stats.update();
  }

  function render() 
  {
    renderer.render( scene, camera );
  }
}
