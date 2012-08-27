// Statistics gathering and display

function Stats(eltParent, rg)
{
    this.eltParent = eltParent;
    this.mp = {};
    for (var i = 0; i < rg.length; i++)
        new Stat(this, rg[i]);
}

Stats.prototype = {
Sample: function(stName, value, fSpark)
{
    var stat = this.mp[stName];
    if (!stat)
        stat = new Stat(this, stName, fSpark);
    stat.Sample(value);
},

Update: function()
{
    for (var prop in this.mp)
        this.mp[prop].Update();
},

Reset: function()
{
    for (var prop in this.mp)
        this.mp[prop].Reset();
},

} // Stats.protoype

Stat.dxSpark = 400;
Stat.dySpark = 100;

function Stat(stats, stName, fSpark)
{
    this.stats = stats;
    this.stName = stName;
	this.fSpark = fSpark;
    this.Reset();
    this.SetMode("VNAXC");
    
    stats.eltParent.appendChild(document.createTextNode(stName + ": "));
    this.spn = document.createElement("span");
    stats.eltParent.appendChild(this.spn);
    stats.eltParent.appendChild(document.createElement("BR"));
    
    if (fSpark)
		{
		this.rgv = [];
		this.xSpark = 0;
		this.yMin = 0;
		this.yMax = 1;
		this.canvas = document.createElement("canvas");
		this.canvas.setAttribute("height", Stat.dySpark);
		this.canvas.setAttribute("width", Stat.dxSpark);
		this.ctx = this.canvas.getContext("2d");
		stats.eltParent.appendChild(this.canvas);
		stats.eltParent.appendChild(document.createElement("BR"));
		}
    
    stats.mp[this.stName] = this;
}

Stat.prototype = {
SetMode: function(mode)
{
    this.mode = mode;
},

Reset: function()
{
    this.value = undefined;
    this.c = 0;
    this.sum = 0;
},

Sample: function(value)
{
	// BUG: Should allow for "missing" values - but for now, just
	// skip.
	if (value == Infinity || value == undefined)
		return;
    this.c++;
    this.value = value;
    this.sum += value;
    if (this.c == 1)
        {
        this.min = value;
        this.max = value;
        return;
        }
    if (value < this.min)
        this.min = value;
    if (value > this.max)
        this.max = value;
},

Update: function()
{
    if (this.c == 0)
        {
        this.spn.textContent = "N/A";
        return;
        }

    var st = "";

    if (this.c == 1 && this.mode.indexOf("V") != -1)
        st += this.value.toFixed(1);
    var stSep = " ";
    if (this.c > 1)
        {
        if (this.mode.indexOf("A") != -1)
			{
            st += stSep + (this.sum/this.c).toFixed(1);
            stSep = " [";
            }
		else
			stSep = "[";
        if (this.mode.indexOf("N") != -1)
			{
            st += stSep + this.min.toFixed(1);
            stSep = " ";
            }
        if (this.mode.indexOf("X") != -1)
            st += stSep + this.max.toFixed(1);
        stSep = "] ";
        if (this.mode.indexOf("C") != -1)
			{
            st += stSep + "of " + this.c;
            stSep = "";
            }
        st += stSep;
        }
    this.spn.textContent = st;
    
    if (this.fSpark)
		{
		var value = this.c > 1 ? this.sum/this.c : this.value;
		this.rgv[this.xSpark++] = value;
		if (value > this.yMax)
			this.yMax = value;
		if (value < this.yMin)
			this.yMin = value;
		if (this.xSpark >= Stat.dxSpark)
			this.xSpark = 0;
			
		this.ctx.strokeStyle = "black";
		this.ctx.clearRect(0, 0, Stat.dxSpark, Stat.dySpark);
		this.ctx.strokeRect(0, 0, Stat.dxSpark, Stat.dySpark);
		var xFirst = this.xSpark == this.rgv.length ? 0 : this.xSpark + 1;
		if (xFirst == Stat.dxSpark)
			xFirst = 0;
		var scale = Stat.dySpark/(this.yMax-this.yMin);
		this.ctx.beginPath();
		var xDraw = 0;
		this.ctx.moveTo(xDraw++, (this.rgv[xFirst]-this.yMin)*scale);
		for (var x = xFirst+1; x != this.xSpark; x++)
			{
			if (x == Stat.dxSpark)
				{
				x = -1;
				continue;
				}
			this.ctx.lineTo(xDraw++, Stat.dySpark - (this.rgv[x]-this.yMin)*scale);
			}
		this.ctx.stroke();
		}
},

} // Stat.prototype
