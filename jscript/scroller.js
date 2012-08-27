var dc;

function InitScroller()
{
	new DragController(document.body);
}

DragController.prototype.Idle = DCIdle;
function DCIdle()
{
	if (this.fThrow)
		{
		window.scrollBy(this.dx, this.dy);
		this.dx *= this.friction;
		this.dy *= this.friction;
		if (Math.abs(this.dx) < 1 && Math.abs(this.dy) < 1)
			this.fThrow = false;
		}
}

function DragController(obj)
{
	dc = this;

	this.obj = obj;
	obj.style.cursor = "hand";
	this.fDown = false;
	this.fThrow = false;

	obj.onmousedown = new Function("dc.MouseDown();");
	obj.onmousemove = new Function("dc.MouseMove();");
	obj.onmouseup = new Function("dc.MouseUp();");
	obj.onkeydown = new Function("dc.KeyDown();");

	this.msIdle = 1;
	this.friction = 0.97;
	this.tm = window.setInterval("dc.Idle();", this.msIdle);
}

DragController.prototype.MouseDown = DCMouseDown;
function DCMouseDown()
{
	if (window.event.srcElement.tagName.toUpperCase() == "AREA")
		{
		return;
		}
	this.obj.setCapture();
	this.fDown = true;
	this.fThrow = false;
	this.RecordMouse(true);
}

DragController.prototype.MouseMove = DCMouseMove;
function DCMouseMove()
{
	if (!this.fDown)
		return;

	// Bug - we somehow got a mousedown and no mouseup
	if (window.event.button == 0)
		{
		this.MouseUp();
		return;
		}

	this.RecordMouse(false);

	window.scrollBy(this.dx, this.dy);
}

DragController.prototype.RecordMouse = DCRecordMouse;
function DCRecordMouse(fInit)
{
	if (fInit)
		{
		this.dx = this.dy = 0;
		}
	else
		{
		this.dx = this.x - window.event.clientX;
		this.dy = this.y - window.event.clientY;
		}

	this.x = window.event.clientX;
	this.y = window.event.clientY;
}

DragController.prototype.MouseUp = DCMouseUp;
function DCMouseUp()
{
	this.obj.releaseCapture();
	this.fDown = false;
	this.fThrow = true;
}

DragController.prototype.KeyDown = DCKeyDown;
function DCKeyDown()
{
	var dx = 0;
	var dy = 0;

	switch (window.event.keyCode)
		{
	// left arrow
	case 37:
		dx = -5;
		break;
	// right arrow
	case 39:
		dx = 5;
		break;
	// up arrow
	case 38:
		dy = -5;
		break;
	// down arrow
	case 40:
		dy = 5;
		break;
	// page up
	case 33:
		dy = -10;
		break;
	// page down
	case 34:
		dy = 10;
		break;
	default:
		return;
		}

	window.event.returnValue = false;

	if (!this.fDown && !this.fThrow)
		{
		this.dx = dx;
		this.dy = dy;
		this.fThrow = true;
		return;
		}

	if (this.fThrow)
		{
		this.dx += dx;
		this.dy += dy;
		}
}
