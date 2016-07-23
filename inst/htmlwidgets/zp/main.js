// TODO: http://www.htmlwidgets.org/
// TODO: double click should add a label following that dot, using the "label" aes
// TODO: change the interation on the legend items from hovering to clicking
// TODO: add "orthogonal views"
// TODO: add "multiple coordinates" functionality (e.g., for PCA and MDS), and maybe multiple scales as well
// TODO: use "BufferGeometry" and "PointMaterial" to render points. aspect ratio toggle can be changed accordingly
// TODO: iframe is not going to work. try generate and serve the html dynamically, with a template html file and embed JSON
// TODO: the "color patches" should be threejs canvas themselves
// TODO: use pretty scales (1, 2, 5, 10 ticks) used in ggplot2, drawing gray lines is good enough 
// TODO: add **instant type** search functionality, very useful when the dots are overwhelmingly many
// TODO: implement continuous scale
// TODO: should be able to specify a label layer
// TODO: change the base to something like http://threejs.org/examples/#webgl_geometry_spline_editor, exept it's infinitely large and there's fog
// TODO: add drop shadow to the base, looks great
// TODO: Temporal Anti-Aliasing (TAA), maybe for lines in the future
// TODO: adopt/modify the offical library for canvas material: http://threejs.org/examples/#canvas_interactive_particles


ZP = {};

ZP.ZP = function(el, width, height) {

}

ZP.plot = function(data, mapping) {

}

var GGPLOT3 = GGPLOT3 || {};

GGPLOT3.ASPECT_STATE = { NONE: 0, TRANSITIONING: 1 };

var COLOR_PALETTE = ['#01a0e4','#db2d20','#01a252','#a16a94','#555555','#b5e4f4'];
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45;
var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
var NEAR = 0.1;
var FAR = 20000;
var SPRITE_SIZE = 128;
var RAW_DF, MAPPING, AES_DF;

this._aspect_state = GGPLOT3.ASPECT_STATE.NONE;
this._aspect_original = false;

this._scene;
this._scene_overlay;
this._camera;
this._renderer;
this._orbit;
this._stats;
this._points;
this._selectedObj;
this._floor;
this._crosshairs;

var container = document.getElementById( 'plot-container' );
var datumDisplay = document.getElementById('datum-display');
var legendDiv = document.getElementById('legend');
var resetCameraButton = document.getElementById('reset-camera-button');
var toggleAspectButton = document.getElementById('toggle-aspect-button');


var _mouse;
var _raycaster;

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

function drawLegendDiscrete(aes) {
  var scale = aes.scale;
  var legendTitle = MAPPING.colour;
  var colorLegend = document.createElement('div');
  var mapping = scale.mapping;

  colorLegend.innerHTML = '<h2>' + legendTitle + '</h2>';
  for (var i in mapping) {
    colorLegend.appendChild(mapping[i].legendItem);
  }
  return colorLegend;
}


var discTxtr = new THREE.TextureLoader().load('textures/disc.png');

function highlightGroup(g) {
  var m = AES_DF.scale.mapping;
  for (var i in m) {
    if (i != g) {
      m[i].material.opacity = 0.1;
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


GGPLOT3.ASPECT = { EQUAL: 0, ORIGINAL: 1 };

GGPLOT3.Aes = function(raw, mapping, aspect) {
  this.index = range0(raw[mapping.x].length);
  // note the axes are rotated for the gl space
  this.z = raw[mapping.x];
  this.x = raw[mapping.y];
  this.y = raw[mapping.z];

  this.xMax = Math.max.apply(null, this.x);
  this.xMin = Math.min.apply(null, this.x);
  this.xRange = this.xMax - this.xMin;
  this.yMax = Math.max.apply(null, this.y);
  this.yMin = Math.min.apply(null, this.y);
  this.yRange = this.yMax - this.yMin;
  this.zMax = Math.max.apply(null, this.z);
  this.zMin = Math.min.apply(null, this.z);
  this.zRange = this.zMax - this.zMin;

  this.raw = raw;
  this.mapping = mapping;
  var aspect = aspect || GGPLOT3.ASPECT.EQUAL;
  this.changeAspectTo(aspect);
  this.legend = null;

  if ('colour' in mapping) {
    this.scale = convertFactorsToColors(raw[mapping.colour]);
    this.material = this.scale.materials;
    this.legend = drawLegendDiscrete(this);
    legendDiv.appendChild(this.legend);
  } else {
    let material = new THREE.SpriteMaterial( { map: discTxtr, color: new THREE.Color(COLOR_PALETTE[0]), fog: true } );
    this.material = this.index.map(function(){return material});
  }
}

GGPLOT3.Aes.prototype.changeAspectTo = function(aspect) {
  if (!aspect || aspect == GGPLOT3.ASPECT.EQUAL) {
    this.changeAspectToXYZ(100, 100, 100);
  } else if (aspect == GGPLOT3.ASPECT.ORIGINAL) {
    let rx = this.xRange;
    let ry = this.yRange;
    let rz = this.zRange;
    let coef = 100 / Math.cbrt(rx * ry * rz);
    this.changeAspectToXYZ(coef * rx, coef * ry, coef * rz);
  }
}

GGPLOT3.Aes.prototype.changeAspectToXYZ = function(xx, yy, zz) {
  this.x = normalize11(this.x, xx);
  this.y = normalize11(this.y, yy);
  this.z = normalize11(this.z, zz);
}

function syncGeometryWithAes() {
  var _this = this;

  // animate the this._points
  for (var i in this._points) {
    let ii = i;
    let a = {
      x: this._points[ii].position.x,
      y: this._points[ii].position.y,
      z: this._points[ii].position.z
    };
    let b = {
      x: AES_DF.x[ii],
      y: AES_DF.y[ii],
      z: AES_DF.z[ii]
    };

    (new TWEEN.Tween(a)).to(b, 250).easing(TWEEN.Easing.Exponential.Out)
      .onUpdate(function(){ this._points[ii].position.set(this.x, this.y, this.z); })
      .start();

    // animate the crosshairs
    if (this._points[ii] === this._selectedObj) {
      (new TWEEN.Tween(a)).to(b, 250).easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(function(){
          _this._crosshairs.position.set(this.x, this.y, this.z);
        })
        .start();
    }
  }


  // animate the this.floor
  var newFloorVertices = [
    { x: AES_DF.x.lo, y: AES_DF.y.lo, z: AES_DF.z.lo },
    { x: AES_DF.x.hi, y: AES_DF.y.lo, z: AES_DF.z.lo },
    { x: AES_DF.x.hi, y: AES_DF.y.lo, z: AES_DF.z.hi },
    { x: AES_DF.x.lo, y: AES_DF.y.lo, z: AES_DF.z.hi },
    { x: AES_DF.x.lo, y: AES_DF.y.lo, z: AES_DF.z.lo }
  ];

  for (var i in this._floor.geometry.vertices) {
    let ii = i;
    let a = {
      x: this._floor.geometry.vertices[ii].x,
      y: this._floor.geometry.vertices[ii].y,
      z: this._floor.geometry.vertices[ii].z
    };
    let b = newFloorVertices[ii];

    (new TWEEN.Tween(a)).to(b, 250).easing(TWEEN.Easing.Exponential.Out)
      .onUpdate(function(){
        this._floor.geometry.vertices[ii].set(this.x, this.y, this.z);
        this._floor.geometry.verticesNeedUpdate = true;
      })
      .start();
  }

}

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

getJSON('example_query.json', function(err, p) {
  if (err != null) {
  } else {
    RAW_DF = p.data;
    MAPPING = p.mapping;
    plot();
  }
});

function plot() {
  var _this = this;
  this._points = [];
  _mouse = new THREE.Vector2(Infinity, Infinity);
  _raycaster = new THREE.Raycaster();
  this._selectedObj = null;


  var keyboard = new THREEx.KeyboardState();


  //------------------------- Remap AES -------------------------//

  AES_DF = new GGPLOT3.Aes(RAW_DF, MAPPING);

  //------------------------ Handle events ----------------------//

  
  resetCameraButton.addEventListener('click', function(e) {
    this._orbit.reset();
  });

  toggleAspectButton.addEventListener('click', function(e) {
    if (this._aspect_original) {
      AES_DF.changeAspectTo(GGPLOT3.ASPECT.EQUAL);
      toggleAspectButton.classList.remove('activated');
      this._aspect_original = false;
    } else {
      AES_DF.changeAspectTo(GGPLOT3.ASPECT.ORIGINAL);
      toggleAspectButton.classList.add('activated');
      this._aspect_original = true;
    }
    syncGeometryWithAes();
  });

  document.body.addEventListener('keypress', function(e) {
    switch (e.key) {
      case 'p':
        this._stats.domElement.hidden = !this._stats.domElement.hidden;
        break;
      default:
        break;
    }
  });

  //-------------------------------------------------------------//

  this._scene = new THREE.Scene();

  this._scene.fog = new THREE.Fog(0xffffff, 400, 1000);

  this._camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
  this._camera.position.set( -400, 0, -130 );
  this._scene.add( this._camera );

  this._renderer = new THREE.WebGLRenderer( { antialias:true } );
  this._renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  this._renderer.setClearColor(0xffffff, 1);
  this._renderer.autoClear = false;

  this._renderer.domElement.addEventListener('mousemove', function(e) {
    _mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    _mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
  });

  this._renderer.domElement.addEventListener('dblclick', function(e) {
    _raycaster.setFromCamera( _mouse, this._camera );
    var intersects = _raycaster.intersectObjects( this._points );
    if (intersects.length > 0) {
      if (intersects[0].object != this._selectedObj) {
        this._selectedObj = intersects[0].object;
        var outputs = [];
        for (var prop in this._selectedObj.datum) {
          outputs.push(prop + ' = ' + this._selectedObj.datum[prop]);
        }
        datumDisplay.innerText = outputs.join('\n');
        _this._crosshairs.position.copy(this._selectedObj.position);
        _this._crosshairs.visible = true;
      }
    } else {
      _this._selectedObj = null;
      datumDisplay.innerText = '';
      _this._crosshairs.visible = false;
    }
  });

  container.appendChild( this._renderer.domElement );

  THREEx.WindowResize(this._renderer, this._camera);

  this._orbit = new THREE.OrbitControls( this._camera, this._renderer.domElement, new THREE.Vector3(0,0,0));
  this._orbit.enableDamping = true;
  this._orbit.dampingFactor = 0.4;
  this._orbit.update();

  this._stats = new Stats();
  this._stats.domElement.style.position = 'absolute';
  this._stats.domElement.style.bottom = '0px';
  this._stats.domElement.style.zIndex = 100;
  this._stats.domElement.hidden = true;
  container.appendChild( this._stats.domElement );

  var floorMtrl = new THREE.LineBasicMaterial( { color: 0x777777 });
  var floorGtry = new THREE.Geometry();
      floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.lo, AES_DF.y.lo, AES_DF.z.lo));
      floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.hi, AES_DF.y.lo, AES_DF.z.lo));
      floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.hi, AES_DF.y.lo, AES_DF.z.hi));
      floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.lo, AES_DF.y.lo, AES_DF.z.hi));
      floorGtry.vertices.push(new THREE.Vector3( AES_DF.x.lo, AES_DF.y.lo, AES_DF.z.lo));
  this._floor = new THREE.Line(floorGtry, floorMtrl);
  this._scene.add(this._floor);

  // Sprites
  
  for (var i in AES_DF.index) {
    var x = AES_DF.x[i];
    var y = AES_DF.y[i];
    var z = AES_DF.z[i];
    var material = AES_DF.material[i];

    var datum = {};
    // note that _index is 1-based
    datum._index = parseInt(i)+1;
    for (var prop in RAW_DF) {
      datum[prop] = RAW_DF[prop][i];
    }

    var discSprt = new THREE.Sprite( material );
    discSprt.position.set( x, y, z );
    discSprt.scale.set( 5, 5, 1 );
    discSprt.datum = datum;
    this._scene.add( discSprt );

    this._points.push(discSprt);
  }

  // overlay scene

  this._scene_overlay = new THREE.Scene();

  var crosshairsTxtr = new THREE.TextureLoader().load('textures/crosshairs.png');
  var crosshairsMtrl = new THREE.SpriteMaterial({
    map: crosshairsTxtr,
    color: new THREE.Color('#000000')
  });
  this._crosshairs = new THREE.Sprite( crosshairsMtrl );
  this._crosshairs.position.set( Infinity, Infinity, Infinity );
  this._crosshairs.visible = false;
  this._crosshairs.tweenObj = { size: 10 };
  this._crosshairs.tween = new TWEEN.Tween(this._crosshairs.tweenObj)
  this._crosshairs.tween.to({ size: 14 }, 800).easing(TWEEN.Easing.Sinusoidal.InOut).repeat(Infinity).yoyo(true)
    .onUpdate(function(){ _this._crosshairs.scale.set(this.size, this.size, 1) })
    .start()
  this._scene_overlay.add( this._crosshairs );

  animate();

  function animate() {
    requestAnimationFrame( animate );
    render();   
    update();
  }

  function update() {
    TWEEN.update();
    this._orbit.update();
    this._stats.update();
  }

  function render() {
    this._renderer.clear();
    this._renderer.render( this._scene, this._camera );
    this._renderer.clearDepth();
    this._renderer.render( this._scene_overlay, this._camera );
  }
}
