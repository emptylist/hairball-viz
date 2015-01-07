var Vector = {
  create: function(x, y) {
    var self = Object.create(this);
    self.x = x;
    self.y = y;

    return self;
  },
  addVec: function(vec) {
    this.x += vec.x;
    this.y += vec.y;
  },
  setVec: function(x,y) {
    this.x = x;
    this.y = y;
  },
  multConst: function(c) {
    this.x *= c;
    this.y *= c;
  }
};

var Bond = {
  create: function(vertex, k) {
    var self = Object.create(this);
    self.vertex = vertex;
    self.k = k;

    return self;
  }
}

var Origin = Vector.create(300, 300);
var stiffness = 5;
var bondDist = 100;
var coeffElec = 10;
var coeffFriction = 0.2;
var VertexTable = [];

var Vertex = {
  create: function(posVec, ts) {
    var self = Object.create(this);
    self.pos = posVec;
    self.dt = ts;
    self.bonds = [];
    self.velocity = Vector.create(0,0);
    self.spring = Vector.create(0,0);
    self.elec = Vector.create(0,0);
    self.bonded = Vector.create(0,0);
    self.bondedTemp = Vector.create(0,0);
    self.friction = Vector.create(0,0);
    self.stepVel = Vector.create(0,0);

    return self;
  },
  addBond: function(bond) {
    this.bonds.push(bond);
  },
  x: function() {
    return this.pos.x;
  },
  y: function() {
    return this.pos.y;
  },
  updateSpring: function() {
    this.spring.setVec(-1 * (this.pos.x - Origin.x),
                       -1 * (this.pos.y - Origin.y));
    this.spring.multConst(stiffness);
    this.spring.multConst(this.dt);
  },
  updateElec: function() {
    this.elec.setVec(0,0);
    var i=0;
    for (i=0; i < VertexTable.length; i++) {
      var r = Math.sqrt(Math.pow(this.x() - VertexTable[i].x(), 2) +
                        Math.pow(this.y() - VertexTable[i].y(), 2));
      r *= 0.5;
      if (r != 0) {
        this.elec.x += -1 * coeffElec * (this.x() - VertexTable[i].x()) / Math.pow(r,2);
        this.elec.y += -1 * coeffElec * (this.y() - VertexTable[i].y()) / Math.pow(r,2);
      }
    }
    this.elec.multConst(this.dt);
  },
  updateBonded: function() {
    this.bonded.setVec(0,0);
    var i;
    var sgn;
    for (i=0; i<this.bonds.length; i++) {
      var k = this.bonds[i].k;
      var distance = Math.sqrt(
                      Math.pow(this.pos.x - this.bonds[i].vertex.pos.x, 2) +
                      Math.pow(this.pos.y - this.bonds[i].vertex.pos.y, 2));
      var magnitude = 10 * k * -1 * (distance - ((1/k) * bondDist));
      this.bondedTemp.setVec(
        magnitude * ((this.pos.x - this.bonds[i].vertex.pos.x) / distance),
        magnitude * ((this.pos.y - this.bonds[i].vertex.pos.y) / distance));
      this.bonded.addVec(this.bondedTemp);
    }
    this.bonded.multConst(this.dt);
  },
  updateFriction: function() {
    this.friction.setVec(-1 * this.velocity.x, -1 * this.velocity.y);
    this.friction.multConst(coeffFriction);
  },
  update: function() {
    this.updateSpring();
    this.updateElec();
    this.updateBonded();

    this.velocity.addVec(this.spring);
    this.velocity.addVec(this.elec);
    this.velocity.addVec(this.bonded);

    this.updateFriction();
    this.velocity.addVec(this.friction);

    this.stepVel.setVec(this.velocity.x, this.velocity.y);
    this.stepVel.multConst(this.dt);
    this.pos.addVec(this.stepVel);
  }
};

var v1 = Vertex.create(Vector.create(200, 200), .05);
var v2 = Vertex.create(Vector.create(300, 300), .05);
var v3 = Vertex.create(Vector.create(420, 320), .05);
VertexTable.push(v1);
VertexTable.push(v2);
VertexTable.push(v3);

v1.addBond(Bond.create(v2, 0.5));
v1.addBond(Bond.create(v3, 1));
v2.addBond(Bond.create(v1, 0.5));
v2.addBond(Bond.create(v3, 1));
v3.addBond(Bond.create(v1, 1));
v3.addBond(Bond.create(v2, 1));

var svg = d3.select("svg");

var c1 = svg.select("#c1");
var c2 = svg.select("#c2");
var c3 = svg.select("#c3");
var b1 = svg.select("#b1");
var b2 = svg.select("#b2");
var b3 = svg.select("#b3");

c1.attr("cx", v1.x())
  .attr("cy", v1.y());

c2.attr("cx", v2.x())
  .attr("cy", v2.y());

c3.attr("cx", v3.x())
  .attr("cy", v3.y());

b1.attr("x1", v1.x())
  .attr("y1", v1.x())
  .attr("x2", v2.x())
  .attr("y2", v2.y());

b2.attr("x1", v2.x())
  .attr("y1", v2.y())
  .attr("x2", v3.x())
  .attr("y2", v3.y());

b3.attr("x1", v3.x())
  .attr("y1", v3.y())
  .attr("x2", v1.x())
  .attr("y2", v1.y());

var counter = 0;

function update() {
  //counter++;
  v1.update();
  v2.update();
  v3.update();
  //if (counter >= 5) {
  c1
    .attr("cx", v1.x())
    .attr("cy", v1.y());
  c2
    .attr("cx", v2.x())
    .attr("cy", v2.y());
  c3
    .attr("cx", v3.x())
    .attr("cy", v3.y());

  b1.attr("x1", v1.x())
    .attr("y1", v1.y())
    .attr("x2", v2.x())
    .attr("y2", v2.y());

  b2.attr("x1", v2.x())
    .attr("y1", v2.y())
    .attr("x2", v3.x())
    .attr("y2", v3.y());

  b3.attr("x1", v3.x())
    .attr("y1", v3.y())
    .attr("x2", v1.x())
    .attr("y2", v1.y());

  //counter = 0;
  //}

};
update();
setInterval(update, 50);

