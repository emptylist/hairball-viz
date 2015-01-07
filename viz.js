var stiffness = 5;
var bondDist = 100;
var coeffElec = 10;
var coeffFriction = 0.2;
var timestep = 0.05;
var globalRadius = 20;
var VertexTable = [];
var figure = d3.select("div#figure svg");
var bondColor = d3.interpolateLab('#ff0000', '#0000ff');

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

var Bond = {
  create: function(v1, v2, k, svg) {
    var self = Object.create(this);
    self.v1 = v1;
    self.v2 = v2;
    self.k = k;

    v1.addBond(self);
    v2.addBond(self);

    if (svg != null) {
      self.viz = svg.select("g#bonds")
                    .append("line")
                    .attr("x1", v1.x())
                    .attr("y1", v1.y())
                    .attr("x2", v2.x())
                    .attr("y2", v2.y())
                    .style("stroke", bondColor(k))
                    .style("stroke-width", 1.5);
    } else {
      self.viz = null;
    }

    return self;
  },
  update: function() {
    if (this.viz != null) {
      this.viz.attr("x1", this.v1.x())
              .attr("y1", this.v1.y())
              .attr("x2", this.v2.x())
              .attr("y2", this.v2.y());
    }
  }
}

var Vertex = {
  create: function(posVec, metastability, svg) {
    var self = Object.create(this);
    self.pos = posVec;
    self.metastability = metastability;
    self.dt = timestep;
    self.bonds = [];
    self.velocity = Vector.create(0,0);
    self.spring = Vector.create(0,0);
    self.elec = Vector.create(0,0);
    self.bonded = Vector.create(0,0);
    self.bondedTemp = Vector.create(0,0);
    self.friction = Vector.create(0,0);
    self.stepVel = Vector.create(0,0);

    if (svg != null) {
      self.viz = svg.select("g#vertices")
                    .append("circle")
                    .attr("cx", self.x())
                    .attr("cy", self.y())
                    .attr("r", self.metastability * globalRadius)
                    .style("fill", "steelblue");
    }

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
      var v1 = this;
      var v2 = this.bonds[i].v1 === this ?
              this.bonds[i].v2 :
              this.bonds[i].v1;
      var k = this.bonds[i].k;
      var distance = Math.sqrt(
                      Math.pow(v1.x() - v2.x(), 2) +
                      Math.pow(v1.y() - v2.y(), 2));
      var magnitude = 10 * k * -1 * (distance - ((1/k) * bondDist));
      this.bondedTemp.setVec(
        magnitude * ((v1.x() - v2.x()) / distance),
        magnitude * ((v1.y() - v2.y()) / distance));
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

    this.viz.attr("cx", this.x())
            .attr("cy", this.y());
  }
};

var v1 = Vertex.create(Vector.create(200, 200), 0.2, figure);
var v2 = Vertex.create(Vector.create(300, 300), 0.5, figure);
var v3 = Vertex.create(Vector.create(420, 320), 0.7, figure);
VertexTable.push(v1);
VertexTable.push(v2);
VertexTable.push(v3);

var b1 = Bond.create(v1, v2, 0.5, figure);
var b2 = Bond.create(v2, v3, 1, figure);
var b3 = Bond.create(v1, v3, 1, figure);

BondTable = [];
BondTable.push(b1);
BondTable.push(b2);
BondTable.push(b3);

function update() {
  var i;
  for (i=0; i<VertexTable.length; i++) {
    VertexTable[i].update();
  };
  for (i=0; i<BondTable.length; i++) {
    BondTable[i].update();
  }
};
update();
setInterval(update, 50);

