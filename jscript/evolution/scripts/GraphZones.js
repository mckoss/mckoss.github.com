// GraphZones - Optimization for hit-testing within a partitioned space
// of rectangles.
//
// dx, dy - size of each zone
// xMax - the max width of the space
// Copyright (c) 2007 by Mike Koss

function GraphZones(dx, dy, xMax)
{
    this.dx = dx;
    this.dy = dy;
    this.cols = Math.ceil(xMax/dx);
    this.zones = [];
}

GraphZones.prototype = {
Zone: function(x, y)
    {
    var iZone = Math.floor(x/this.dx) + this.cols * Math.floor(y/this.dy);
    if (iZone < 0)
        return null;
    if (this.zones[iZone] == undefined)
        this.zones[iZone] = [];
    return this.zones[iZone];
    },

Move: function (obj)
    {
    var zone = this.Zone(obj.x, obj.y);
        
    if (obj._zone)
        {
        if (obj._zone == zone)
            return;
        this.Remove(obj);
        }
    this.Add(obj, zone);
    },
    
Remove: function(obj)
    {
    if (!obj._zone)
        return;
    var zone = obj._zone;
    console.assert(obj == zone[obj._iSlot]);
    delete zone[obj._iSlot];
    obj._zone = null;
    },
    
Add: function(obj, zone)
    {
    obj._zone = zone;
    
    // Re-use empty slots
    for (var iSlot = 0; iSlot < zone.length; iSlot++)
        {
        if (zone[iSlot] == undefined)
            {
            obj._iSlot = iSlot;
            zone[iSlot] = obj;
            return;
            }
        }
    obj._iSlot = zone.push(obj) - 1;
    },
    
ZonesAround: function(x, y, rad)
    {
    // Assume radius cannot span more than the 8 adjacent zones
    console.assert(rad < this.dx && rad < this.dy);
    var zones = [];
    rad = Math.floor(rad);
    
    for (var xT = x - rad; xT <= x + rad; xT += rad)
        for (var yT = y - rad; yT <= y + rad; yT += rad)
            {   
            var zone = this.Zone(xT, yT);
            if (zone)
                zones.PushIfNew(zone);
            }
            
    return zones;
    },
    
ProcessCollisions: function(obj, fn)
    {
    var zones = this.ZonesAround(obj.x, obj.y, obj.r);
    
    // Bug: potential performance issue - use linked list to set add/delete instead of an array.
    for (var izone = 0; izone < zones.length; izone++)
        {
        var zone = zones[izone];
        for (var iobj = 0; iobj < zone.length; iobj++)
            {
            var objOther = zone[iobj];
            if (objOther == null || objOther == obj)
                continue;
            if (obj.FCollision(objOther))
                fn(obj,objOther);
            }
        }
    
    }
}
