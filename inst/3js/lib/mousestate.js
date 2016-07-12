// Usage:
// new LIB.MouseState   -->  init()
// mousestate.update()  -->  render()
//
var LIB = LIB || {};

LIB.MouseState = function (domElement, camera, objs) {
  this.domElement= domElement || document;
  this.camera = camera;
  this.objs = objs;
  this.mouse = new THREE.Vector2(Infinity, Infinity, Infinity);
  this.raycaster = new THREE.Raycaster();
  this.intersectObj = null;
  
  // create callback to bind/unbind keyboard events
  var _this = this;
  this._onMouseMove = function(event){ _this._onMouseChange(event)  }

  // bind keyEvents
  this.domElement.addEventListener("mousemove", this._onMouseMove, false);
}

LIB.MouseState.prototype.destroy = function() {
  this.domElement.removeEventListener("mousemove", this._onMouseMove, false);
};

LIB.MouseState.prototype._onMouseChange = function(event) {
  this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
};

LIB.MouseState.prototype.detectHovering = function(onSelect, onDeselect) {
    this.raycaster.setFromCamera( this.mouse, this.camera );
    var intersects = this.raycaster.intersectObjects( this.objs );
    if (intersects.length > 0) {
      if (this.selectedObj != intersects[0].object) {
        if (this.selectedObj) {
          onDeselect(this.selectedObj);
        }
        this.selectedObj = intersects[0].object
        onSelect(this.selectedObj);
      }
    } else {
      if (this.selectedObj) {
        onDeselect(this.selectedObj);
        this.selectedObj = null;
      }
    }
};
