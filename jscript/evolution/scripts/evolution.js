// Evolution Game/Simulation
//
// Copyright (c) 2007 by Chris Koss and Mike Koss

Evo.AttrLimits = {rFemale: 1, rRepro: 1, rOffspring: 1, fullthresh: 100, prChangeDir: 1};

function Evo(options)
{
	this.options = {
		EnergyFract: 0.00,		// Ambient energy fraction/day per mesh grid
		EnergyConst: 40,		// Additional ambient energy per mesh grid
		StartEnergy: 100,		// Organism's starting energy
		StartDensity: 6,		// Number of organisms per mesh square to start
		MeshStartEnergy: 100,	// Starting ambient energy level
		MaxAge: 4000,			// Probility of death as ratio of MaxAge
		MeshSize: 50,			// Mes size
		dxWorld: 300,			// World size
		dyWorld: 300,
		StatsUpdateRate: 1,		// Number of Days between refresh
		GradientUpdateRate: 1,	// Gradient update display rate
		heritable : {			// Default organism heritable traits
			speed: 1,
			size: 1,
			offspringnum: 10,	// The number of children reproduced
			preysize: 0.5,
			fullthresh: 100,
			rFemale: 0.5,		// Proportion of offspring that are female
			rRepro:  0.1,		// Proportion of maxenergy needed to reproduce
			rOffspring: 0.5,	// Proportion of energy that can be given to offspring
			Gestation: 10,		// Interval a female must wait to reproduce again
			FertileAge: 10,		// Number of days before female is fertile
			prChangeDir: 0.1,	// Probability of changing direction each day
		},
	};
	Extend(this.options, options);
	
    this.oldestOrg = null;

    this.msLast = new Date();
    this.gen = 0;
    this.orgLoopDir = 0;
    
    this.organisms = [];
    this.mpCauses = {};
    
    this.gz = new GraphZones(25, 25, this.options.dxWorld);
    
    // The visible stage into which the simulation is displayed
    this.canvasWorld = document.createElement("canvas");
    this.canvasWorld.setAttribute("width", this.options.dxWorld);
    this.canvasWorld.setAttribute("height", this.options.dyWorld);
    this.canvasWorld.globalCompositeOperation = "xor";
    this.ctx = this.canvasWorld.getContext("2d");
    
    // Offscreen canvas for the drawing of static creatures
    this.canvasStatic = document.createElement("canvas");
    this.canvasStatic.setAttribute("width", this.options.dxWorld);
    this.canvasStatic.setAttribute("height", this.options.dyWorld);
    this.ctxStatic = this.canvasStatic.getContext("2d");
	this.ctxStatic.globalCompositeOperation = "xor";

    this.canvasEnergy = document.createElement("canvas");
    this.canvasEnergy.setAttribute("width", this.options.dxWorld);
    this.canvasEnergy.setAttribute("height", this.options.dyWorld);
    this.ctxEnergy = this.canvasEnergy.getContext("2d");
    
    this.mesh = new Mesh(this.options.MeshSize, this.options.MeshSize, this.options.dxWorld, this.options.dyWorld, {Gradient: true});
	this.mesh.SetPly("energy", [0x7A, 0xD6, 0xD9], [0xF9, 0xFF, 0x1D], 100);
	var self = this;
    this.mesh.EnumPoints("energy", function (pt, x, y) { pt.value = self.options.MeshStartEnergy; } );
}

Evo.prototype = {
Init: function(stWorld, stStats)
{
    this.divWorld = document.getElementById(stWorld);
    this.divWorld.appendChild(this.canvasWorld);
    if (this.options.DebugCanvas)
		{
		this.divWorld.appendChild(this.canvasStatic);
		this.divWorld.appendChild(this.canvasEnergy);
		}

	this.divStats = document.getElementById(stStats);

    this.btnPause = document.createElement("input");
    with (this.btnPause)
		{
		type = "button";
		value = "Pause";
		onclick = this.PauseToggle.FnCallback(this);
		}
	this.divStats.appendChild(this.btnPause);
	this.divStats.appendChild(document.createElement("br"));
    
    this.stats = new Stats(this.divStats, ["Day"]);
    this.mesh.options.stats = this.stats;

	var cOrg = this.options.StartDensity*(this.mesh.colMax-1)*(this.mesh.rwMax-1);
    for (var i = 0; i < cOrg; i++)
        this.AddOrganism();
        
    this.PauseToggle();
    return this;
},

AddOrganism: function(orgMother, orgFather, energy)
{
    var org = new Organism(this, orgMother, orgFather, energy);
    this.organisms.push(org);
    return org;
},

UpdateCatch: function()
{
	try {
		this.Update();
	}
	catch (e)
	{
		console.log(e);
	}
},

Update: function()
{
    if (this.fInUpdate)
        return;

    this.fInUpdate = true;
    
    //alternates direction of enumeration to be "fair" to young and old, alike.
    if(this.orgLoopDir == 0)
        {
	    for (var i = 0; i < this.organisms.length; i++)
          this.organisms[i].Update(this);
        this.orgLoopDir == 1;
        }
    else
        {
        for (var i = 0; i < this.organisms.length; i++)
          this.organisms[this.organisms.length-i].Update(this);
        this.orgLoopDir == 0;
        }

    this.ProcessCollisions();
    this.GarbageCollect();

    var msNew = new Date();
    var ms = msNew - this.msLast;
    this.msLast = msNew;
    this.stats.Sample("FPS", 1000/ms, true);
    if (this.gen % this.options.StatsUpdateRate == 0)
        {
        this.Survey();
        this.stats.Update();
        this.stats.Reset();
        if (this.organisms.length == 0)
			this.PauseToggle();
        }
    
    var self = this;
	this.mesh.EnumPoints("energy", function (pt, x, y) {
		if (x == 0 || y == 0 || x == self.options.dxWorld || y == self.options.dyWorld)
			return;
		pt.value += (100-pt.value)*self.options.EnergyFract + self.options.EnergyConst;
		if (pt.value > 100)
			pt.value = 100;
		self.stats.Sample("field energy", pt.value);
	});
	if (this.gen % this.options.GradientUpdateRate == 0)
		this.mesh.DrawGradient("energy", this.ctxEnergy);
    this.ctx.drawImage(this.canvasEnergy, 0, 0);
    this.ctx.drawImage(this.canvasStatic, 0, 0);

    this.DrawAll();

	this.gen++;
    this.fInUpdate = false;
},

PauseToggle: function()
{
	if (this.timer)
		{
		clearInterval(this.timer);
		delete this.timer;
		return;
		}

    this.timer = window.setInterval(this.UpdateCatch.FnCallback(this), 10);
},

Survey: function()
{
	var cStatic = 0;
	var cFemale = 0;
	var cTotal = this.organisms.length;
	
    this.stats.Sample("Day", this.gen);
    this.stats.Sample("Organisms", this.organisms.length, true);
    
	for (var i = 0; i < cTotal; i++)
		{
		var org = this.organisms[i];
		this.stats.Sample("Size", org.h.size);
		this.stats.Sample("Prey size", org.h.preysize);
		this.stats.Sample("Energy", org.energy);
		console.assertBreak(org.energy > 0);
		this.stats.Sample("Metabolism", org.dailyenergy);
		this.stats.Sample("Max Energy", org.h.maxenergy);
		this.stats.Sample("growtimer", org.growtimer);
		this.stats.Sample("Offspring", org.h.offspringnum);
		this.stats.Sample("Max Speed", org.h.speed);
		this.stats.Sample("Current Speed", org.currentspeed);
		this.stats.Sample("Move threshold", org.h.fullthresh);
		this.stats.Sample("Age", org.age);
		this.stats.Sample("Generation", org.gen);
		this.stats.Sample("Female Repro (%)", 100*org.h.rFemale);
		this.stats.Sample("Req Repro Energy (%)", 100*org.h.rRepro);
		this.stats.Sample("Energy Offspring (%)", 100*org.h.rOffspring);
		this.stats.Sample("Gestation", org.h.Gestation);
		this.stats.Sample("Fertile Age", org.h.FertileAge);
		this.stats.Sample("Change Dir (%)", 100*org.h.prChangeDir);
		if (org.currentspeed == 0)
			cStatic++;
		if (org.gender == 0)
			cFemale++;
		}
	this.stats.Sample("Static", cStatic);
	this.stats.Sample("Females (%)", 100*cFemale/cTotal, true);
},

GarbageCollect: function()
{
    for (var i = this.organisms.length-1; i >= 0; i--)
        {
        var org = this.organisms[i];
        if (org.fDead)
            {
            if (this.mpCauses[org.cause] == undefined)
				this.mpCauses[org.cause] = 0;
			this.mpCauses[org.cause]++;
			
            // Remove dead creature from the static canvas
            if (org.xStatic != undefined)
				org.DrawCtx(this.ctxStatic);
            this.stats.Sample("Life Span", org.age);
            delete this.organisms[i];
            this.organisms.splice(i, 1);
            this.gz.Remove(org);
            }
        }
        
    for (var prop in this.mpCauses)
		{
		this.stats.Sample("Death by " + prop, this.mpCauses[prop], true);
		this.mpCauses[prop] = 0;
		}
},

DrawAll: function()
{
    for (var i = 0; i < this.organisms.length; i++)
        this.organisms[i].Draw();
},

ProcessCollisions: function()
{
    var phase = this.gen % 5;
    for (var i = 0; i < this.organisms.length; i++)
        {
        var org = this.organisms[i];
        if ((org.id % 5) == phase)
            this.gz.ProcessCollisions(org, this.CollisionFound.FnCallback(this));
        }
},

CollisionFound: function(org1, org2)
{
    org1.fCollision = true;
    org2.fCollision = true;
    
    if (Math.abs(org1.h.size - org2.h.size) < 0.25 && org1.gender != org2.gender)
		{
		if (org1.growtimer == 0 && org2.growtimer == 0)
			{
			if (org1.gender == 0)
				org1.Reproduce(org2);
			else
				org2.Reproduce(org1);
			}
		return;	
		}
    
    if(org1.h.preysize >= org2.h.size)
        org1.Eat(org2);
    else if (org2.h.preysize >= org1.h.size)
        org2.Eat(org1);
},

} // Evo.prototype

Organism.idNext = 0;

function Organism(evo, orgMother, orgFather, energy)
{
	this.evo = evo;
	this.h = {};
	
	if (orgMother)
		{
	    Combine(this.h, orgMother.h, orgFather.h);
	    
	    // Mutations are common and extensive
		for (var prop in this.h)
			this.h[prop] *= (0.75 + Math.random()*0.5);
		this.h.preysize = Math.min(this.h.preysize, this.h.size);
		for (var prop in Evo.AttrLimits)
			{
			if (this.h[prop] > Evo.AttrLimits[prop])
				this.h[prop] = Evo.AttrLimits[prop];
			}

		this.gen = Math.max(orgMother.gen, orgFather.gen)+1;
		this.x = orgMother.x+Math.RandomInt(10)-5;
		this.y = orgMother.y+Math.RandomInt(10)-5;
        this.growtimer = this.h.FertileAge;
        this.energy = energy;
		}
	else
		{
	    Extend(this.h, this.evo.options.heritable);
	    this.gen = 0;
		this.x = Math.RandomInt(this.evo.options.dxWorld);
		this.y = Math.RandomInt(this.evo.options.dyWorld);
		this.growtimer = 0;
		this.energy = this.evo.options.StartEnergy;
	    }

	// Calc radius only needed on creation
    this.r = Math.round(Math.sqrt(this.h.size * 5));
    if (this.r > 50)
        this.r = 50;
	
	this.id = Organism.idNext++;

	// Female == 0, Male == 1
	this.gender = Math.random() < this.h.rFemale ? 0 : 1;
	this.age = 0;
	this.fDead = false;
	this.currentspeed = this.h.speed;
	
	this.NewDir();
	this.EnergyUpdate();
   	this.evo.stats.Sample("Birth energy", this.energy);
}

Organism.prototype = {
EnergyUpdate: function()
{
	// Energy requirements
	this.h.maxenergy = this.h.size*100;
	this.dailyenergy = Math.pow(this.currentspeed, 2) + Math.pow(this.h.size,2);
	if (this.dailyenergy < 1)
		this.dailyenergy = 1;
		
    this.energy = Math.min(this.energy, this.h.maxenergy);
		
	this.energy -= this.dailyenergy;
	// You're dead with no energy - or, with increasing probability as you
	// approach MaxAge.
	if (this.energy < 1)
		{
        this.fDead = true;
        this.cause = "starvation";
        }
    if (Math.random() < this.age/this.evo.options.MaxAge)
		{
		this.fDead = true;
		this.cause = "random";
		}
},

NewDir: function()
{
	this.dir = Math.random()*2*Math.PI;
	this.dx = this.currentspeed * Math.cos(this.dir);
	this.dy = this.currentspeed * Math.sin(this.dir);
},

Draw: function()
{
    if (this.fDead)
        return;
        
    if (this.xStatic)
		{
		if (this.xStatic == this.x && this.yStatic == this.y)
			return;
		var xSav = this.x;
		var ySav = this.y;
		this.x = this.xStatic;
		this.y = this.yStatic;
		delete this.xStatic;
		delete this.yStatic;
		this.DrawCtx(this.evo.ctxStatic);
		this.x = xSav;
		this.y = ySav;
		}
		
	var ctx = this.evo.ctx;
	
	// HACK: Canvas is not erasing partially off left edge - so we
	// choose not to cache those static organisms hanging off the left
	// edge.
	if (this.currentspeed == 0 && this.x > this.r)
		{
		// Canvas does not draw fractional coordinates deterministicly - so we get
		// imperfect erasure.  Ensur that coordinates are integer when the org
		// becomes static.
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		this.xStatic = this.x;
		this.yStatic = this.y;
		ctx = this.evo.ctxStatic;
		}

	this.DrawCtx(ctx);
},

DrawCtx: function(ctx)
{
	ctx.beginPath();
	if (this.fCollision)
		ctx.fillStyle = "red";
	else if (this.energy > this.h.rRepro * this.h.maxenergy && this.growtimer == 0)
		ctx.fillStyle = this.gender == 0 ? "purple" : "blue";
	else
		ctx.fillStyle = "gray";
//	ctx.lineWidth = 0;
//	ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
//	ctx.closePath();
	ctx.fillRect(this.x - this.r, this.y - this.r, 2*this.r, 2*this.r);
//	ctx.fill();
},

Update: function()
{
    this.x = this.x + this.dx;
    this.y = this.y + this.dy;
    this.age++;
   
    if(Math.RandomInt(100) == 0) 
        this.NewDir();

    this.x = (this.x + this.evo.options.dxWorld) % this.evo.options.dxWorld;
    this.y = (this.y + this.evo.options.dyWorld) % this.evo.options.dyWorld;
    
    console.assert(this.x >= 0 && this.y >= 0);
        
    this.evo.gz.Move(this);
    this.fCollision = false;
    
    this.growtimer = Math.max(0, this.growtimer-1);
        
    var eAppetite = Math.max(0, this.h.maxenergy - this.energy);
    var info = this.evo.mesh.GetPtInfo("energy", this.x, this.y);
	eAppetite = Math.min(info.valTri, eAppetite);
	if (eAppetite >= 1)
		{
		var eEat = this.evo.mesh.AddValue("energy", this.x, this.y, -eAppetite, info);
		console.assertBreak(eEat <= 0);
		this.evo.stats.Sample("Eat Amount", -eEat, true);
		this.energy -= eEat;
		}
		
	if (this.currentspeed > 0 && this.gender == 0 && info.valTri > eAppetite + this.h.fullthresh)
		{
	    this.currentspeed = 0;
	    this.NewDir();
	    }
	else if (this.currentspeed <= 0 && info.valTri < eAppetite + this.h.fullthresh)
	    {
	    this.currentspeed = this.h.speed;
	   	this.NewDir();
	    }
	    
	if (this.currentspeed > 0 && Math.random() < this.h.prChangeDir)
		this.NewDir();

	this.EnergyUpdate();
},

Eat: function(prey)
{
    console.assert(this != prey);
    this.energy += prey.energy;
        
    prey.energy = 0;
    prey.fDead = true;
    prey.cause = "predation";
    
    this.evo.stats.Sample("eaten size", prey.h.size);
    this.evo.stats.Sample("eater size", this.h.size);
},

Reproduce: function(male)
{
    if (this.energy > this.h.maxenergy*this.h.rRepro &&
		this.growtimer == 0)
        {
        var availenergy = this.energy * this.h.rOffspring;
        this.energy -= availenergy;
        console.assert(this.energy >= 0);

        this.growtimer = this.h.Gestation;
        
        var cOffspring = Math.round(this.h.offspringnum);
        for (var i = 0; i < cOffspring; i++)
            this.evo.AddOrganism(this, male, availenergy / cOffspring);
	
	    this.EnergyUpdate();
        }
},

FCollision: function(orgOther)
{
    if (this.id > orgOther.id)
        return false;
    var rad = orgOther.r + this.r;
    var dist = Math.sqrt(Math.pow(orgOther.x - this.x, 2) + Math.pow(orgOther.y - this.y, 2));
    return (dist < rad);
}

} // Organism.prototype
