// Rubik's Cube simulation (using WildTangent)
// by Mike Koss (mckoss.com)
//
// History:
// 4-10-03: Created.
// 4-13-03: Correct design flaw - regroup cubes after each turn.
// 4-29-03: Completed Solver based on David Singmaster's Algorithm (cf. Notes on Rubik's Magic Cube - 1981)

Rubik.rgstFacesWT = ["right", "left", "bottom", "top", "front", "back"];
Rubik.rgrgbFaces = [[255,71,19], [167,31,31], [255,243,253],
	[238,209,0], [53,110,239], [57,166,59]];

Rubik.rgstFaces = ["Left", "Right", "Down", "Up", "Front", "Back"];
Rubik.rgxyzFaces = [[-1,0,0], [1,0,0], [0,-1,0], [0,1,0], [0,0,-1], [0,0,1]];
Rubik.rgorientFaces = [[1,0,0], [-1,0,0], [0,0,1], [0,0,1], [0,0,1], [0,0,-1]];

// Available in caps: AbCdEfGHijklMNOPQrSTuVWxyz";
// Face motions: LRDUFB
// Slice motions: XYZ
// Cube re-orientations: IJK
Rubik.rgchSlices = "LXRDYUFZB";
Rubik.stMoves = Rubik.rgchSlices + "IJK";

// Permutations for each move: l, x, r, d, y, u, f, z, b.
Rubik.rgpermInit = [
	[["LUF", "LFD", "LDB", "LBU"], ["LU", "LF", "LD", "LB"]],	// Left
	[["FU", "UB", "BD", "DF"]],				// X (Slice)
	[["RFU", "RUB", "RBD", "RDF"], ["RU", "RB", "RD", "RF"]],	// Right
	[["DLF", "DFR", "DRB", "DBL"], ["DF", "DR", "DB", "DL"]],	// Down
	[["FL", "LB", "BR", "RF"]],				// Y (Slice)
	[["UFL", "ULB", "UBR", "URF"], ["UF", "UL", "UB", "UR"]],	// Up
	[["FLU", "FUR", "FRD", "FDL"], ["FU", "FR", "FD", "FL"]],	// Front
	[["UL", "LD", "DR", "RU"]],				// Z
	[["BUL", "BLD", "BDR", "BRU"], ["BU", "BL", "BD", "BR"]]	// Back
	];

function Rubik()
{
	var i, j, k;
	var cube;

	Rubik.InitPerms();

	this.grpSlice = new Group();
	this.grpAll = new Group(this.grpSlice);
	this.rgcube = new Array();
	this.rgtext = new Array();
	this.degFlipRemain = 0;
	this.ml = new MoveList;
	this.perm = new Permutation;

	for (i = 0; i < 3; i++)
		{
		this.rgcube[i] = new Array();
		for (j = 0; j < 3; j++)
			{
			this.rgcube[i][j] = new Array();
			for (k = 0; k < 3; k++)
				{
				cube = new Cube(55);
				this.rgcube[i][j][k] = cube;
				cube.MoveTo(i*60-60, j*60-60, k*60-60);
				ColorFaces(cube, Rubik.rgstFacesWT, Rubik.rgrgbFaces);
				this.grpAll.AddObject(cube);
				}
			}
		}

	for (i = 0; i < Rubik.rgstFaces.length; i++)
		{
		var text = new Text3D(Rubik.rgstFaces[i]);
		text.SetColor(Rubik.rgrgbFaces[i]);
		var xyz = Rubik.rgxyzFaces[i];
		text.MoveTo(xyz[0]*150, xyz[1]*150, xyz[2]*150);
		xyz = Rubik.rgorientFaces[i];
		text.SetOrientation(xyz[0], xyz[1], xyz[2], 0, i == 2 ? -1 : 1, 0);
		this.grpAll.AddObject(text);
		this.rgtext.push(text);
		}

	this.ctr = new CBController(this, "Rubik's Cube", Rubik.stMoves);
}

// Create forward and inverse permutations for each of the 9 "slices" that move (6 faces plus 3 inner slices).
// We also create composite permutations for the 3 whole-cube movements.
// Inverse for permutation for iSlice is stored at iSlice+12

function Rubik.InitPerms()
{
	var iSlice;
	var perm;

	if (Rubik.rgperm != undefined)
		return;

	Rubik.rgperm = new Array;

	for (iSlice = 0; iSlice < 9; iSlice++)
		{
		perm = new Permutation(Rubik.rgpermInit[iSlice]);
		Rubik.rgperm[iSlice] = perm;
		Rubik.rgperm[iSlice+12] = perm.Inverse();
		}

	for (iSlice = 0; iSlice < 3; iSlice++)
		{
		perm = Rubik.Perm(iSlice*3, -1);
		perm = perm.Compose(Rubik.Perm(iSlice*3+1, 1));
		perm = perm.Compose(Rubik.Perm(iSlice*3+2, 1));
		Rubik.rgperm[iSlice+9] = perm;
		Rubik.rgperm[iSlice+9+12] = perm.Inverse();
		}
}

function Rubik.Perm(ichSlice, dir)
{
	return Rubik.rgperm[ichSlice + (dir == 1 ? 0 : 12)];
}

function ColorFaces(mod, rgst, rgrgb)
{
	var i;
	var rgb;

	for (i in rgst)
		{
		rgb = rgrgb[i];
		mod.wtoI.setColor(rgb[0], rgb[1], rgb[2], rgst[i]);
		}
}

function Rubik.prototype.CheckProcess()
{
	var ch;

	if (this.FBusy())
		return;

	ch = this.ml.ChGet();
	if (ch)
		this.FAnimateMove(ch);
}

function Rubik.StInverse(stMoves)
{
	var st = "";
	
	while (stMoves.length > 0)
		{
		st += ChangeCase(stMoves.charAt(stMoves.length-1));
		stMoves = stMoves.substr(0, stMoves.length-1);
		}
	return st;
}

// Remove subsequences that are identity permutations
function Rubik.ReduceMoves(st)
{
	var mapPerm = new Object;
	var perm = new Permutation;
	var stMoves = "";
	var stPerm;
	
	mapPerm[perm.StCycles()] = "";
	for (ich = 0; ich < st.length; ich++)
		{
		ch = st.charAt(ich);
		perm = perm.ApplyMoves(ch);
		stPerm = perm.StCycles();
		if (mapPerm[stPerm] == undefined)
			{
			stMoves += ch;
			mapPerm[stPerm] = stMoves;
			continue;
			}
		// Found a duplicate permutation.  Go back to the earlier moves
		// that created that permutation.
		stMoves = mapPerm[stPerm];
		}
	return stMoves;
}

function ChangeCase(ch)
{
	if (ch == ch.toUpperCase())
		return ch.toLowerCase();
	return ch.toUpperCase();
}

function Rubik.prototype.DoKey(ch, fDown, fShift)
{
	if (!fDown)
		return;

	if (!fShift)
		ch = ch.toLowerCase();
	this.ml.AppendMoves(ch);
}

Rubik.rgSliceNormal = [
	[-1, 0, 0], [1, 0, 0], [1, 0, 0],
	[0, -1, 0], [0, 1, 0], [0, 1, 0],
	[0, 0, -1], [0, 0, 1], [0, 0, 1],
	[1, 0, 0], [0, 1, 0], [0, 0, 1]
];

function Rubik.prototype.FAnimateMove(ch)
{
	var rgSD;

	dbg.Assert(!this.FBusy(), "Busy");

	rgSD = Rubik.SliceDir(ch);
	if (!rgSD)
		return false;

	this.iSliceActive = rgSD[0];
	this.dirSlice = rgSD[1];
	this.degRemain = 90;
	this.rotSlice = Rubik.rgSliceNormal[this.iSliceActive];
	this.GroupSlice(this.iSliceActive);

	return true;
}

function Rubik.prototype.FBusy()
{
	return this.iSliceActive != undefined;
}

function Rubik.prototype.DoMouse(x, y, fLeft, obj)
{
	var dx;

	if (fLeft)
		{
		if (this.xLast == undefined)
			dx = 0;
		else
			dx = x - this.xLast;
		this.xLast = x;
		this.grpView.Spin(dx*20);
		}
	else
		{
		this.xLast = undefined;
		}
}

// Put all cubes that will move in a single WildTangent group so they can
// be moved together.

function Rubik.prototype.GroupSlice(iSlice)
{
    var i, j, k;
    var grp;

    if (iSlice == undefined)
	{
	iSlice = this.iSliceActive;
	grp = this.grpAll;
	}
    else
	grp = this.grpSlice;

    for (i = 0; i < 3; i++)
	for (j = 0; j < 3; j++)
	    for(k = 0; k < 3; k++)
		{
		if (iSlice >= 9 || i == iSlice || j + 3 == iSlice || k + 6 == iSlice)
		    {
		    grp.AddObject(this.rgcube[i][j][k]);
		    }
		}
}

Rubik.ddeg = 180;

function Rubik.prototype.DoRender(msInterval, msTime)
{
	var deg = msInterval*Rubik.ddeg/1000;

	if (deg > this.degFlipRemain)
		deg = this.degFlipRemain;

	this.grpAll.wto.setRotation(1,0,0, deg);
	this.degFlipRemain -= deg;
	if (this.degFlipRemain > 0)
		return;
	
	if (!this.FBusy())
		{
		this.CheckProcess();
		return;
		}

	var deg = msInterval*Rubik.ddeg/1000;
	if (deg > this.degRemain)
		deg = this.degRemain;
	this.grpSlice.wto.setRotation(this.rotSlice[0], this.rotSlice[1], this.rotSlice[2],
		deg * this.dirSlice);
	this.degRemain -= deg;
	if (this.degRemain == 0)
		{
		this.GroupSlice();
		this.RotateCube(this.iSliceActive, this.dirSlice);
		this.iSliceActive = undefined;
		this.grpSlice.SetOrientation(0,0,1, 0,1,0);
		if (this.txtPerm != undefined)
			this.txtPerm.innerText = this.perm.StCycles();
		}
}

function Rubik.prototype.Flip()
{
	if (this.degFlipRemain == 0)
		this.degFlipRemain = 180;
}

Rubik.rgiiFromTo = [[2, 1, 0], [1, 2, 0], [1, 2, 0],
	[0, 2, 1], [2, 0, 1], [2, 0, 1],
	[1, 0, 2], [0, 1, 2], [0, 1, 2],
	[1, 2, 0], [2, 0, 1], [0, 1, 2]];

function Rubik.prototype.MapXYZ(iSlice, dir, xyz)
{
	var xyzNew = new Array;

	var iiFromTo = Rubik.rgiiFromTo[iSlice];
	var iFrom = iiFromTo[dir == 1 ? 0 : 1];
	var iTo = iiFromTo[dir == 1 ? 1 : 0];
	var iNull = iiFromTo[2];
	
	xyzNew[iTo] = xyz[iFrom];
	xyzNew[iFrom] = 2 - xyz[iTo];
	xyzNew[iNull] = xyz[iNull];
	return xyzNew;
}

function Rubik.prototype.RotateCube(iSlice, dir)
{
	var i, j, k;
	var rgcubeNew = new Array;

	for (i = 0; i < 3; i++)
		{
		rgcubeNew[i] = new Array();
		for (j = 0; j < 3; j++)
			{
			rgcubeNew[i][j] = new Array();
			for (k = 0; k < 3; k++)
				{
				if (iSlice >= 9 || i == iSlice || j + 3 == iSlice || k + 6 == iSlice)
					{
					xyz = this.MapXYZ(iSlice, -dir, [i, j, k]);
					rgcubeNew[i][j][k] = this.rgcube[xyz[0]][xyz[1]][xyz[2]];
					}
				else
					rgcubeNew[i][j][k] = this.rgcube[i][j][k];
				}
			}
		}

	this.rgcube = rgcubeNew;

	if (iSlice < 9)
		this.perm = this.perm.Compose(Rubik.Perm(iSlice, dir));
	// Re-orientation - not a permutation
	else
		{
		this.perm = Rubik.Perm(iSlice, -dir).Compose(this.perm).Compose(Rubik.Perm(iSlice, dir));
		}
}

function StFlip(st)
{
	return st.charAt(1) + st.charAt(0);
}

// Return the sequence of whole-cube moves to bring the cube at
// stFrom to stTo
function Rubik.StOrientCube(stFrom, stTo)
{
	var st = "";
	var stMove = "ijkIJK";

	if (!Rubik.mpFaceMove)
		{
		Rubik.mpFaceMove = new Object;

		// single moves
		for (i = 0; i < 6; i ++)
			{
			var ch = stMove.charAt(i);
			var rgSD = Rubik.SliceDir(ch);
			var perm = Rubik.Perm(rgSD[0], rgSD[1]);
			for (st in perm.objMap)
				{
				if (st.length > 2) continue;
				var stT = perm.Map(st);
				if (Rubik.mpFaceMove[st+stT] == undefined)
					{
					Rubik.mpFaceMove[st+stT] = ch;
					Rubik.mpFaceMove[StFlip(st)+StFlip(stT)] = ch;
					}
				}
			}

		// double moves
		for (i = 0; i < 6; i ++)
			{
			var ch1 = stMove.charAt(i);
			var rgSD = Rubik.SliceDir(ch1);
			var perm1 = Rubik.Perm(rgSD[0], rgSD[1]);
			for (j = 0; j < 6; j++)
				{
				if (j == i + 3 || i == j +3) continue;
				var ch2 = stMove.charAt(j);
				rgSD = Rubik.SliceDir(ch2);
				var perm2 = perm1.Compose(Rubik.Perm(rgSD[0], rgSD[1]));
				for (st in perm2.objMap)
					{
					if (st.length > 2) continue;
					var stT = perm2.Map(st);
					if (Rubik.mpFaceMove[st+stT] == undefined)
						{
						Rubik.mpFaceMove[st+stT] = ch1+ch2;
						Rubik.mpFaceMove[StFlip(st)+StFlip(stT)] = ch1+ch2;
						}
					}
				}
			}

		// triple moves
		for (i = 0; i < 6; i ++)
			{
			var ch1 = stMove.charAt(i);
			var rgSD = Rubik.SliceDir(ch1);
			var perm1 = Rubik.Perm(rgSD[0], rgSD[1]);
			for (j = 0; j < 6; j++)
				{
				if (j == i + 3 || i == j + 3) continue;
				var ch2 = stMove.charAt(j);
				rgSD = Rubik.SliceDir(ch2);
				var perm2 = perm1.Compose(Rubik.Perm(rgSD[0], rgSD[1]));
				for (k = 0; k < 6; k++)
					{
					if (k == j + 3 || j == k + 3) continue;
					var ch3 = stMove.charAt(k);
					rgSD = Rubik.SliceDir(ch3);
					var perm3 = perm2.Compose(Rubik.Perm(rgSD[0], rgSD[1]));
					for (st in perm3.objMap)
						{
						if (st.length > 2) continue;
						var stT = perm3.Map(st);
						if (st == stT) continue;
						if (Rubik.mpFaceMove[st+stT] == undefined)
							{
							Rubik.mpFaceMove[st+stT] = ch1+ch2+ch3;
							Rubik.mpFaceMove[StFlip(st)+StFlip(stT)] = ch1+ch2+ch3;
							}
						}
					}
				}
			}
		}

	if (stFrom.length > 2)
		{
		stFrom = stFrom.substr(0, 2);
		stTo = stTo.substr(0,2);
		}

	if (stFrom == stTo)
		return "";

	return Rubik.mpFaceMove[stFrom + stTo];
}

function Rubik.prototype.Scramble(cMoves)
{
	var i;
	var ich;
	var ichLast = -1;
	var st = "";
	var stMove = "lrdubf";
	var ch;

	if (cMoves == undefined) cMoves = 25;
	
	for (i = 0; i < cMoves; i++)
		{
		do
			{
			ich = Math.floor(Math.random()*6);
			}
		while (ich == ichLast);
		ichLast = ich;
		ch = stMove.charAt(ich);
		if (Math.random() < 0.5)
			ch = ch.toUpperCase();
		st += ch;
		}
	this.ml.Clear();
	var mv = this.ml.OpenBlock("Scramble");
	this.ml.AppendMoves(st);
	mv.Close();
}

function Rubik.prototype.CreateStage()
{
	drv.SetBackColor([35,10,100]);

	var lgt = new Light;
	lgt.SetColor([80,80,80]);
	lgt1 = new Light(4);
	lgt1.SetColor([255,255,255]);
	lgt1.MoveTo(85, 80, -125);
	lgt1.wtoI.setLinearAttenuation(0.1);

	lgt2 = new Light(4);
	lgt2.SetColor([255,255,255]);
	lgt2.MoveTo(0, 150, 0);
	lgt2.wtoI.setLinearAttenuation(0.1);

	lgt3 = new Light(4);
	lgt3.SetColor([255,255,255]);
	lgt3.MoveTo(-85, 80, -125);
	lgt3.wtoI.setLinearAttenuation(0.1);

	var cam = new Camera();
	cam.MoveTo(0,250,-500);
	cam.LookAt(this.grpAll);
	lgt1.LookAt(this.grpAll);
	lgt2.LookAt(this.grpAll);
	this.grpView = new Group(lgt1, lgt2, lgt3, cam);
	this.grpView.Spin(5);

	var p = new Plane(400,400);
	p.SetTexture("wood.wjp");
	p.Tip(90);
	p.MoveTo(0,-120,0);
}

function Rubik.SliceDir(ch)
{
	var chU = ch.toUpperCase();
	var iSlice = Rubik.stMoves.indexOf(chU);
	if (iSlice < 0)
		return null;
	dir = (ch == chU ? -1 : 1);
	return [iSlice, dir];
}

//
// Permutation
//
// Constructor can take cycle list as arguments.  E.g.
// (a b c)(d e) -> new Permutation([["a", "b", "c"], ["d", "e"]]);
//

function Permutation(rgPerms)
{
	var i;

	this.objMap = new Object;
	if (rgPerms == undefined)
		return;

	for (i = 0; i < rgPerms.length; i++)
		this.AddCycle(rgPerms[i]);
}

function Permutation.prototype.AddMap(stFrom, stTo)
{
	if (stFrom != stTo)
		this.objMap[stFrom] = stTo;
}

function Permutation.prototype.AddCycle(rgCycle)
{
	var i;

	for (i = 1; i < rgCycle.length; i++)
		{
		this.AddMap(rgCycle[i-1], rgCycle[i]);
		}
	this.AddMap(rgCycle[rgCycle.length-1], rgCycle[0]);
}

function Permutation.prototype.Map(stFrom)
{
	var iRot;
	var stTo;
	
	for (iRot = 0; iRot < stFrom.length; iRot++)
		{
		stTo = this.objMap[stFrom];
		if (stTo != undefined)
			{
			iRot = stFrom.length - iRot;
			return stTo.StRotate(iRot);
			}
		stFrom = stFrom.substring(1) + stFrom.charAt(0);
		}
	return stFrom;
}

// Compose current permutation with follow on permutation
function Permutation.prototype.Compose(p2)
{
	var st;
	var stMap;
	var pNew = new Permutation;

	for (st in this.objMap)
		{
		stMap = this.Map(st);
		pNew.AddMap(st, p2.Map(stMap));
		}
	for (st in p2.objMap)
		{
		if (this.Map(st) == st)
			pNew.AddMap(st, p2.Map(st));
		}
	return pNew;
}

function Permutation.prototype.MapPower(st, n)
{
	var i;

	for (i = 0; i < n; i++)
		st = this.Map(st);
	return st;
}

function Permutation.prototype.Power(n)
{
	var pNew = new Permutation;

	for (st in this.objMap)
		pNew.AddMap(st, this.MapPower(st, n));

	return pNew;
}

function Permutation.prototype.Inverse()
{
	var pNew = new Permutation;
	var stMap;

	for (st in this.objMap)
		{
		stMap = this.Map(st);
		pNew.AddMap(stMap, st);
		}
	return pNew;
}

function Permutation.prototype.StMap()
{
	var st = "";
	var stElem;

	for (stElem in this.objMap)
		{
		st += "(" + stElem + ", " + this.Map(stElem) + ")\n";
		}
	return st;
	
}

function Permutation.prototype.FHasMap(rgMap)
{
	var i;
	var stLoc = "";

	for (i = 0; i < rgMap.length; i++)
		{
		if (rgMap[i] == "")
			stLoc = "";
		else if (stLoc == "")
			stLoc = rgMap[i];
		else
			{
			stLoc = this.Map(stLoc);
			if (stLoc != rgMap[i])
				return false;
			}
		}
	return true;
}

// Takes array of form:
// [ ["moveGen", [["Loc", "Solution"], ... ]], ... ]
// Tries up to 4th power of moveGen, looking for a pattern match for the location of the stLoc piece.
// If so, returns the moveGen followed by the Solution (substituting the reverse moveGen for the letter "P").
function Permutation.prototype.StSolveVia(stPiece, rgPatterns)
{
	var iPat;
	var i;
	var iLoc;
	var Loc;
	var stLoc;

	for (iPat in rgPatterns)
		{
		var rgPat = rgPatterns[iPat];
		var stGen1 = rgPat[0];
		var rgLoc = rgPat[1];
		var perm = this;
		var stGen = "";
		// Assume at most 4 uses of the move generator
		for (i = 0; i < 4; i++)
			{
			var stLoc = perm.Map(stPiece);
			for (iLoc in rgLoc)
				{
				var Loc = rgLoc[iLoc][0];
				// Just looking for a single location
				if (typeof(Loc) == "string" ? (Loc == stLoc) : perm.FHasMap(Loc))
					{
					var stMove = stGen + rgLoc[iLoc][1].replace(/P/g, Rubik.StInverse(stGen));
					return stMove;
					}
				}
			stGen += stGen1;
			perm = perm.ApplyMoves(stGen1);
			}
		}
	return "";
}

function Permutation.prototype.ApplyMoves(stMoves)
{
	var ich;
	var perm = this;
	var rgSD;

	for (ich = 0; ich < stMoves.length; ich++)
		{
		rgSD = Rubik.SliceDir(stMoves.charAt(ich));
		if (!rgSD)
			continue;
		if (rgSD[0] < 9)
			perm = perm.Compose(Rubik.Perm(rgSD[0], rgSD[1]));
		else
			perm = Rubik.Perm(rgSD[0], -rgSD[1]).Compose(perm).Compose(Rubik.Perm(rgSD[0], rgSD[1]));
		}
	return perm;
}

// Returns index if two cube names are for the same cube (index
// is amount of flip/rotation needed to move 1st to 2nd).
// Null if not.

function IchEquiv(st1, st2)
{
	for (iRot = 0; iRot < st1.length; iRot++)
		{
		if (st1 == st2)
			{
			return iRot;
			}
		st1 = st1.StRotate(1);
		}
	return null;
}

function Permutation.prototype.ClearMarks()
{
	this.objMark = new Object;
}

function Permutation.prototype.Mark(st)
{
	var iRot;

	for (iRot = 0; iRot < st.length; iRot++)
		{
		this.objMark[st] = true;
		st = st.StRotate(1);
		}
}

function Permutation.prototype.FMark(st)
{
	return (this.objMark[st]);
}

Permutation.stRot = ["", "+", "-"];

function Permutation.prototype.StCycles()
{
	var st = "";
	var stElem;
	var stInit;
	var iRot;

	this.ClearMarks();
	for (stInit in this.objMap)
		{
		if (this.FMark(stInit))
			continue;
		if (st != "")
			st += " ";
		st += "(" + stInit;
		this.Mark(stInit);
		stElem = this.Map(stInit);
		while (stElem != undefined && !this.FMark(stElem))
			{
			st += " " + stElem;
			this.Mark(stElem);
			stElem = this.Map(stElem);
			}
		if (stElem == undefined)
			{
			st += " ???";
			stElem = stInit;
			}
		st += ")";
		iRot = IchEquiv(stInit, stElem);
		st += Permutation.stRot[iRot];
		}
	if (st == "")
		st = "I";
	return st;
}

var rgMoveCatalog = [
	["ff", "1a"],
	["FUru", "1b"],
	["DRdr", "2a"],
	["dfDF", "2b"],
	["fddF dd Rdr", "2c"],
	["lu uuffuuffuuff UL", "3a"],
	["Bu rruurruurruu Ub", "3b"],
	["b luLU B", "4a"],
	["b ulUL B", "4b"],
	["rrD uuRlffrL drr", "6bi"],
	["rrD RlffrLuu drr", "6bii"],
	["rrddbbd llffllffllff Dbbddrr", "6c"],
	["L urUR l ruRU", "7bi"],
	["urUR L ruRU l", "7bii"],
	["b luLU luLU luLU B", "7c"],
	["Rbb frFR frFR frFR bbr", "7d"],
	["fdFD fdFD", "8a"],
	["dfDF dfDF", "8b"],
	["ffuu ffuu ffuu", "P1(f,u)"],
	["fuFU", "P2(f,u)"],
	["fuFU fuFU", "P3(f,u) = P2(f,u)^2"],
	["fuFU fuFU fuFU", "P4(f,u) = P2(f,u)^3"],
	["Rl ff rL uu", ""]
	];

function StMoveCatalog()
{
	var st = ""

	st += "<TABLE class=doTable><TR>";
	st += "<TD class=doTitle>Moves</TD>";
	st += "<TD class=doTitle>Effect</TD>";
	st += "<TD class=doTitle>Notes</TD>";
	st += "<TD class=doTitle>Try It</TD>";
	st += "</TR>";

	for (i = 0; i < rgMoveCatalog.length; i++)
		{
		stMove = rgMoveCatalog[i][0];
		stNote = rgMoveCatalog[i][1];
		var perm = new Permutation;
		perm = perm.ApplyMoves(stMove);

		st += "<TR><TD>" + stMove + "</TD><TD>" + perm.StCycles() + "</TD><TD>" + 
			stNote + "</TD>";
		st += "<TD>" + cmd.StButton("Try It", "r.DoProcess('" + stMove + "');") + "</TD>";
		st += "</TR>";
		}

	st += "</TABLE>";

	return st;		
}

function MoveList()
{
	this.Clear();
}

function MoveList.prototype.Clear()
{
	this.stMoves = "";
	this.stProcess = "";
	this.ichWall = 0;
	this.rgmv = new Array;
	this.OpenBlock("Move History");
}

function MoveList.prototype.Ich()
{
	return this.stMoves.length;
}

function MoveList.prototype.IchWall()
{
	this.ichWall = this.stMoves.length;
	return this.ichWall;
}

function MoveList.prototype.ChGet()
{
	var ch;

	if (this.stProcess == "")
		return null;

	ch = this.stProcess.charAt(0);
	this.stProcess = this.stProcess.substr(1);
	return ch;
}

function MoveList.prototype.AppendMoves(stAdd)
{
	var ich;

	this.stProcess = MoveList.StAppendMoves(this.stProcess, stAdd);

	this.stMoves = this.stMoves.substring(0, this.ichWall) +
		MoveList.StAppendMoves(this.stMoves.substring(this.ichWall), stAdd);

	if (this.txtHistory != undefined)
		this.txtHistory.innerHTML = this.StHTML();
}

function MoveList.StAppendMoves(st, stAdd)
{
	var chLast;


	for (ich = 0; ich < stAdd.length; ich++)
		{
		ch = stAdd.charAt(ich);
		if (ch == " ")
			continue;
		if (st == "")
			{
			st += ch;
			continue;
			}

		chLast = st.charAt(st.length-1);
		if (ch == ChangeCase(chLast))
			{
			st = st.substr(0, st.length-1);
			continue;
			}

		if (st.length >= 2 && st.substr(st.length-2, 2) == ch + ch)
			{
			st = st.substr(0, st.length-2) + ChangeCase(ch);
			continue;
			}
		st += ch;
		}
	return st;
}

function MoveList.prototype.ChLast(ichBack)
{
	if (this.stMoves.length - this.ichWall < ichBack)
		return "";
	return this.stMoves.charAt(this.stMoves.length-ichBack);
}

function MoveList.prototype.OpenBlock(stName)
{
	var mv = new MoveBlock(this, stName);
	this.rgmv.push(mv);
	return mv;
}

function MoveList.prototype.StHTML()
{
	var st = "";
	var rgmvOpen = new Array;
	var imvNext = 0;
	var chPrev = null;
	var iMoves = 0;
	var clsCur = null;

	for (ich = 0; ich < this.stMoves.length; ich++)
		{
		// Close ending blocks
		for (imv = rgmvOpen.length-1; imv >=0; imv--)
			{
			var mv = rgmvOpen[imv];
			if (!mv.ichMac || mv.ichMac > ich)
				break;
			st += mv.StClose(iMoves);
			rgmvOpen.pop();
			chPrev = null;
			}
		// Open new blocks
		for (;imvNext < this.rgmv.length; imvNext++)
			{
			var mv = this.rgmv[imvNext];
			if (mv.ichMin > ich)
				break;
			// Don't open empty blocks
			if (mv.ichMin == mv.ichMac)
				continue;
			st += mv.StOpen(iMoves);
			rgmvOpen.push(mv);
			chPrev = null;
			}
		ch = this.stMoves.charAt(ich);

		if (ch == chPrev)
			{
			st += "<sup>2</sup>";
			chPrev = null;
			continue;
			}

		chUpper = ch.toUpperCase();
		clsPrev = clsCur;
		clsCur = ("IJK".indexOf(chUpper) >= 0 ? 1 : 2);
		if (clsPrev != null && clsPrev != clsCur)
			{
			st += " ";
			iMovesMin = iMoves;
			}

		if (clsCur == 2)
			iMoves++;
		st += chUpper;
		chPrev = ch;
		if (ch == chUpper)
			st += "'";
		}

	for (imv = rgmvOpen.length-1; imv >= 0; imv--)
		{
		var mv = rgmvOpen[imv];
		st += mv.StClose(iMoves);
		}
	return st;
}

function MoveBlock(ml, stName)
{
	this.stName = stName;
	this.ichMin = ml.IchWall();
	this.ml = ml;
}

function MoveBlock.prototype.Close()
{
	this.ichMac = this.ml.IchWall();
}

function MoveBlock.prototype.StOpen(iMoves)
{
	var st = "";

	this.iMoves = iMoves;
	st += "<TABLE class=History><TR><TH COLSPAN=2>";
	st += this.stName;
	st += "</TD></TR><TR><TD style=width:10></TD><TD>";
	return st;
}

function MoveBlock.prototype.StClose(iMoves)
{
	var st = "";
	var cTurns = 0;

	st += "</TD></TR>";
	st += "<TR><TD COLSPAN=2><I>Moves: " + (iMoves - this.iMoves);

	var ichMac = this.ichMac;
	if (!ichMac)
		ichMac = this.ml.Ich();
	for (ich = this.ichMin; ich < ichMac; ich++)
		{
		if ("IJKijk".indexOf(this.ml.stMoves.charAt(ich)) == -1)
			cTurns++;
		}
	if (iMoves - this.iMoves != cTurns)
		st += " (" + cTurns + " quarter turns)";
	st += "</I></TD></TR></TABLE>";
	return st;
}
