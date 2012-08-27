//
// Solution adapted from manual solving techniques of Frank Lee - flee@flee.com
//
// Copyright 2003, Mike Koss (mike03@mckoss.com)

function FLee(ml)
{
	this.ml = ml;
}

function FLee.prototype.Move(st)
{
	this.ml.AppendMoves(st);
	this.perm = this.perm.ApplyMoves(st);
}

function FLee.prototype.Solve(perm)
{
	var mv = this.ml.OpenBlock("Frank Lee Solution");

	this.perm = perm;	
	this.SolveUPieces();
//	this.SolveMEdges();
//	this.LastUPiece();
//	this.LastMEdge();


	mv.Close();
}

FLee.rgUCubes = ["UFL", "UF", "URF", "UL", "UR", "ULB", "UB", "UBR"];

function FLee.prototype.SolveUPieces()
{
	var i;
	var mtRoot = new MoveTree(this.perm, "", FLee.UScore);

	var mv = this.ml.OpenBlock("Solve U Face - save one corner");

	while (mtRoot.cScore < 3)
		{
alert("Best " + mtRoot.cScore + " with " + mtRoot.stMoves + "(" + MoveTree.c + ")");
var cLevel = 0;
		do
			{
			mtRoot.Expand();
cLevel++;
alert("Level: " + cLevel);
			mtBest = mtRoot.MTBest();
			}
		while (mtBest.cScore <= mtRoot.cScore);
		mtRoot = mtBest;
		}

	this.Move(mtRoot.stMoves);

	mv.Close();
}

function FLee.UScore(perm)
{
	var cScoreBest = 0;
	var i, j;
	
	for (j = 0; j < 4; j++)
		{
		var cCorners = 0;
		var cScore = 0;
		for (i = 0; i < FLee.rgUCubes.length; i++)
			{
			var stCube = FLee.rgUCubes[i];
			if (perm.Map(stCube) == stCube)
				{
				if (stCube.length == 3)
					{
					cCorners++;
					if (cCorners < 4)
						cScore++;
					}
				else
					cScore++;
				}
			}
		if (cScore > cScoreBest)
			cScoreBest = cScore;
		perm = perm.ApplyMoves("u");
		}
	return cScoreBest;
}

MoveTree.c = 0;

function MoveTree(perm, stMoves, fnScore)
{
	this.perm = perm;
	this.fnScore = fnScore;
	this.stMoves = stMoves;
	this.cScore = fnScore(perm);
	this.rgmtChild = new Array;
++MoveTree.c;
}

function MoveTree.prototype.Expand()
{
	var i;
	var stMoves = "lrdufbLRDUFBxyzXYZ";

	if (this.rgmtChild.length == 0)
		{
		for (i = 0; i < stMoves.length; i++)
			{
			ch = stMoves.charAt(i);
			if (this.stMoves.charAt(this.stMoves.length-1) == ChangeCase(ch))
				continue;
			var perm = this.perm.ApplyMoves(ch);
			mt = new MoveTree(perm, this.stMoves + ch, this.fnScore);
			this.rgmtChild.push(mt);
			}
		return;
		}

	for (i = 0; i < this.rgmtChild.length; i++)
		this.rgmtChild[i].Expand();
}

function MoveTree.prototype.MTBest()
{
	var i;
	var mtBest = this;

	for (i = 0; i < this.rgmtChild.length; i++)
		{
		var mt = this.rgmtChild[i].MTBest();
		if (mt.cScore > mtBest.cScore)
			mtBest = mt;
		}

	return mtBest;	
}
