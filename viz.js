var Origin = {x: 300, y: 300};
var G = 1;

var Vertex = {
  create: function(x, y, ts, bonds) {
    var self = Object.create(this);
    self.x = x;
    self.y = y;
    self.ts = ts;
    self.bonds = bonds;
    self.velocity = {x:0, y:0};

    return self;
  },

  grav: function() {

  },

  strong: function() {
    return {x: 0, y: 0};
  },

  bonded: function() {
    return {x: 0, y: 0};
  },

  update: function() {
    this.x += this.dt * this.velocity.x;
    this.y += this.dt * this.velocity.y;
  }
};

var v1 = Vertex.create(200, 200);
var v2 = Vertex.create(300, 300);
var v3 = Vertex.create(420, 320);

var svg = d3.select("svg");

var c1 = svg.select("#c1");
var c2 = svg.select("#c2");
var c3 = svg.select("#c3");

c1.attr("cx", v1.x)
  .attr("cy", v1.y);

c2.attr("cx", v2.x)
  .attr("cy", v2.y);

c3.attr("cx", v3.x)
  .attr("cy", v3.y);

