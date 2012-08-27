// ------------------------------------------------------------
// debug.js
//
// Copyright, 2003-2005 by Mike Koss (mike05@mckoss.com)
//
// History:
//
// This file contains utilities for debugging javascript objects.
function DW(obj)
{
	document.write(obj);
}

Array.prototype.toString = function()
{
	var i;
	var st = "";

	st += "[";
	for (i = 0; i < this.length; i++)
		{
		if (i != 0)
			st += ", ";
		if (this[i] == undefined)
			st += "<UND>";
		else if (this[i] == null)
			st += "<NULL>";
		else
			st += this[i].toString();
		}
	st += "]";
	return st;
}

// ------------------------------------------------------------
// Object dump routines (for debugging)
// -----------------------------------------------------mck----

Object.prototype.StDump = function(dc)
{
	var st = "";
	var cProps = 0;
	var prop;

	if (!dc)
		dc = {iDepth: 0, iDepthMax: 3};
	else
		dc.iDepth++;
	
	if (dc.iDepth > dc.iDepthMax)
		{
		st += " '" + this.toString() + "'";
		dc.iDepth--;
		return st;
		}

	if (this.constructor == undefined)
		{
		dc.iDepth--;
		return "ActiveX Control";
		}

	// All own properties
	for (prop in this)
		{
		if (this.hasOwnProperty(prop))
			{
			st += StDumpVar(prop, this[prop], dc);
			cProps++;
			}
		}

	dc.iDepth--;

	if (cProps == 0)
		return "";
	return st;
}

function StDumpVar(stVar, value, dc)
{
	var st = "\n";

	if (!dc)
		dc = {iDepth: 0, iDepthMax: 3};
	else
		dc.iDepth++;

	for (i = 1 ; i < dc.iDepth; i++)
		st += "  ";

	st += stVar + ": " ;
	if (value == undefined)
		{
		st += "UNDEFINED";
		}
	else if (typeof(value) == "object")
		{
		if (value.constructor != undefined)
			st += value.StDump(dc);
		else
			st += "ActiveX Control";
		}
	else if (typeof(value) == "function")
		{
		stT = value.toString();
		st += stT.substring(0, stT.indexOf("("));
		}
	else
		st += value.toString();

	dc.iDepth--;
	return st;
}

// Dump the properties of a DHTML element by enumerating all properties
function StDumpAttrs(nd)
{
	var i;
	var st = "";
	var attr;

	for (i = 0; i < nd.attributes.length; i++)
		{
		attr = nd.attributes(i);
		if (attr.nodeValue != null && attr.nodeValue != "")
			st += attr.nodeName + ": " + attr.nodeValue + "\n";
		}

	return st;
}

function DebugBreak()
{
	var a = 1/0;
	UndefinedFunction(a);
}
