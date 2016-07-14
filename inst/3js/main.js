// TODO: the "color patches" should be threejs canvas themselves
// TODO: use pretty scales (1, 2, 5, 10 ticks) used in ggplot2, drawing gray lines is good enough 
// TODO: should be able to specify a label layer
// TODO: change the "show_datum" to use clicking instead of hovering to select point. add asterisk marking the selected point
// TODO: change the base to something like http://threejs.org/examples/#webgl_geometry_spline_editor, exept it's infinitely large and there's fog
// TODO: add drop shadow to the base, looks great
// TODO: Temporal Anti-Aliasing (TAA), maybe for lines in the future
// TODO: adopt/modify the offical library for canvas material: http://threejs.org/examples/#canvas_interactive_particles

function normalize11(a, scale, offset) {
  scale = scale || 1;
  offset = offset || 0;
  var i = Math.min.apply(null, a);
  var x = Math.max.apply(null, a);
  var aa = a.map(function(k){return ((k-i)/(x-i)*2-1)*scale + offset});
  aa.lo = -scale + offset;
  aa.hi = scale + offset;
  return aa;
}

function range0(hi) {
  a = [];
  for (var i = 0; i < hi; i++) {
    a.push(i);
  }
  return a;
}

var discTxtr = new THREE.TextureLoader().load('textures/disc.png');

function highlightGroup(g) {
  var m = AES_DF.scale.mapping;
  for (var i in m) {
    if (i != g) {
      m[i].material.opacity = 0.3;
      m[i].legendItem.classList.add('dimmed');
    }
  }
}

function resetHighlightGroup(g) {
  var m = AES_DF.scale.mapping;
  for (var i in m) {
    m[i].material.opacity = 1;
    m[i].legendItem.classList.remove('dimmed');
  }
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


var GGPLOT3 = GGPLOT3 || {};

GGPLOT3.ASPECT = { EQUAL: 0, ORIGINAL: 1 };

GGPLOT3.Aes = function(raw, mapping, aspect) {
  this.index = range0(raw[mapping.x].length);
  this.x = raw[mapping.x];
  this.y = raw[mapping.y];
  this.z = raw[mapping.z];
  this.raw = raw;
  this.mapping = mapping;
  var aspect = aspect || GGPLOT3.ASPECT.EQUAL;
  this.changeAspectTo(aspect);

  if ('colour' in mapping) {
    this.scale = convertFactorsToColors(raw[mapping.colour]);
    this.material = this.scale.materials;
  }
}

GGPLOT3.Aes.prototype.changeAspectTo = function(aspect) {
  if (!aspect || aspect == GGPLOT3.ASPECT.EQUAL) {
    this.changeAspectToXYZ(100, 100, 100);
  } else if (aspect == GGPLOT3.ASPECT.ORIGINAL) {
    var rx = Math.max.apply(null, this.raw[this.mapping.x]) - Math.min.apply(null, this.raw[this.mapping.x]);
    var ry = Math.max.apply(null, this.raw[this.mapping.y]) - Math.min.apply(null, this.raw[this.mapping.y]);
    var rz = Math.max.apply(null, this.raw[this.mapping.z]) - Math.min.apply(null, this.raw[this.mapping.z]);
    var coef = 100 / Math.cbrt(rx * ry * rz);
    this.changeAspectToXYZ(coef * rx, coef * ry, coef * rz);
  }
}

GGPLOT3.Aes.prototype.changeAspectToXYZ = function(xx, yy, zz) {
  this.x = normalize11(this.x, xx);
  this.y = normalize11(this.y, yy);
  this.z = normalize11(this.z, zz);
}

function syncGeometryWithAes() {
  // animate the points
  for (var i in points) {
    let ii = i;
    let a = {
      x: points[ii].position.x,
      z: points[ii].position.y,
      y: points[ii].position.z
    };
    let b = {
      x: AES_DF.x[ii],
      y: AES_DF.y[ii],
      z: AES_DF.z[ii]
    };

    (new TWEEN.Tween(a)).to(b, 250).easing(TWEEN.Easing.Exponential.Out)
      .onUpdate(function(){ points[ii].position.set(this.x, this.z, this.y); })
      .start();
  }

  // animate the floor
  var newFloorVertices = [
    { x: AES_DF.x.lo, y: AES_DF.z.lo, z: AES_DF.y.lo },
    { x: AES_DF.x.hi, y: AES_DF.z.lo, z: AES_DF.y.lo },
    { x: AES_DF.x.hi, y: AES_DF.z.lo, z: AES_DF.y.hi },
    { x: AES_DF.x.lo, y: AES_DF.z.lo, z: AES_DF.y.hi },
    { x: AES_DF.x.lo, y: AES_DF.z.lo, z: AES_DF.y.lo }
  ];

  for (var i in floor.geometry.vertices) {
    let ii = i;
    let a = {
      x: floor.geometry.vertices[ii].x,
      y: floor.geometry.vertices[ii].y,
      z: floor.geometry.vertices[ii].z
    };
    let b = newFloorVertices[ii];

    (new TWEEN.Tween(a)).to(b, 250).easing(TWEEN.Easing.Exponential.Out)
      .onUpdate(function(){
        floor.geometry.vertices[ii].set(this.x, this.y, this.z);
        floor.geometry.verticesNeedUpdate = true;
      })
      .start();
  }
}

GGPLOT3.ASPECT_STATE = { NONE: 0, TRANSITIONING: 1 };

var COLOR_PALETTE = ['#01a0e4','#db2d20','#01a252','#a16a94','#222222','#b5e4f4'];
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45;
var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
var NEAR = 0.1;
var FAR = 20000;
var SPRITE_SIZE = 128;
var RAW_DF, MAPPING, AES_DF;
var _aspect_state = GGPLOT3.ASPECT_STATE.NONE;
var _aspect_original = false;

var OPTIONS = {
  datumInfo: false
};

var container;
var scene;
var camera;
var renderer;
var orbit;
var stats;
var mousestate;
var points;
var floor;

var datumDisplay = document.getElementById('datum-display');
var legendDiv = document.getElementById('legend');
var datumButton = document.getElementById('datum-button');
var resetCameraButton = document.getElementById('reset-camera-button');
var toggleAspectButton = document.getElementById('toggle-aspect-button');

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


  //------------------------- Remap AES -------------------------//

  AES_DF = new GGPLOT3.Aes(RAW_DF, MAPPING);
  drawLegendDiscrete(AES_DF);

  function drawLegendDiscrete(aes) {
    var scale = aes.scale;
    var legendTitle = MAPPING.colour;
    var colorLegend = document.createElement('div');
    var mapping = scale.mapping;

    colorLegend.innerHTML = '<h2>' + legendTitle + '</h2>';
    for (var i in mapping) {
      colorLegend.appendChild(mapping[i].legendItem);
    }
    legendDiv.appendChild(colorLegend);
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

  toggleAspectButton.addEventListener('click', function(e) {
    if (_aspect_original) {
      AES_DF.changeAspectTo(GGPLOT3.ASPECT.EQUAL);
      toggleAspectButton.classList.remove('activated');
      _aspect_original = false;
    } else {
      AES_DF.changeAspectTo(GGPLOT3.ASPECT.ORIGINAL);
      toggleAspectButton.classList.add('activated');
      _aspect_original = true;
    }
    syncGeometryWithAes();
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

    scene.fog = new THREE.Fog(0xffffff, 400, 1000);

    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
    camera.position.set( 165, 120, 371 );
    scene.add( camera );

    renderer = new THREE.WebGLRenderer( { antialias:true } );
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.setClearColor(0xffffff, 1);

    container = document.getElementById( 'plot-container' );
    container.appendChild( renderer.domElement );

    THREEx.WindowResize(renderer, camera);

    orbit = new THREE.OrbitControls( camera, renderer.domElement, new THREE.Vector3(0,0,0));
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
        floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.lo, AES_DF.z.lo, AES_DF.y.lo));
        floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.hi, AES_DF.z.lo, AES_DF.y.lo));
        floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.hi, AES_DF.z.lo, AES_DF.y.hi));
        floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.lo, AES_DF.z.lo, AES_DF.y.hi));
        floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.lo, AES_DF.z.lo, AES_DF.y.lo));
    floor = new THREE.Line(floorGtry, floorMtrl);
    scene.add(floor);

    // Sprites
    
    for (var i in AES_DF.index) {
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

    TWEEN.update();
    orbit.update();
    stats.update();
  }

  function render() 
  {
    renderer.render( scene, camera );
  }
}
