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

var Origin = Vector.create(300, 300);
var stiffness = 1;
var coeffElec = 500;
var coeffFriction = 0.8;
var VertexTable = [];

var Vertex = {
  create: function(posVec, ts, bonds) {
    var self = Object.create(this);
    self.pos = posVec;
    self.dt = ts;
    self.bonds = bonds;
    self.velocity = Vector.create(0,0);
    self.spring = Vector.create(0,0);
    self.elec = Vector.create(0,0);
    self.bonded = Vector.create(0,0);
    self.friction = Vector.create(0,0);

    return self;
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
      if (r != 0) {
        this.elec.x += -1 * coeffElec * (this.x() - VertexTable[i].x()) / r;
        console.log(i + " " + this.elec.x);
        this.elec.y += -1 * coeffElec * (this.y() - VertexTable[i].y()) / r;
      }
    }
    this.elec.multConst(this.dt);
  },
  updateBonded: function() {
  },
  updateFriction: function() {
    this.friction.setVec(-1 * this.velocity.x, -1 * this.velocity.y);
    this.friction.multConst(coeffFriction);
    this.friction.multConst(this.dt);
  },
  update: function() {
    var stepVel = Vector.create(this.velocity.x, this.velocity.y);
    stepVel.multConst(this.dt);
    this.pos.addVec(stepVel);
    this.updateSpring();
    this.updateElec();
    this.updateBonded();
    this.updateFriction();
    this.velocity.addVec(this.spring);
    this.velocity.addVec(this.elec);
    this.velocity.addVec(this.friction);
    //this.velocity.addVec(this.strong());
    //this.velocity.addVec(this.bonded());
  }
};

var v1 = Vertex.create(Vector.create(200, 200), .05);
var v2 = Vertex.create(Vector.create(300, 300), .05);
var v3 = Vertex.create(Vector.create(420, 320), .05);
VertexTable.push(v1);
VertexTable.push(v2);
VertexTable.push(v3);

var svg = d3.select("svg");

var c1 = svg.select("#c1");
var c2 = svg.select("#c2");
var c3 = svg.select("#c3");

c1.attr("cx", v1.x())
  .attr("cy", v1.y());

c2.attr("cx", v2.x())
  .attr("cy", v2.y());

c3.attr("cx", v3.x())
  .attr("cy", v3.y());

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
  //counter = 0;
  //}

};
update();
setInterval(update, 30);

