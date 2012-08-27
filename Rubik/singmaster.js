//
// Solution from David Singmaster's Notes on Rubik's Magic Cube, 1981
//
// Copyright 2003, Mike Koss (mike03@mckoss.com)

function Singmaster(ml)
{
	this.ml = ml;
}

function Singmaster.prototype.Move(st)
{
	this.ml.AppendMoves(st);
	this.perm = this.perm.ApplyMoves(st);
}

function Singmaster.prototype.Solve(perm)
{
	var mv = this.ml.OpenBlock("David Singmaster Solution");

	this.perm = perm;
	
	this.SolveUEdges();
	this.SolveUCorners();
	this.Move("kk");
	this.SolveMEdges();
	this.OrientDEdges();
	this.PlaceDEdges();
	this.PlaceDCorners();
	this.OrientDCorners();
	this.Move("kk");

	mv.Close();
}

function Singmaster.prototype.SolveUEdges()
{
	var i;
	var rgPatterns = [
		["d", [ ["DF", "ff"], ["FD", "FUru"] ]],
		["y", [ ["LF", "fP"], ["RF", "FP"] ]],
		["u", [ ["UF", "ffPff"], ["FU", "fPUru"] ]]
	];

	var mv = this.ml.OpenBlock("Solve U Edges");

	for (i = 0; i < 4; i++)
		this.Move(this.perm.StSolveVia("UF", rgPatterns) + "j");

	mv.Close();
}

function Singmaster.prototype.SolveUCorners()
{
	var i;
	var rgPatterns = [
		["d", [ ["RDF", "df DF"], ["FRD", "DR dr"], ["DFR", "fDF Rddr"] ]],
		["u", [ ["URF", "fdF P fDF"], ["RFU", "Rddr P fddF"], ["FUR", "fddF P Rddr"] ]]
	];

	var mv = this.ml.OpenBlock("Solve U Corners");

	for (i = 0; i < 4; i++)
		this.Move(this.perm.StSolveVia("URF", rgPatterns) + "j");

	mv.Close();
}


function Singmaster.prototype.SolveMEdges()
{
	var i;
	var rgPrep = [
		["y", [ ["RF", "BU rruu rruu rruu ubP"], ["FR", "lU ffuu ffuu ffuu uLP"] ]]
	];
	var rgPatterns = [
		["u", [ ["UB", "BU rruu rruu rruu ub"], ["LU", "lU ffuu ffuu ffuu uL"] ]]
	];

	
	var mv = this.ml.OpenBlock("Solve Middle Edges");

	for (i = 0; i < 4; i++)
		{
		if (this.perm.Map("RF") != "RF")
			this.Move(this.perm.StSolveVia("RF", rgPrep));

		this.Move(this.perm.StSolveVia("RF", rgPatterns) + "j");
		}

	mv.Close();
}

function Singmaster.prototype.OrientDEdges()
{
	var i, j;
	var st = "";
	var stUp = "";
	// I need an ordered list of POSITIONS - and what cubes they contain.  This is
	// inverse of list of CUBES and what position they are in.
	var perm = this.perm.Inverse();

	var mv = this.ml.OpenBlock("Orient D Edges");

	for (i = 0; i < 4; i++)
		stUp += perm.Map("U" + "FRBL".charAt(i)).charAt(0) == "U" ? "U" : "X";

Loop:
	for (j = 0; j < 4; j++)
		{
		switch (stUp)
			{
		case "UUUU":
			break Loop;
		case "XUXU":
			st += "b luLU B";
			break Loop;
		case "UUXX":
			st += "b ulUL B";
			break Loop;
		case "XXXX":
			st += "b luLU B jj b ulULB";
			break Loop;
			}
		stUp = stUp.StRotate(1);
		st += "j";
		}
	this.Move(st);
	mv.Close();
}

function Singmaster.prototype.PlaceDEdges()
{
	var j;
	var st = "";
	var perm = this.perm;
	var rgPatterns = [
		["u", [ [["UF", "UR", "UB", "UF"], "rrD uuR lffrL drr"],
			[["UF", "UB", "UR", "UF"], "rrD Rlffr Luu drr"],
			[["UF", "UR", "UF", "", "UL", "UB", "UL"], "rrddbbd llff llff llff Dbbddrr"],
			[["UF", "UF", "", "UR",  "UR", "", "UB", "UB", "", "UL", "UL"], " "] ]]	// no zero-length solution
	];

	var mv = this.ml.OpenBlock("Place D Edges");

	for (j = 0; j < 4; j++)
		{
		var stMove = perm.StSolveVia("", rgPatterns);
		if (stMove != "")
			{
			this.Move(st+stMove);
			mv.Close();
			return;
			}
		st += "j";
		perm = perm.ApplyMoves("j");
		}
		
	dbg.Assert(st != "", "Could not find Down edge placement");
}

function Singmaster.prototype.PlaceDCorners()
{
	var j;
	var perm = new Permutation;
	var rgCubes = ["ULB", "UBR", "URF", "UFL"];
	var rgPatterns = [
		["j", [ [["UFL", "ULB", "UBR", "UFL"], "L urUR l ruRU"],
			[["UFL", "UBR", "ULB", "UFL"], "urUR L ruRU l"],
			[["UFL", "URF", "UFL", "", "ULB", "UBR", "ULB"], "b luLU luLU luLU B"],
			[["UFL", "UBR", "UFL", "", "URF", "ULB", "URF"], "Rbb frFR frFR frFR bbr"] ]]
	];

	var mv = this.ml.OpenBlock("Place D Corners");

	for (i = 0; i < rgCubes.length; i++)
		{
		var stTarget = this.perm.Map(rgCubes[i]);
		while (stTarget.charAt(0) != "U")
			stTarget = stTarget.StRotate(1);
		perm.AddMap(stTarget, rgCubes[i]);
		}

	this.Move(perm.StSolveVia("", rgPatterns));
	mv.Close();
}

function Singmaster.prototype.OrientDCorners()
{
	var j;
	var perm = this.perm;
	var rgPatterns = [
		["", [ ["RFU", "dfDFdfDF"],		// counter-clockwise
			["FUR", "fdFDfdFD"],	// clockwise
			["URF", ""] ]]
	];

	var mv = this.ml.OpenBlock("Orient D Corners");

	for (j = 0; j < 4; j++)
		{
		this.Move(perm.StSolveVia("URF", rgPatterns)+"u");
		perm = perm.ApplyMoves("j");
		}

	mv.Close();
}
