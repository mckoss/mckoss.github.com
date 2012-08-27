// Misc JavaScript helper functions
// Copyright (c) 2007 by Mike Koss and Chris Koss

Function.prototype.FnCallback = function(obj)
{
	var _fn = this;
	return function () { return _fn.apply(obj, arguments); };
}

Math.RandomInt = function(n)
{
	return Math.floor(Math.random()*n);
}

console.DbgBreak = function()
{
	try {IllegalFunction();} catch (e) {}
};

console.assertOrig = console.assert;

console.assertBreak = function(expr)
{
	console.assertOrig.apply(console, arguments);
	if (!expr)
		console.DbgBreak();
};

function Extend(dest, src)
{
	for (var prop in src)
		dest[prop] = src[prop];
}

function Combine(dest, src1, src2)
{
	for (var prop in src1)
	    {
	        if(src2[prop] != undefined && Math.RandomInt(2) == 0)
		        dest[prop] = src2[prop];
		    else
		        dest[prop] = src1[prop];
		}
}

function AverageFrom(dest, src)
{
	var prop;

	for (prop in src)
		{
		if (dest[prop] == undefined)
			dest[prop] = src[prop];
		else
			dest[prop] = (dest[prop] + src[prop])/2;
		}
}

// Misc Helper routines

Array.prototype.PushIfNew = function (obj)
{
    for (var i = 0; i < this.length; i++)
        {
        if (obj == this[i])
            return i;
        }
    return this.push(obj) - 1;
}
