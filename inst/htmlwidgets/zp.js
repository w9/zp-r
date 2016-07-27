HTMLWidgets.widget({

  name: "zp",
  
  type: "output",
  
  factory: function(el, width, height) {

    var zp = new ZP.ZP(el, width, height);

    return {
      renderValue: function(msg) {
        zp.plot(msg.data, msg.mappings);
      },

      resize: function(width, height) {
        zp.resize(width, height);
      }
    };
  }
});
