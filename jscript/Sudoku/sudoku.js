// Intialize iteration helpers
var i;

Sudoku.typeRow = 1;
Sudoku.typeCol = 2;
Sudoku.typeBlock = 3;

function Sudoku()
{
	var i;

	this.rgcells = new Array;

	this.rgcellRows = new Array;
	this.rgcellCols = new Array;
	this.rgcellBlocks = new Array;
	for (i = 0; i < 9; i++)
		{
		this.rgcellRows[i] = new Array;
		this.rgcellRows[i].stName = "Row " + Sudoku.StNameRowCol(i, undefined);
		this.rgcellRows[i].type = Sudoku.typeRow;
		
		this.rgcellCols[i] = new Array;
		this.rgcellCols[i].stName = "Column " + Sudoku.StNameRowCol(undefined, i);
		this.rgcellCols[i].type = Sudoku.typeCol;


		this.rgcellBlocks[i] = new Array;
		this.rgcellBlocks[i].stName = "Block " + (i+1);
		this.rgcellBlocks[i].type = Sudoku.typeBlock;
		}

	for (i = 0; i < 81; i++)
		new Cell(this, i);

	this.numSet = 0;
	this.fPageBreak = false;
	this.nPass = 1;
	this.cCost = 0;
	this.fIllegal = false;
	this.fInitDisplay = false;
	this.fSilent = false;

	// Actions queue
	this.rgact = new Array;
	this.iactCur = 0;
}

Sudoku.prototype.Cell = function(row, col)
{
	return this.rgcells[row * 9 + col];
}

Sudoku.prototype.FindSingle = function(rgcell)
{
	var num;
	var icell;
	var rgcnum;

	rgcnum = Sudoku.Incidence(rgcell);

	for (num = 1; num <=9; num++)
		{
		if (rgcnum[num] != 1)
			continue;
		for (icell = 0; icell < rgcell.length; icell++)
			{
			var cell = rgcell[icell];
			if (cell.num != undefined || !cell.rgNum[num])
				continue;
			this.Action(Action.aSet, cell, num, rgcell.stName, 9);
			break;
			}
		}
}

Sudoku.prototype.FindPairs = function(rgcell)
{
	var i;
	var j;
	var cell;
	var cell2;
	var rgcnum;
	var num;
	var num2;
	var num3;

	rgcnum = Sudoku.Incidence(rgcell);

	// Look for two cells that are the only two to contain values, num, and num2.
	// If found, remove all other possible values from those cells.
	for (num = 1; num <= 9; num++)
		{
		if (rgcnum[num] != 2)
			continue;
NextNum:
		for (num2 = num+1; num2 <= 9; num2++)
			{
			if (rgcnum[num2] != 2)
				continue;

			// Look for cells that have both these values
			for (i = 0; i < rgcell.length; i++)
				{
				cell = rgcell[i];
				if (cell.num || !cell.rgNum[num] || !cell.rgNum[num2])
					continue;

				for (j = i+1; j < rgcell.length; j++)
					{
					cell2 = rgcell[j];
					if (cell2.num || !cell2.rgNum[num] || !cell2.rgNum[num2])
						continue;

					// First remove any other possible values from those cells.
					for (num3 = 1; num3 <= 9; num3++)
						{
						if (num3 == num || num3 == num2)
							continue;
						var stNote = "pair " + num + "/" + num2 + " at " + cell.StName() + "/" + cell2.StName();
						this.Action(Action.aExclude, cell, num3, stNote, 9);
						this.Action(Action.aExclude, cell2, num3, stNote, 9);
						}

					// Next, remove any redundant values of the pair
					if (cell.Row() == cell2.Row())
						this.ExcludePairsPart(cell.row, cell, cell2);
					if (cell.Col() == cell2.Col())
						this.ExcludePairsPart(cell.col, cell, cell2);
					if (cell.Block() == cell2.Block())
						this.ExcludePairsPart(cell.block, cell, cell2);

					// No need to consider num,num2 again.
					rgcnum[num] = undefined;
					rgcnum[num2] = undefined;
					break NextNum;
					}
				
				}
			}
		}
}

// Colinears are cells that lie in a row or column AND are contained within a single block.
//
// If the cells in a block that can be a given value are all in a row, then we can exclude that number
// from the rest of the row (outside the block).
// Conversly, if all the cells that can be a given value in a row, are contained in a single block, then
// we can exclude that number from the rest of the cells in the block.
Sudoku.prototype.FindColinears = function(rgcell, num)
{
	var cell;
	var i;
	var rgcellMatch = new Array;
	var fMatchRow;
	var fMatchCol;

	for (i = 0; i < rgcell.length; i++)
		{
		cell = rgcell[i];
		if (cell.num != undefined || !cell.rgNum[num])
			continue;

		rgcellMatch.push(cell);

		if (rgcellMatch.length == 1)
			continue;

		if (cell.Block() != rgcellMatch[0].Block())
			return;
		
		if (rgcellMatch.length == 2)
			{
			fMatchRow = cell.Row() == rgcellMatch[0].Row();
			fMatchCol = cell.Col() == rgcellMatch[0].Col();
			if (!fMatchRow && !fMatchCol)
				return;
			continue;
			}

		if (fMatchRow && cell.Row() != rgcellMatch[0].Row())
			return;

		if (fMatchCol && cell.Col() != rgcellMatch[0].Col());
			return;
		}

	if (rgcellMatch.length < 2)
		return;

	var rgcellExclude;
	var stNote;

	if (rgcell.type == Sudoku.typeBlock)
		{
		// If we found a co-linear in a block scan, we can remove all the other values in this row(column).
		stNote = "value " + num + " only in block " + (rgcellMatch[0].Block()+1);
		if (fMatchRow)
			rgcellExclude = rgcellMatch[0].row;
		else
			rgcellExclude = rgcellMatch[0].col;
		}
	else
		{
		// Found co-linear in a row/column scan.  Remove all other values from this block
		stNote = "value " + num + " must be in " + (fMatchRow ? "Row " + Sudoku.StNameRowCol(rgcellMatch[0].Row(), undefined) :
													"Column " + Sudoku.StNameRowCol(undefined, rgcellMatch[0].Col()));
		rgcellExclude = rgcellMatch[0].block;
		}

	for (i = 0; i < rgcellExclude.length; i++)
		{
		cell = rgcellExclude[i];
		if (cell.num != undefined || !cell.rgNum[num])
			continue;
		if (cell.InCells(rgcell))
			continue;

		this.Action(Action.aExclude, cell, num, stNote, 9);
		}
}

// Catch up any outstanding commands, and then display the board.
Sudoku.prototype.ExecDisplay = function(fDisplayBoard)
{
	var stPre;
	var st = "";
	var stChunk = "";
	var fChunky = false;

	this.fProgress = false;

	if (this.iactCur < this.rgact.length)
		{
		st += "<BR/><B>Pass " + this.nPass + "</B>: ";
		stPre = "";
		for (; this.iactCur < this.rgact.length; this.iactCur++)
			{
			var act = this.rgact[this.iactCur];
			if (act.DoIt())
				{
				if (act.a == Action.aHeading)
					{
					if (fChunky)
						st += stChunk;
					fChunky = false;
					stChunk = "";
					stPre = "<BR/>";
					}
				stChunk += stPre + act.StDisplay();
				this.cCost += act.cCost;
				if (act.a == Action.aHeading)
					stPre = ": ";
				else
					{
					stPre = ", ";
					this.fProgress = true;
					fChunky = true;
					}
				}
			}

		if (fChunky)
			st += stChunk;

		st += " <I>(Total Cost = " + this.cCost + "</I>)";
		}

	if (this.fProgress)
		{
		if (!this.fSilent)
			DW(st);
		this.nPass++;
		}

	if (fDisplayBoard && !this.fSilent && (this.fInitDisplay || this.fProgress))
		DW(this.StDisplay());
	this.fInitDisplay = false;
	this.fPageBreak = true;
}

Sudoku.prototype.Solve = function()
{
	this.fInitDisplay = true;
	this.ExecDisplay(true);

SolveLoop:
	while (this.numSet != 81)
		{
		if (this.fIllegal)
			return;

		do
			{
			this.ScanConstraints();
			this.ExecDisplay(false);
			if (this.fIllegal)
				{
				this.fInitDisplay = true;
				break SolveLoop;
				}
			}
		while (this.fProgress);

		if (this.numSet == 81)
			{
			this.fInitDisplay = true;
			break SolveLoop;
			}

		// Find pairs
		this.Heading("Pairs");
		var x;
		for (x = 0; x < 9; x++)
			{
			this.FindPairs(this.rgcellRows[x]);
			this.FindPairs(this.rgcellCols[x]);
			this.FindPairs(this.rgcellBlocks[x]);
			}

		// Remove co-linear numbers.
		this.Heading("Co-Linears");
		var num;
		for (num = 1; num <= 9; num++)
			{
			for (x = 0; x < 9; x++)
				{
				this.FindColinears(this.rgcellRows[x], num);
				this.FindColinears(this.rgcellCols[x], num);
				this.FindColinears(this.rgcellBlocks[x], num);
				}
			}

		this.ExecDisplay(true);

		if (this.fIllegal)
			{
			this.fInitDisplay = true;
			break SolveLoop;
			}

		// Try backtracking solution if we get stuck with straight forward methods
		if (!this.fProgress)
			{
			if (!this.Guess())
				break SolveLoop;
			this.ExecDisplay(true);
			}
		}
	this.ExecDisplay(true);
}

// Guess at a cell value.
Sudoku.prototype.Guess = function()
{
	var icell;

	for (icell = 0; icell < 81; icell++)
		{
		var cell = this.rgcells[icell];
		if (cell.cnumPossible != 2)
			continue;

		var num;
		var num1 = undefined;
		var num2 = undefined;
		for (num = 1; num <= 9; num++)
			{
			if (!cell.rgNum[num])
				continue;
			if (!num1)
				{
				num1 = num;
				continue;
				}
			num2 = num;
			break;
			}
		if (this.TryGuess(cell, num1, num2) || this.TryGuess(cell, num2, num1))
			return true;
return false;
		}
	return false;
}

Sudoku.prototype.TryGuess = function(cell, num1, num2)
{
	var sudT = new Sudoku();
	sudT.fSilent = true;
	sudT.Copy(this);
	sudT.DoSet([[cell.Row()+1, cell.Col()+1, num1]]);
	sudT.Solve();
	if (sudT.numSet == 81)
		{
		this.Action(Action.aSet, cell, num1, "Guessing " + num1 + " will solve.", 0);
		return true;
		}
	if (sudT.fIllegal)
		{
		this.Action(Action.aSet, cell, num2, "Value of " + num1 + " is impossible.", sudT.cCost);
		return true;
		}
	return false;
}

Sudoku.prototype.Copy = function(sudSrc)
{
	var icell;
	var cellSrc;
	var cellDst;

	this.numSet = sudSrc.numSet;
	this.fIllegal = sudSrc.fIllegal;

	for (icell = 0; icell < 81; icell++)
		{
		cellSrc = sudSrc.rgcells[icell];
		cellDst = this.rgcells[icell];
		cellDst.Copy(cellSrc);
		}
}

Sudoku.prototype.Action = function(a, cell, num, stNote, cCost)
{
	this.rgact.push(new Action(a, cell, num, stNote, cCost));
	if (a != Action.aHeading)
		this.fProgress = true;
}

Sudoku.prototype.Heading = function(stNote)
{
	this.Action(Action.aHeading, null, null, stNote);
}

Sudoku.prototype.Illegal = function(stNote)
{
	this.Action(Action.aError, null, null, stNote);
	this.fIllegal = true;
}

Sudoku.prototype.ScanConstraints = function()
{
	var cell;
	var i;

	var x;

	// Look for cells that have been constrained to a single value.
	for (i = 0; i < 81; i++)
		{
		cell = this.rgcells[i];
		if (cell.cnumPossible == 1)
			{
			for (num = 1; num <= 9; num++)
				{
				if (cell.rgNum[num])
					{
					this.Action(Action.aSet, cell, num, undefined, 1);
					break;
					}
				}
			}
		}

	// Look for the only cell in a row/col/block that can be a particular value.
	for (x = 0; x < 9; x++)
		{
		this.FindSingle(this.rgcellRows[x]);
		this.FindSingle(this.rgcellCols[x]);
		this.FindSingle(this.rgcellBlocks[x]);
		}
}

// Input: [[rw, col, num], ... ] (1-based coordinates here)
Sudoku.prototype.DoSet = function(rgset)
{
	var iset;
	var set;
	var cell;

	for (iset = 0; iset < rgset.length; iset++)
		{
		set = rgset[iset];
		cell = this.Cell(set[0]-1, set[1]-1);
		if (cell.num == set[2])
			continue;
		if (cell.num != undefined)
			{
			alert("Error: " + cell.StName() + " can't be set to " + set[2] + " (already " + cell.num + ")");
			continue;
			}
		cell.Set(set[2]);
		}
}

Sudoku.prototype.ExcludePairsPart = function(rgcell, cell1, cell2)
{
	var i;
	var cell;

	for (i = 0; i < rgcell.length; i++)
		{
		cell = rgcell[i];
		if (cell == cell1 || cell == cell2)
			continue;
		this.Action(Action.aExclude, cell, cell1.num, "pairs", 1);
		this.Action(Action.aExclude, cell, cell2.num, "pairs", 1);
		}
}

Sudoku.Incidence = function(rgcell)
{
	var cell;
	var rgcnum = new Array(9);
	
	for (num = 1; num <= 9; num++)
		rgcnum[num] = 0;

	// Count the incidence of all digits in the block
	for (i = 0; i < rgcell.length; i++)
		{
		cell = rgcell[i];
		if (cell.num)
			continue;
		for (num = 1; num <= 9; num++)
			if (cell.rgNum[num])
				rgcnum[num]++;
		}
	return rgcnum;
}

Sudoku.ExcludeCells = function(rgcell, num)
{
	var icell;

	for (icell = 0; icell < rgcell.length; icell++)
		{
		rgcell[icell].Exclude(num);
		}
}

Sudoku.prototype.StDisplay = function()
{
	var st;
	var row;
	var col;
	var num;
	st = "";

	st += "<TABLE ";
	if (this.fPageBreak)
			st += "style='page-break-before: always;' ";
	st += "class='Sud' CELLPADDING=0 CELLSPACING=0>";

	st += "<TR><TH class='Sud'>" + this.numSet + "</TH>";
	for (col = 0; col < 9; col++)
		{
		if (col != 0 && (col % 3 == 0))
			st += "<TH class='Spacer'></TH>";
		st += "<TH class='Sud'>" + Sudoku.StNameRowCol(undefined, col) + "</TH>";
		}

	for (row = 0; row < 9; row++)
		{
		if (row != 0 && (row % 3 == 0))
			{
			st += "<TR>";
			st += "<TH class='Spacer'></TH>";
			for (col = 0; col < 9 + 3 -1; col++)
				st += "<TD class='Spacer'></TD>";
			st += "</TR>";
			}
		st += "<TR>";
		st += "<TH class='Sud'>" + Sudoku.StNameRowCol(row, undefined) + "</TH>";
		for (col = 0; col < 9; col++)
			{
			if (col != 0 && (col % 3 == 0))
				st += "<TD class='Spacer'></TD>";

			st += "\n<TD class='Cell'>";
			cell = this.Cell(row, col);
			if (cell.num != undefined)
				st += cell.num;
			else
				{
				st += "<TABLE class='Int' CELLSPACING=0 CELLPADDING=0>"
				for (num = 1; num <= 9; num++)
					{
					if ((num-1)%3 == 0)
						st += "<TR>";
					st += "<TD ";
					if (!cell.rgNum[num])
						st += "class='Excluded'>&nbsp;</TD>";
					else
						st += ">"+ num+ "</TD>";
					if ((num-1)%3 == (3-1))
						st += "</TR>";
					}
				st += "</TABLE>";
				}
			}
		st += "</TR>";
		}
	st += "</TABLE>";
	return st;
}

Sudoku.StNameRowCol = function(row, col)
{
	var st = "";

	if (col != undefined)
		st += String.fromCharCode(col + "A".charCodeAt(0));
	if (row != undefined)
		st += (row+1);

	return st;
}

function Cell(sud, i)
{
	var num;

	this.sud = sud;
	this.i = i;

	sud.rgcells.push(this);

	this.row = sud.rgcellRows[this.Row()];
	this.col = sud.rgcellCols[this.Col()];
	this.block = sud.rgcellBlocks[this.Block()];
	
	this.row.push(this);
	this.col.push(this);
	this.block.push(this);
	
	this.i = i;
	this.rgNum = new Array(9);
	for (num = 1; num <= 9; num++)
		this.rgNum[num] = true;
	this.num = undefined;
	this.cnumPossible = 9;
}

Cell.prototype.Copy = function(cellSrc)
{
	var num;
	for (num = 1; num <= 9; num++)
		this.rgNum[num] = cellSrc.rgNum[num];
	this.num = cellSrc.num;
	this.cnumPossible = cellSrc.cnumPossible;
}

Cell.prototype.Row = function()
{
	return Math.floor(this.i/9);
}

Cell.prototype.Col = function()
{
	return this.i % 9;
}

Cell.prototype.StName = function()
{
	return Sudoku.StNameRowCol(this.Row(), this.Col());
}

Cell.prototype.Block = function()
{
	return Math.floor(this.Row()/3) * 3 +
		Math.floor(this.Col()/3);
}

Cell.prototype.Set = function(num)
{
	if (this.num)
		{
		if (num == this.num)
			return false;
		this.sud.Illegal("Cell " + this.StName() + " can't be set to " + num + " (from " + this.num + ").");
		return false;
		}
	if (!this.rgNum[num])
		{
		this.sud.Illegal("Cell " + this.StName() + " can't be set to " + num + " (not legal).");
		return false;
		}
	this.num = num;
	this.cnumPossible = 0;
	this.sud.numSet++;

	Sudoku.ExcludeCells(this.row, num);
	Sudoku.ExcludeCells(this.col, num);
	Sudoku.ExcludeCells(this.block, num);
	return true;
}

Cell.prototype.Exclude = function(num)
{
	if (this.num != undefined)
		return false;

	if (this.rgNum[num])
		{
		this.rgNum[num] = false;
		this.cnumPossible--;
		if (this.cnumPossible == 0)
			this.sud.Illegal("No possible values for cell " + this.StName());
		return true;
		}
	return false;
}

Cell.prototype.InCells = function(rgcell)
{
	var i;

	for (i = 0; i < rgcell.length; i++)
		{
		if (this == rgcell[i])
			return true;
		}
	return false;
}

Action.aHeading = 0;
Action.aSet = 1;
Action.aExclude = 2;
Action.aError = 3;

function Action(a, cell, num, stNote, cCost)
{
	if (cCost == undefined)
		cCost = 0;

	this.a = a;
	this.cell = cell;
	this.num = num;
	this.stNote = stNote;
	this.cCost = cCost;
}

Action.prototype.StDisplay = function()
{
	var st = "";
	
	switch (this.a)
		{
	case Action.aError:
		st += "<B>Error: " + this.stNote + "</B>";
		return st;
		
	case Action.aHeading:
		st += "<B>" + this.stNote + "</B>";
		return st;

	case Action.aSet:
		st += this.cell.StName() + " = " + this.num;
		break;

	case Action.aExclude:
		st += this.cell.StName() + " != " + this.num;
		break;
		}

	if (this.stNote)
		st += " (" + this.stNote + ")";
	
	return st;
}

Action.prototype.DoIt = function()
{
	switch (this.a)
		{
	case Action.aSet:
		return(this.cell.Set(this.num));

	case Action.aExclude:
		return(this.cell.Exclude(this.num));
		}
	return true;
}
