// Mesh - A mesh of values for which we can compute the density and gradient of named
// values stored in the mesh.
//
// Mesh.EnumPoints(stPly, fn(point, x, y))
// Mesh.GetValue(stPly, x, y) -> {value: , dir: , slope: }
// Mesh.AddValue(stPly, x, y, value) ; adds a named value to the 4 adjacent points
// Note: coordinate system is (0,0) at upperleft, inc x to the right, inc y toward the bottom.\
// Copyright (c) 2007 by Mike Koss


function Mesh(dx, dy, xMax, yMax, options)
{
    this.dx = dx;
    this.dy = dy;
    this.colMax = Math.ceil(xMax/dx);
    this.rwMax = Math.ceil(yMax/dy);
    this.xMax = this.colMax * dx;
    this.yMax = this.rwMax * dy;
    this.points = [];
    for (var rw = 0; rw <= this.rwMax; rw++)
        for (var col = 0; col <= this.colMax; col++)
            this.points[rw*(this.colMax+1) + col] = {};
    this.plys = {};
    this.options = {
		Gradient: true,
		ShowTriangles: false,
		IncThresh: 0.10,
		stats: null
		};
	Extend(this.options, options);
}

Mesh.Dir = function(x, y)
{
	var dir = Math.atan2(y, x);
	if (dir < 0)
		dir += 2*Math.PI;
	console.assert(dir >= 0);
	return dir;
};

Mesh.prototype = {

SetPly: function(stPly, rgb0, rgb1, valMax)
{
	var ply = this.plys[stPly] = {};
	
	ply.stPly = stPly;
	ply.rgb0 = rgb0;
	ply.rgb1 = rgb1;
	ply.valMax = valMax;

	this.EnumPoints(stPly, function (pt, x, y) {
		pt.value = 0;
	});
},

GetPoint: function(stPly, rw, col)
{
	console.assert(rw <= this.rwMax && col <= this.colMax);
	var pt = this.points[rw*(this.colMax+1) + col];
	
	if (pt[stPly] == undefined)
		pt[stPly] = {};
	return pt[stPly];
},

EnumPoints: function(stPly, fn)
{
    for (var rw = 0; rw <= this.rwMax; rw++)
        for (var col = 0; col <= this.colMax; col++)
            fn(this.GetPoint(stPly, rw, col), col*this.dx, rw*this.dy);
},

Reset: function(stName, value)
{
    this.EnumPoints(function (pt, x, y) { pt.value = value; } );
},

AddValue: function(stPly, x, y, value, info)
{
	if (!info)
		info = this.GetPtInfo(stPly, x, y);

	var itri = info.itri;

	if (value + info.valTri < 0)
		value = -info.valTri;
		
	// valTri in some cases is greater than value!
	if (value + info.value < 0)
		value = -info.value;
	
	// Equally distribute positive values
	if (value >= 0)
		{
		info.pts[itri].value += value/3;
		info.pts[(itri+1)%4].value += value/3;
		info.pts[(itri+2)%4].value += value/6;
		info.pts[(itri+3)%4].value += value/6;
		}
	// Negative values remove proportionate to current values
	else
		{
		for (var i = 0; i < 4; i++)
			info.pts[i].value += value * (info.pts[i].value / info.value);
		}
		
	// Ensure values are between 0..valMax
	for (var i = 0; i < 4; i++)
		{
		if (info.pts[i].value > this.plys[stPly].valMax)
			info.pts[i].value = this.plys[stPly].valMax;
		// Proportionate removal should never set values below zero!
		if (info.pts[i].value < 0)
			{
			value -= info.pts[i].value;
			info.pts[i].value = 0;
			value
			}
		}
		
	return value;
},

GetPtInfo: function(stPly, x, y)
{
	var rw = Math.floor(y/this.dy);
	var col = Math.floor(x/this.dx);
	var pts = [];
	var value = 0;
	for (var i = 0; i < 4; i++)
		{
		pts[i] = this.GetPoint(stPly, rw + Math.floor(i/2), col + (i%2));
		value += pts[i].value;
		}
	x -= this.dx * (col+0.5);
	y -= this.dy * (rw+0.5);
	var itri = (Mesh.Dir(x, y) + Math.PI*3/4) % (2*Math.PI);
	itri = Math.floor(itri/(Math.PI/2));
	
	var valTri = 0;
	valTri += pts[itri].value;
	valTri += pts[(itri+1)%4].value;
	valTri += value/4;
	
	return {value: value,
		valTri: valTri,
		pts:pts,
		itri: itri};
},

DrawGradient: function(stPly, ctx)
{
	var ply = this.plys[stPly];
	var ptzs = [];
	var cSkip = 0;
	
	// Init vector array so we don't create and destroy a new one in each inner loop
	for (var i = 0; i < 5; i++)
		ptzs[i] = [];
	
	for (var rw = 0; rw < this.rwMax; rw++)
		{
		var y = rw*this.dy;
		for (var col = 0; col < this.colMax; col++)
			{
			var x = col*this.dx;
			var v;
			var vAvg = 0;
			var ipt = 0;
			var mesh = this;
			var fChanged = false;
			
			function BuildPoint(drw, dcol)
			{
				var pt = mesh.GetPoint(stPly, rw+drw, col+dcol);
				vAvg += pt.value;
				ptzs[ipt][0] = x + dcol*mesh.dx;
				ptzs[ipt][1] = y + drw*mesh.dy;
				ptzs[ipt][2] = pt.value/ply.valMax;
				
				ipt++;
				return pt;
			}
			
			var ptUL = BuildPoint(0, 0);
			BuildPoint(0, 1);
			BuildPoint(1, 1);
			BuildPoint(1, 0);
			
			vAvg /= 4;
			
			// Only draw the triangles if values have changed more than 5% since last draw
			if (this.options.IncThresh != 0 &&
				(ptUL.vAvgLast == undefined || Math.abs(vAvg - ptUL.vAvgLast ) > ply.valMax * this.options.IncThresh))
				{
				ptUL.vAvgLast = vAvg;
				
				ptzs[4][0] = x + this.dx/2;
				ptzs[4][1] = y + this.dy/2;
				ptzs[4][2] = vAvg/ply.valMax;
				
				for (var i = 0; i < 4; i++)
					this.FillTriangle(ctx, [ptzs[i], ptzs[(i+1)%4], ptzs[4]], ply.rgb0, ply.rgb1);
				}
			else
				cSkip++;
			}
		}
	if (this.options.stats)
		this.options.stats.Sample("Mesh Skip", cSkip);
},

// w.l.g 0 <= A <= B <= C <= 1
// find point, X, s.t. Value(X) == B
// Choose D - the furthest from X of (A or C)
// S = (D-B), V = (X-B)
// Y = S.V/|V|^2 * V + B (point on BX perpendicular bisector from C)
// Side effect - fills grad:{dir:, slope:}
FillTriangle: function(ctx, ptzs, rgb0, rgb1)
{
    var rgb;

    if (!this.options.Gradient)
		{
        rgb = Array.MixInt((ptzs[0][2]+ptzs[1][2]+ptzs[2][2])/3, rgb0, rgb1);
        ctx.fillStyle = "rgb(" + rgb.join(",") + ")";
		}
	else
		{
		ptzs = ptzs.sort(function (p1, p2) {return p1[2]-p2[2];});
	    
		// ptzs[1] now has the "middle" value
		console.assert(ptzs[0][2] <= ptzs[1][2] && ptzs[1][2] <= ptzs[2][2]);
	    
		var A = ptzs[0][2]; var B = ptzs[1][2]; var C = ptzs[2][2];
    
		// All equal
		if (C == A)
			{
			rgb = Array.MixInt(A, rgb0, rgb1);
			ctx.fillStyle = "rgb(" + rgb.join(",") + ")";
			}
		else
			{
			// Find point, X, on AC that has same value as B
			var r = (B-A)/(C-A);
			console.assert(r >= 0 && r <= 1);
			var X = Array.MixInt(r, ptzs[0], ptzs[2], 2);
	        
			// Make D base of gradient vector
			var D = ptzs[r < 0.5 ? 2 : 0].Clone();

			// S = D - B
			var S = D.Clone(2);
			S.AddMult(-1, ptzs[1], 2);
	         
			// V = (X-B)
			var V = X.Clone();
			V.AddMult(-1, ptzs[1], 2);

			// Y = S.V/|V|^2 * V + B
			var DY = ptzs[1].Clone(2);
			DY.AddMult(Array.Dot(S, V)/Array.Dot(V, V), V);
			DY.AddMult(-1, D, 2);
	        
			// Gradient goes from D to Y (value B) but we need to extend beyond the
			// end of the triangle; we go to the end of the color stop (0 or 1).
			// Y2 = K*DY+D where K = (L-D)/(B-D) ; L=0/1
			var L = D[2] < B ? 1 : 0;
			var K = (L-D[2])/(B-D[2]);
			DY.Mult(K);
			DY.AddMult(1, D, 2);
	        
			var grad = ctx.createLinearGradient(D[0], D[1], DY[0], DY[1]);
			rgb = Array.MixInt(D[2], rgb0, rgb1);
			grad.addColorStop(0, "rgb(" + rgb.join(",") + ")");
			rgb = Array.MixInt(L, rgb0, rgb1);
			grad.addColorStop(1, "rgb(" + rgb.join(",") + ")");
			ctx.fillStyle = grad;
			}
		}

	if (this.options.ShowTriangles)
		ctx.strokeStyle = "black";
	else   
		ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(ptzs[0][0],ptzs[0][1]);
    ctx.lineTo(ptzs[1][0],ptzs[1][1]);
    ctx.lineTo(ptzs[2][0],ptzs[2][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
},

} // Mesh.prototype


// ratio=0 -> a1
// ratio=1 -> a2
Array.MixInt = function(ratio, a1, a2, n)
{
    var aOut = [];
    if (n == undefined)
        n = a1.length;
    for (var i = 0; i < n; i++)
        aOut[i] = Math.round((1-ratio)*a1[i] + ratio*a2[i]);
    return aOut;
}

Array.prototype.AddMult = function(m, a1, n)
{
    if (n == undefined)
        n = a1.length;
    for (var i = 0; i < n; i++)
        this[i] += m * a1[i];
}

Array.prototype.Mult = function(m, n)
{
    if (n == undefined)
        n = this.length;
    for (var i = 0; i < n; i++)
        this[i] *= m;
}

Array.Dot = function(a1, a2, n)
{
    var s = 0;
    
    if (n == undefined)
        n = a1.length;
    
    for (var i = 0; i < n; i++)
        s += a1[i]*a2[i];
    return s;
}

Array.prototype.Clone = function(n)
{
    var aOut = [];
    if (n == undefined)
        n = this.length;
    for (var i = 0; i < n; i++)
        aOut[i] = this[i];
    return aOut;
}
