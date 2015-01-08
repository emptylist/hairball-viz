var stiffness = 8;
var bondDist = 100;
var coeffElec = 20;
var coeffFriction = 0.2;
var timestep = 0.02;
var globalRadius = 20;
var VertexTable = [];
var figure = d3.select("div#figure svg");
var bondColor = d3.interpolateLab('#ff0000', '#0000ff');
var ticker;

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

var Vertex = {
  create: function(posVec, metastability, svg) {
    var self = Object.create(this);
    self.pos = posVec;
    self.metastability = metastability;
    self.radius = metastability * globalRadius;
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
                    .attr("r", self.radius)
                    .style("fill", "steelblue");
    }

    return self;
  },
  clear: function() {
    if(this.viz) {
      this.viz.remove();
    }
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
      r *= 0.1;
      if (r != 0) {
        this.elec.x += coeffElec * (this.x() - VertexTable[i].x()) / r;
        this.elec.y += coeffElec * (this.y() - VertexTable[i].y()) / r;
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

function buildCurve(v1, v2) {
  var xsgn = v1.x() - v2.x() > 0 ? 1 : -1;
  var ysgn = v1.y() - v2.y() > 0 ? 1 : -1;
  var v1r = {x: v1.x(),
             y: v1.y() + (ysgn * v1.radius)};
  var v2r = {x: v2.x() + (xsgn * v2.radius),
             y: v2.y()};

  var curveString = "M" + v1r.x +" " +
                    v1r.y + " Q " +
                    v1.x() + " " +
                    v2.y() + " " +
                    v2r.x + " " +
                    v2r.y;
  return curveString;
};

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
                    .append("path")
                    .attr("d", buildCurve(self.v1, self.v2))
                    .style("stroke", bondColor(k))
                    .style("stroke-width", 1.5 * k)
                    .style("fill", "transparent")
                    .style("marker-end", "url(#markerArrow)");
    } else {
      self.viz = null;
    }

    return self;
  },
  clear: function() {
    if (this.viz) {
        this.viz.remove();
    }
  },
  update: function() {
    if (this.viz != null) {
      this.viz.attr("d", buildCurve(this.v1, this.v2));
    }
  }
};
var counter = 0;

function update() {
  var i;
  for (i=0; i<VertexTable.length; i++) {
    VertexTable[i].update();
  };
  for (i=0; i<BondTable.length; i++) {
    BondTable[i].update();
  }
};

function clearFigure() {
  var i;
  for (i=0; i<VertexTable.length; i++) {
    VertexTable[i].clear();
  }
  for (i=0; i<BondTable.length; i++) {
    BondTable[i].clear();
  }
  VertexTable = [];
  BondTable = [];
};

function handleFiles(files) {
  // We only care about one file
  var file = files[0];
  var reader = new FileReader();
  var splitResults;
  clearFigure();
  clearInterval(ticker);

  reader.onloadend = function() {
    if (!reader.error) {
      splitResults = reader.result.split("\n");
      var v;
      var i;
      var line;
      for (i=3; i<splitResults.length; i++) {
        line = splitResults[i].split(" ");
        if (line.length === 3) {
          var from = line[0];
          var to = line[1];
          var prob = parseFloat(line[2]);
          if (from === to) {
            v = Vertex.create(Vector.create(Math.random() * 600, Math.random() * 600), prob, figure);
            VertexTable.push(v);
          }
        }
      }
      for (i=3; i<splitResults.length; i++) {
        line = splitResults[i].split(" ");
        if (line.length === 3) {
          var from = parseInt(line[0]);
          var to = parseInt(line[1]);
          var prob = parseFloat(line[2]);
          if (from !== to) {
            try {
              Bond.create(VertexTable[from-1], VertexTable[to-1], Math.log(1/prob), figure);
            } catch (e) {console.log(e); }
          }
        }
      }
    } else {
      alert("An error occured while loading the file.");
    }
  };
  reader.readAsText(file);
};

function loadDemo() {

  var v1 = Vertex.create(Vector.create(600 * Math.random(), 600 * Math.random()), Math.random(), figure);
  var v2 = Vertex.create(Vector.create(600 * Math.random(), 600 * Math.random()), Math.random(), figure);
  var v3 = Vertex.create(Vector.create(600 * Math.random(), 600 * Math.random()), Math.random(), figure);
  var v4 = Vertex.create(Vector.create(600 * Math.random(), 600 * Math.random()), Math.random(), figure);
  var v5 = Vertex.create(Vector.create(600 * Math.random(), 600 * Math.random()), Math.random(), figure);

  VertexTable.push(v1);
  VertexTable.push(v2);
  VertexTable.push(v3);
  VertexTable.push(v4);
  VertexTable.push(v5);

  var b1 = Bond.create(v1, v2, Math.random(), figure);
  var b2 = Bond.create(v2, v3, Math.random(), figure);
  var b3 = Bond.create(v1, v3, Math.random(), figure);
  var b4 = Bond.create(v3, v1, Math.random(), figure);
  var b5 = Bond.create(v1, v4, Math.random(), figure);
  var b6 = Bond.create(v4, v1, Math.random(), figure);

  BondTable = [];
  BondTable.push(b1);
  BondTable.push(b2);
  BondTable.push(b3);
  BondTable.push(b4);
  BondTable.push(b5);
  BondTable.push(b6);

  figure.select("#demo").append("text")
      .attr("x", 300)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-family", "\'Exo 2\', sans-serif")
      .text("Demo");
};

loadDemo();

ticker = setInterval(update, 20);
