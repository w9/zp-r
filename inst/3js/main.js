var COLOR_PALETTE = ['#db2d20','#01a0e4','#01a252','#a16a94','#222222','#b5e4f4'];
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45;
var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
var NEAR = 0.1;
var FAR = 20000;
var SPRITE_SIZE = 128;
var RAW_DF;
var MAPPINGS;

var container, scene, camera, renderer, controls, stats;

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
    MAPPINGS = p.mappings;
    plot();
  }
});


function plot() {
  var overlay = document.getElementById('overlay');

  var keyboard = new THREEx.KeyboardState();

  var square = document.createElement('canvas');
      square.width = 128;
      square.height = 128;
  var squareCtx = square.getContext('2d');
      squareCtx.beginPath();
      squareCtx.rect(SPRITE_SIZE / 2 - SPRITE_SIZE * 0.45, SPRITE_SIZE / 2 - SPRITE_SIZE * 0.45,
                     SPRITE_SIZE * 0.9, SPRITE_SIZE * 0.9);
      squareCtx.fillStyle = 'green';
      squareCtx.fill();
      squareCtx.lineWidth = 5;
      squareCtx.strokeStyle = '#003300';
      squareCtx.stroke();

  //------------------------- Remap AES -------------------------//


  function normalize11(a, scale, offset) {
    scale = scale || 1;
    offset = offset || 0;
    var i = Math.min.apply(null, a);
    var x = Math.max.apply(null, a);
    return a.map(function(k){return ((k-i)/(x-i)*2-1)*scale + offset});
  }

  function convertBoolsToColors(a) {
    return a.map(function(x){return COLOR_PALETTE[x ? 0 : 1]});
  }

  var AES_DF = {};
      AES_DF.x = normalize11(RAW_DF[MAPPINGS.x], 100);
      AES_DF.y = normalize11(RAW_DF[MAPPINGS.y], 100);
      AES_DF.z = normalize11(RAW_DF[MAPPINGS.z], 100, 100);
      AES_DF.color = convertBoolsToColors(RAW_DF[MAPPINGS.colour]);

  //----------------- Handle keyboard events --------------------//

  document.body.addEventListener('keypress', function(e) {
    switch (e.key) {
      case 'o':
        overlay.hidden = !overlay.hidden;
        break;
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

    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
    camera.position.set( 165, 120, 371 );
    scene.add( camera );

    renderer = new THREE.WebGLRenderer( { antialias:true } );
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.setClearColor(0xffffff, 1);

    container = document.getElementById( 'plot-container' );
    container.appendChild( renderer.domElement );

    THREEx.WindowResize(renderer, camera);

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.target = new THREE.Vector3(0,100,0);
    controls.update();

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    stats.domElement.hidden = true;
    container.appendChild( stats.domElement );

    // FLOOR
    //var floorTexture = new THREE.Texture( square );
    //    floorTexture.needsUpdate = true;
    //var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, alphaMap: floorTexture, side: THREE.DoubleSide, transparent: true } );
    //var floorGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    //var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    //floor.position.y = -0.5;
    //floor.rotation.x = Math.PI / 2;
    //scene.add(floor);

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
      var color = AES_DF.color[i];

      var discTxtr = new THREE.Texture(mkDisc(color));
          discTxtr.needsUpdate = true;
      var discMtrl = new THREE.SpriteMaterial( { map: discTxtr } );
      var discSprt = new THREE.Sprite( discMtrl );
      discSprt.position.set( x, z, y );
      discSprt.scale.set( 5, 5, 1 );
      scene.add( discSprt );
    }

    scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
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
    
    stats.update();
  }

  function render() 
  {
    renderer.render( scene, camera );
  }
}
