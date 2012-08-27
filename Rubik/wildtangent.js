// GeekWeek.js
//
// History:
// April 6, 2003 [mck] - Add Lighting and Controllers
// March 30, 2003 [mck] - Created
// Copyright, 2003 by Mike Koss (mike03@mckoss.com)

// WTStage - Wild Tangent stage object
// Data types:
//
// Hungarian:
// drv - Wild Tangent Crontrol Wrapper
// obj - Wild Tanget Object wrapper - base class
// cube - WT Cube model wrapper
// cam - WT Camera wrapper
// lgt - Light
// mod - WT Model wrapper
// grp - WT Group wrapper
// cmd - Command line helper object
// v3 - 3D point/vector
// pt - 2D point
// rc - 2D rectangle (2 points)
// ctr - Controller
// rgb - Array of 3 color elements
// snd - Sound

// WildTangent Driver Objects
// wt - Driver ActiveX Control
// wts - Stage
// wto - Object/Model/Group
// wtg - Group
// wta - Actor
// wtc - Camera
// wtl - Light
// wtac - WTAudioClip
// wtci - WT Collision Info

// Copy all base class methods that do not have a definition in the current
// constructor prototype.  Also add a prototype variable that references to
// base class's constructor by name (this used to use a single name, clsParent
// but that does not work for classes nested more than 2 deep).
//
// Note: subclassing function other than the constructor not currently supported
// Need to add way of calling the base class functions directly; maybe with a naming
// convention of "Base_Func".
function Function.prototype.DeriveFrom(fnBase)
{
	var prop;

	if (this == fnBase)
		{
		alert("Error - cannot derive from self");
		return;
		}

	for (prop in fnBase.prototype)
		{
		if (typeof(fnBase.prototype[prop]) == "function" && !this.prototype[prop])
			{
			this.prototype[prop] = fnBase.prototype[prop];
			}
		}

	this.prototype[fnBase.StName()] = fnBase;
}

function Function.prototype.StName()
{
	var st;

	st = this.toString();
	st = st.substring(st.indexOf(" ")+1, st.indexOf("("));

	return st;
}

//
// Give subclass access to parent's method.
function Function.prototype.Override(fnBase, stMethod)
{
	this.prototype[fnBase.StName() + "_" + stMethod] = fnBase.prototype[stMethod];
}

function Function.prototype.StParams()
{
	var st;

	st = this.toString();
	st = st.substring(st.indexOf("("), st.indexOf(")")+1);
	return st;
}

function NYI()
{
	alert(NYI.caller.StName() + ": Not yet implemented");
}

//
//  WTDriver - Wild Tanget top level object ("Web Driver")
//

WTDriver.idNext = 0;		// Id for next constructed driver object
WTDriver.rgdrv = new Array;		// Array of all driver objects created
WTDriver.drvCur;			// The "active" driver

function WTDriver(cmd, dx, dy)
{
	if (!dx)
		dx = 800;
	if (!dy)
		dy = 480;

	this.rc = new Rect(0, 0, dx, dy);	// Control size

	this.cmd = cmd;

	this.id = WTDriver.idNext++;
	WTDriver.rgdrv[this.id] = this;
	this.stVarName = "WTDriver.rgdrv["+this.id+"]";

	this.bgobj = new Bag;		// All objects added to stage
	this.bgcam = new Bag;		// Cameras - are also in bgobj
	this.bgsnd = new Bag;		// Sounds

	this.bgctr = new Bag;		// Object controllers that need callback per frame render
	this.rgobjCache = new Object;	// File-object cache (bitmaps, models)

	this.fCollideDebug = true;		// On-screen collision debugging

	this.stDir = "Models/";		// Default directory for files

	this.fShift = false;		// DoKey - assume shift and ctrl keys up
	this.fCtrl = false;

	WTDriver.drvCur = this;
}

function WTDriver.prototype.Select()
{
	WTDriver.drvCur = this;
}

function WTDriver.prototype.StUI()
{
	var st = "";

	this.stControl = "wt" + this.id;

	st += "<OBJECT id="+this.stControl+" onerror=" + this.stVarName + ".LoadError()";
	st += " classid=CLSID:FA13A9FA-CA9B-11D2-9780-00104B242EA3";
	st += " width="+this.rc.Dx() +" height="+this.rc.Dy();
	st += " CODEBASE=http://www.wildtangent.com/install/wdriver/generic/wtwdinst.cab#version=3,0,0,0>";
	st += "</OBJECT>";

	st += "<script>"+this.stVarName+".wt = " + this.stControl + ";</script>";

	st += this.StEvent("Render");
	st += this.StEvent("Keyboard");
	st += this.StEvent("Mouse");

	return st;
}

function WTDriver.prototype.LoadError()
{
	this.fError = true;
	alert("This page requires the Wild Tangent control to operate properly.");
}

// Call this function was page is completely loaded (enables the WT driver to be installed before the page
// load is complete.
function WTDriver.FLoaded()
{
	var i;

	for (i in WTDriver.rgdrv)
		{
		var drv = WTDriver.rgdrv[i];
		if (drv.fError)
			return false;
		if (!drv.fReady)
			drv.Init();
		}
	return true;
}

function WTDriver.prototype.Init()
{
	var wt = this.wt;

	if (wt.readyState != 4  || this.fReady || this.fError)
		return;

	this.fReady = true;

	// turn on version functionality
	wt.designedForVersion("3.0");

	this.Select();
	
	// Create a stage and camera
	this.wts = wt.createStage();			// Stage

	// Top level group contains all user objects
	this.wtgTop = wt.createGroup();
	this.wts.addObject(this.wtgTop);

	this.Reset();

	wt.setNotifyMouseEvent(1);		// 1 specifies no mouse picking
	wt.setNotifyRenderEvent(true);
	wt.setNotifyKeyboardEvent(true);

	wt.start();
}

function WTDriver.prototype.Reset()
{
	this.wCollide = 0;			// Default no collisions with created objects
	this.wCollideNext = 1;
	this.objCollide = null;
	this.modCollide = undefined;

	this.Empty();
}

//
//  Create standard test environment with (controllable) camera, light, and background.
//
function WTDriver.prototype.TestEnv()
{
	var cam = new Camera();
	cam.MoveTo(0,0,-300);
	new SlewController(cam, "Camera");

	this.SetBackColor([240, 230, 140]);		// Khaki

	var lgt = new Light;
	lgt.SetColor([100,100,100]);
	lgt = new Light(3);
	lgt.Turn(-45);
}

function WTDriver.prototype.SetBackColor(rgb)
{
	this.wts.setBGColor(rgb[0], rgb[1], rgb[2]);
}

// TODO: Can I do this directly - so I don't need the name of the object?
function WTDriver.prototype.StEvent(stEvent)
{
	var st = "";

	st += "<script FOR=" + this.stControl + " EVENT=WT" + stEvent + "Event(evt)>";
	st += " " + this.stVarName + ".Do" + stEvent + "(evt);";
	st += "</script>";

	return st;
}

function WTDriver.prototype.Empty()
{
	var ibag;
	
	ibag = new IBag(this.bgctr);
	while (ibag.FNext())
		ibag.Obj().Remove();

	ibag = new IBag(this.bgobj);
	while (ibag.FNext())
		ibag.Obj().Remove();

	ibag = new IBag(this.bgsnd);
	while (ibag.FNext())
		ibag.Obj().Remove();
}

function SetCollisionCallback(obj)
{
	WTDriver.drvCur.objCollide = obj;
	if (!obj)
		{
		WTDriver.drvCur.wCollide = 0;
		return;
		}

	WTDriver.drvCur.wCollide = WTDriver.drvCur.wCollideNext;
	WTDriver.drvCur.wCollideNext <<= 1;
}

function WTDriver.prototype.AddObject(obj)
{
	if (obj.wto != undefined)
		{
		this.wtgTop.addObject(obj.wto);
		obj.wto.setCollisionMask(this.wCollide);
		if (obj.wto.getUserData() == null && obj.drv.objCollide)
			obj.wto.setUserData(obj.drv.objCollide);
		}
	this.bgobj.Add(obj);
}

function WTDriver.prototype.RemoveObject(obj)
{
	if (obj.wto != undefined)
		this.wtgTop.removeObject(obj.wto);
	this.bgobj.Remove(obj);
}

function WTDriver.prototype.AddCamera(cam)
{
	this.bgcam.Add(cam);
	this.ArrangeCameras();
}

function WTDriver.prototype.RemoveCamera(cam)
{
	this.bgcam.Remove(cam);
	this.ArrangeCameras();
}

function WTDriver.prototype.ArrangeCameras()
{
	var ccam = this.bgcam.c;

	if (ccam == 0)
		return;

	var ccol = Math.ceil(Math.sqrt(ccam));
	var crw = Math.ceil(ccam/ccol);
	var irw;
	var icol;
	var dx;
	var dxMax = this.rc.Dx();
	var rc = new Rect(0,0,0,0);
	var dy = this.rc.Dy()/crw;

	rc.pt1.y = 0;
	rc.pt2.y = dy;
	ibag = new IBag(this.bgcam);
	var crwT = crw;
	for (irw = 0; irw < crw; irw++)
		{
		ccol = Math.ceil(ccam/crwT);
		dx = dxMax / ccol;
		rc.pt1.x = 0;
		rc.pt2.x = dx;
		for (icol = 0; icol < ccol; icol++)
			{
			ibag.FNext();
			ibag.Obj().SetViewRect(rc);

			rc.pt1.x += dx;
			rc.pt2.x += dx;
			}
		ccam -= ccol;
		crwT--;
		rc.pt1.y += dy;
		rc.pt2.y += dy;
		}
}

function WTDriver.prototype.AddSound(snd)
{
	this.bgsnd.Add(snd);
}

function WTDriver.prototype.RemoveSound(snd)
{
	this.bgsnd.Remove(snd);
}

function WTDriver.prototype.AddController(ctr)
{
	if (this.divControllers && ctr.FHasUI())
		{
		var st = "";

		st += "<DIV id=divCtr" + ctr.id + "><B>"+ctr.stName+":</B><BR>";
		st += ctr.StUI(this.cmd) + "<BR></DIV>";
		this.divControllers.insertAdjacentHTML("beforeEnd", st);
		ctr.BindDOM();
		ctr.divParent = eval("divCtr" + ctr.id);
		}
	this.bgctr.Add(ctr);
}

function WTDriver.prototype.RemoveController(ctr)
{
	if (ctr.divParent != undefined)
		ctr.divParent.removeNode(true);
	this.bgctr.Remove(ctr);
}

function WTDriver.prototype.BMFromCache(stFile, rgbKey)
{
	var bm = this.rgobjCache[stFile];

	if (!bm)
		{
		bm = this.wt.createBitmap(this.stDir + stFile);
		if (rgbKey)
			bm.setColorKey(rgbKey[0], rgbKey[1], rgbKey[2]);
		this.rgobjCache[stFile] = bm;
		}
	return bm;
}

function WTDriver.prototype.DoRender(wevt)
{
	var ibag;
	var obj;

	var msInterval = wevt.getInterval();
	var msTime = wevt.getTime();

	// Performance problem?  Object allocation in render loop.
	ibag = new IBag(this.bgctr);

	while (ibag.FNext())
		{
		obj = ibag.Obj();
		if (obj.DoRender && !obj.fSuspend)
			obj.DoRender(msInterval, msTime);
		}
}

function WTDriver.prototype.DoKeyboard(wevt)
{
	var key;
	var fDown;
	var obj;

	key = wevt.getKey();
	fDown = wevt.getKeyState();
	if (key == 16)
		{
		this.fShift = fDown;
		return;
		}
	if (key == 17)
		{
		this.fCtrl = fDown;
		return;
		}
	var ibag = new IBag(this.bgctr);
	while (ibag.FNext())
		{
		obj = ibag.Obj();
		if (obj.DoKey && !obj.fSuspend)
			obj.DoKey(key, fDown, this.fShift, this.fCtrl);
		}		
}

function WTDriver.prototype.DoMouse(wevt)
{
	var obj;

	var ibag = new IBag(this.bgctr);
	while (ibag.FNext())
		{
		obj = ibag.Obj();
		if (obj.DoMouse && !obj.fSuspend)
			obj.DoMouse(wevt.getX(), wevt.getY(), (wevt.getButtonState() & 1), wevt.getObject());
		}	
}

//
// Obj - Base object for Wild Tangent graphical objects
//

function Obj(stType)
{
	this.drv = WTDriver.drvCur;
}

function Obj.prototype.Remove()
{
	this.drv.RemoveObject(this);
}

// Replace and object that was removed from the stage
function Obj.prototype.Add()
{
	this.drv.AddObject(this);
}

// Not sure how collisions will be affected by invisible objects...
function Obj.prototype.SetVisible(fVis)
{
	this.wto.setVisible(fVis);
}

function Obj.prototype.Spin(deg)
{
	if (deg == undefined)
		this.wto.setConstantRotation(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1,Math.random()*180+20);
	else
		this.wto.setConstantRotation(0,1,0, deg);
}

function Obj.prototype.SetColor(rgb, part)
{
	if (this.wtoI == undefined)
		return;

	if (part == undefined)
		this.wtoI.setColor(rgb[0], rgb[1], rgb[2]);
}

function Obj.prototype.SetTexture(stFile, rgb, uRep, vRep)
{
	if (this.wtoI == undefined)
		return;

	var bm = this.drv.BMFromCache(stFile, rgb)

	if (uRep != undefined)
		{
		this.wtoI.setTextureRect("", 0, 0, uRep, vRep);
		}

	this.wtoI.setTexture(bm);
}

function Obj.prototype.SetOpacity(w)
{
	if (this.wtoI == undefined)
		return;
	this.wtoI.setOpacity(w);
}

function Obj.prototype.MoveTo(x, y, z)
{
	this.wto.setPosition(x, y, z);	
}

function Obj.prototype.Move(dx, dy, dz)
{
	var pos = this.wto.getPosition();
	this.wto.setPosition(pos.getX() + dx, pos.getY()+dy, pos.getZ()+dz);
}

function Obj.prototype.GetPos(fWorld)
{
	if (fWorld)
		return new V3(this.wto.getAbsolutePosition());

	return new V3(this.wto.getPosition());
}

function Obj.prototype.SetPos(v3)
{
	this.MoveTo(v3.x, v3.y, v3.z);
}

function Obj.prototype.Forward(dz)
{
	this.wto.moveBy(0,0,dz);
}

// Clockwise (from above) turn in X-Z plane
function Obj.prototype.Turn(deg)
{
	this.wto.setRotation(0,1,0, deg);
}

function Obj.prototype.Tip(deg)
{
	this.wto.setRotation(1,0,0, deg);
}

function Obj.prototype.SetOrientation(x,y,z, xUp, yUp, zUp)
{
	this.wto.setOrientationVector(x,y,z, xUp,yUp,zUp);
}

// Direction in X-Z plane; Z axis is 0, X axis is 90.
function Obj.prototype.SetDir(deg)
{
	this.SetOrientation(Math.sin(deg*Math.PI/180), 0, Math.cos(deg*Math.PI/180), 0, 1, 0);
}

function Obj.prototype.GetOrient(fWorld)
{
	if (fWorld)
		return new V3(this.wto.getAbsoluteOrientationVector());

	return new V3(this.wto.getOrientationVector());
}

function Obj.prototype.GetDir(fWorld)
{
	var v3 = this.GetOrient(fWorld);
	var deg;

	deg = Math.acos(v3.z) * 180/Math.PI;

	if (v3.x < 0)
		deg = 360 - deg;

	return deg;
}

function Obj.prototype.Scale(rx, ry, rz)
{
	if (ry == undefined)
		{
		ry = rz = rx;
		}
	this.wto.setScale(rx, ry, rz);
}

function Obj.prototype.AbsoluteScale(rx, ry, rz)
{
	if (ry == undefined)
		{
		ry = rz = rx;
		}
	this.wto.setAbsoluteScale(rx, ry, rz);
}

function Obj.prototype.LookAt(obj)
{
	if (obj)
		this.wto.setLookAt(obj.wto);
	else
		this.wto.unsetLookAt();
}

// Check for collisions with any objects within the extents of the current object
// and for a given distance Forward (or Backward).
function Obj.prototype.TestCollision(dz, mask)
{
	var w3d;
	var dzSelf;

	if (mask == undefined)
		mask = ~this.wto.getCollisionMask();

	dzSelf = dz < 0 ? -100 : 100;

	dz += dzSelf;

	var wtci = this.wto.checkCollision(0,20,dz, true, mask, 1);

	if (!wtci)
		return null;

	ci = new Object;
	ci.wtci = wtci;
	ci.dzTotal = wtci.getImpactDistance();
	ci.dzSafe = ci.dzTotal - dzSelf;
	ci.wtoHit = wtci.getHitObject();
	ci.posNew = new V3(wtci.getNewPosition());
	if (ci.wtoHit.getUserData())
		ci.objCallback = ci.wtoHit.getUserData();

	if (obj.drv.fCollideDebug)
		{
		// Create marker on first use
		if (this.drv.modCollide == undefined)
			{
			this.drv.modCollide = new Sphere(20);
			this.drv.modCollide.SetColor([255,0,0]);
			}
		this.drv.modCollide.SetPos(ci.posNew);
		}

	return ci;
}

// Only called by derived classes
function Obj.prototype.CreateObjInternal(wtoI)
{
	this.Obj();

	this.wtoI = wtoI;
	this.wto = this.drv.wt.createGroup();
	this.wto.attach(this.wtoI);

	this.drv.AddObject(this);	
}

//
// Graphic objects derived from Obj:
// Box
// Cube
// Sphere
// Plane
// Model
// Text3D
// Camera
// Group
// Light

Box.DeriveFrom(Obj);

function Box(dx, dy, dz)
{
	this.CreateObjInternal(WTDriver.drvCur.wt.createBox(dx, dy, dz));
}

Sphere.DeriveFrom(Obj);

function Sphere(dx, sides)
{
	if (dx == undefined) dx = 100;
	if (sides == undefined) sides = 18;

	this.CreateObjInternal(WTDriver.drvCur.wt.createSphere(dx, sides));
}

Cube.DeriveFrom(Box);

function Cube(dx)
{
	if (dx == undefined) dx = 100;

	this.Box(dx, dx, dx);
}

Plane.DeriveFrom(Obj)

function Plane(dx, dy, stTexture, rgb, uRep, vRep)
{
	if (dx == undefined) dx = 100;
	if (dy == undefined) dy = 100;

	this.CreateObjInternal(WTDriver.drvCur.wt.createPlane(dx, dy, true));
	if (stTexture != undefined)
		this.SetTexture(stTexture, rgb, uRep, vRep);
}

Model.DeriveFrom(Obj);

function Model(stFile)
{
	this.CreateObjInternal(WTDriver.drvCur.wt.createModel(WTDriver.drvCur.stDir + stFile + ".wt"));
}

Text3D.DeriveFrom(Obj);

function Text3D(stText, wScale)
{
	var wto;

	this.Obj();

	if (stText == undefined)
		stText = "Mike Koss";

	if (wScale == undefined)
		wScale = 0.3;
	
	wto = this.drv.wt.createString3D();
	wto.setCollisionMask(this.drv.wCollide);
	wto.setTextFace("Comic Sans MS, Verdana", 0);
	wto.setText(stText);
	wto.setScale(wScale, wScale, wScale/5);

	this.wtoI = wto;
	this.wto = this.drv.wt.createGroup();
	this.wto.addObject(wto);
	CenterExtent(this.wtoI);

	this.drv.AddObject(this);	
}

function Text3D.prototype.SetColor(rgb)
{
	this.wtoI.setColor(rgb[0], rgb[1], rgb[2], 255);
}

function Text3D.prototype.SetTexture(stFile, rgb)
{
	var bm = this.drv.BMFromCache(stFile, rgb)

	this.wtoI.setTexture(bm, 3);
}

Group.DeriveFrom(Obj);

function Group()
{
	this.Obj();
	this.rgobj = new Array;
	this.wto = this.drv.wt.createGroup();
	for (i = 0; i < Group.arguments.length; i++)
		{
		this.AddObject(Group.arguments[i]);
		}
	this.drv.AddObject(this);
}

function Group.prototype.SetTexture(stFile, rgb, xRep, yRep)
{
	var i;

	for (i in this.rgobj)
		rgobj[i].SetTexture(stFile, rgb, xRep, yRep);
}

function Group.prototype.AddObject(obj)
{
	this.rgobj.push(obj);
	this.wto.addObject(obj.wto);
}

Camera.DeriveFrom(Obj);

function Camera()
{
	this.Obj();
	this.wto = this.drv.wts.createCamera();
	this.wto.setClipping(10000);		// Increase from 5,000 to 10,000 default
	this.rc = this.drv.rc.Clone();
	this.drv.AddObject(this);
	this.drv.AddCamera(this);
}

function Camera.prototype.SetViewRect(rc)
{
	this.rc = rc;
	this.wto.setViewRect(rc.pt1.x, rc.pt1.y, rc.Dx(), rc.Dy());
}

function Camera.prototype.Remove()
{
	this.wto.suspend();
	this.drv.RemoveCamera(this);
	this.drv.RemoveObject(this);
}

Light.DeriveFrom(Obj);

function Light(wType)
{
	if (wType == undefined) wType = 0;	// Ambient default
	this.Obj();

	this.wtoI = this.drv.wt.createLight(wType);
	this.wto = this.wtoI;

	this.drv.AddObject(this);	
}

function Sound(stFile, fLoop, wVolume)
{
	this.drv = WTDriver.drvCur;
	this.wtac = this.drv.wt.createAudioClip(this.drv.stDir + stFile + ".wwv");
	this.wLoop = 0;
	if (fLoop)
		this.wLoop = 1;
	this.drv.AddSound(this);
}

function Sound.prototype.Play()
{
	this.wtac.start(this.wLoop);
}

function Sound.prototype.Stop()
{
	this.wtac.stop();
}

// Volume between 0..127
function Sound.prototype.Volume(wVolume)
{
	this.wtac.setVolume(wVolume);
}

function Sound.prototype.Remove()
{
	this.Stop();
	this.drv.RemoveSound(this);
}

//
// Controllers - Handle runtime dynamics and key events
//

function Controller(obj)
{
	this.SetObj(obj);
	this.Suspend(false);
	this.drv.AddController(this);
}

function Controller.prototype.SetObj(obj)
{
	this.obj = obj;
	this.drv = WTDriver.drvCur;
}

function Controller.prototype.Remove()
{
	this.drv.RemoveController(this);
}

function Controller.prototype.Suspend(fSuspend)
{
	this.fSuspend = fSuspend;
}

function Controller.prototype.SetLifetime(msLifetime)
{
	this.msLifetime = msLifetime;
}

function Controller.prototype.DoRender(msInterval, msTime)
{
	this.msTime = msTime;
	if (this.msLifetime)
		{
		if (!this.msLimit)
			{
			this.msStart = msTime;
			this.msLimit = msTime + this.msLifetime;
			}

		if (msTime >= this.msLimit)
			{
			this.Suspend(true);
			this.fFinal = true;
			}
		}
}

function Controller.prototype.Proportion(w1, w2)
{
	return WProportion(this.msTime, this.msStart, this.msLimit, w1, w2);
}

function WProportion(w, w1, w2, w3, w4)
{
	return (w-w1)/(w2-w1)*(w4-w3)+w3;
}

function Controller.prototype.FHasUI()
{
	return false;
}

SlewController.DeriveFrom(Controller);

// Standard movement and turn rates
SlewController.dsUI = 100;
SlewController.ddegUI = 45;	// 45 degrees per second

SlewController.idNext = 0;
SlewController.rgctr = new Array;

function SlewController(obj, stName)
{
	this.stName = stName;
	this.id = SlewController.idNext++;
	SlewController.rgctr[this.id] = this;
	this.stVarName = "SlewController.rgctr["+this.id+"]";

	this.Controller(obj);
	this.fQuiet = false;
	this.dv = new V3(0,0,0);
	this.ddeg = 0;
	this.dist = 0;
}

SlewController.Override(Controller, "DoRender");

function SlewController.prototype.DoRender(msInterval, msTime)
{
	this.Controller_DoRender(msInterval, msTime);

	var s = msInterval / 1000;

	this.obj.Move(this.dv.x * s, this.dv.y *s, this.dv.z * s);
	this.obj.Turn(this.ddeg * s);
	this.obj.Forward(this.dist * s);

	if (this.txtLoc)
		{
		this.txtLoc.innerHTML = "Pos: " + this.obj.GetPos() +
			"<BR>Orient: " +this.obj.GetOrient();
		}
}

function SlewController.prototype.FHasUI()
{
	return true;
}

function SlewController.prototype.StUI(cmd)
{
	var st = "";

	var dS = SlewController.dsUI;

	this.stLocName = "spanSC" + this.id;

	st += this.StVarPair(cmd, "X", "dv.x", dS);
	st += this.StVarPair(cmd, "Y", "dv.y", dS);
	st += this.StVarPair(cmd, "Z", "dv.z", dS);
	st += "<BR>";
	st += this.StVarPair(cmd, "Dir", "ddeg", SlewController.ddegUI);
	st += this.StVarPair(cmd, "Fwd", "dist", dS);

	st += "<BR><SPAN id=" + this.stLocName + "></SPAN>";

	return st;
}

function SlewController.prototype.StVarSet(stVar, w)
{
	return this.stVarName + "." + stVar + " = " + w + ";";
}

function SlewController.prototype.StVarPair(cmd, stLabel, stVar, dS)
{
	var st ="";

	st += cmd.StButton("+" + stLabel, this.StVarSet(stVar, dS), this.StVarSet(stVar, 0), this.fQuiet);
	st += cmd.StButton("-" + stLabel, this.StVarSet(stVar, -dS), this.StVarSet(stVar, 0), this.fQuiet);
	st += "&nbsp;";

	return st;
}

function SlewController.prototype.BindDOM()
{
	this.txtLoc = eval(this.stLocName);
}

function SlewController.prototype.WriteUI(cmd)
{
	document.write(this.StUI(cmd));
	this.BindDOM();
}

//
// CBController - Callback Controller.  Calls object methods for keys and rendering:
//   obj.DoKey(ch, fDown) - keys are mapped from stKeys to corresponding letter in stMap
//   obj.DoRender(msInterval, msTime) - returns string to display in controller well
//

CBController.DeriveFrom(Controller);
CBController.idNext = 0;
CBController.rgctr = new Array;

function CBController(obj, stName, stKeys, stMap)
{
	this.stName = stName;
	this.id = CBController.idNext++;
	CBController.rgctr[this.id] = this;
	this.stVarName = "CBController.rgctr["+this.id+"]";

	this.stKeys = stKeys;
	this.stMap = stMap;

	this.Controller(obj);
}

CBController.Override(Controller, "DoRender");

function CBController.prototype.DoRender(msInterval, msTime)
{
	this.Controller_DoRender(msInterval, msTime);

	if (!this.obj.DoRender)
		return;

	var st = this.obj.DoRender(msInterval, msTime);

//	if (this.txtLoc && st != undefined)
//		this.txtLoc.innerHTML = st;
}

function CBController.prototype.DoKey(key, fDown, fShift, fCtrl)
{
	if (!this.obj.DoKey)
		return;

	var ch = String.fromCharCode(key);
	var ich = this.stKeys.indexOf(ch);

	if (ich < 0)
		return;

	if (this.stMap != undefined)
		ch = this.stMap.charAt(ich);

	this.obj.DoKey(ch, fDown, fShift, fCtrl);
}

function CBController.prototype.DoMouse(x, y, fLeft, obj)
{
	if (!this.obj.DoMouse)
		return;

	this.obj.DoMouse(x, y, fLeft, obj);
}

function CBController.prototype.FHasUI()
{
	return this.stName != undefined;
}

function CBController.prototype.StUI(cmd)
{
	var st = "";

	this.stLocName = "spanCB" + this.id;

	st += "Keys: " + this.stKeys;

//	st += "<BR><SPAN id=" + this.stLocName + "></SPAN>";

	return st;
}

function CBController.prototype.BindDOM()
{
//	if (this.stLocName != undefined)
//		this.txtLoc = eval(this.stLocName);
}

function CBController.prototype.WriteUI(cmd)
{
	document.write(this.StUI(cmd));
	this.BindDOM();
}

function Math.Round(n, cdec)
{
	var nMult = Math.pow(10, cdec);

	n = Math.round(n*nMult);
	return n / nMult;
}

function Math.Rad(deg)
{
	return deg * Math.PI / 180;
}

function V3()
{
	// One - argument assume WT3Vector3D
	if (V3.arguments.length == 1)
		{
		var wt3 = V3.arguments[0];
		this.x = wt3.getX();
		this.y = wt3.getY();
		this.z = wt3.getZ();
		return;
		}

	this.x = V3.arguments[0];
	this.y = V3.arguments[1];
	this.z = V3.arguments[2];
}

function V3.prototype.toString()
{
	return "[" + Math.Round(this.x, 2) + ", " + Math.Round(this.y, 2) + ", " + Math.Round(this.z, 2) + "]";
}

function V3.prototype.Add(v)
{
	this.x += v.x;
	this.y += v.y;
	this.z += v.z;
}

function V3.prototype.Sub(v)
{
	this.x -= v.x;
	this.y -= v.y;
	this.z -= v.z;
}

function V3.prototype.Scale(w)
{
	this.x *= w;
	this.y *= w;
	this.z *= w;
}

function Point(x, y)
{
	this.x = x;
	this.y = y;
}

function Point.prototype.Clone()
{
	var pt = new Point(this.x, this.y);
	return pt;
}

function Rect(x1, y1, x2, y2)
{
	if (Rect.arguments.length == 2)
		{
		this.pt1 = x1.Clone();
		this.pt2 = y1.Clone();
		return;
		}
	this.pt1 = new Point(x1, y1);
	this.pt2 = new Point(x2, y2);
}

function Rect.prototype.Clone()
{
	var rc = new Rect(this.pt1, this.pt2);
	return rc;
}

function Rect.prototype.Dx()
{
	return this.pt2.x - this.pt1.x;
}

function Rect.prototype.Dy()
{
	return this.pt2.y - this.pt1.y;
}

function CenterExtent(wto)
{
	var vMin = new V3(wto.getGeometryExtents(false, true));
	var vMax = new V3(wto.getGeometryExtents(true, true));

	vMin.Add(vMax);
	vMin.Scale(-1/2);
	wto.setPosition(vMin.x, vMin.y, vMin.z);
}

// Encode string so it will display in an HTML document
function StHTML(st)
{
	st = st.toString();
	st = st.replace(/&/g, '&amp;');
	st = st.replace(/</g, '&lt;');
	st = st.replace(/>/g, '&gt;');
	st = st.replace(/\n/g, '<br>');
	st = st.replace(/ /g, '&nbsp;');
	st = st.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
	return st;
}

function StAttrQuote(st)
{
	return '"' + StAttrQuoteInner(st) + '"';
}

function StAttrQuoteInner(st)
{
	st = st.toString();
	st = st.replace(/&/g, '&amp;');
	st = st.replace(/\"/g, '&quot;');
	st = st.replace(/'/g, '&#39;');
	st = st.replace(/\r/g, '&#13;');
	return st;
}

//
// Command - Command line UI and history
//
Command.idNext = 0;
Command.rgcmd = new Array;

g = new Object;	// Place to hang eval-ed definitions!

function Command(dx)
{
	if (!dx)
		dx = 640;
	this.dx = dx;
	this.id = Command.idNext++;
	Command.rgcmd[this.id] = this;
	this.stVarName = "Command.rgcmd["+this.id+"]";
}

function Command.prototype.StCmdLineUI()
{
	var st = "";

	this.stLineName = "txtCmd" + this.id;

	st += "<INPUT TYPE=Text id="+this.stLineName +" style=width:640 ";
	st += "onkeypress='" + this.stVarName + ".CmdChar();'"
	st += ">";
	st += "<INPUT TYPE=Button VALUE=Execute ";
	st += "onClick='" + this.stVarName + ".ExecCmdLine();'>";

	return st;
}

function Command.prototype.StHistoryUI(dy)
{
	var st = "";

	if (!dy)
		dy = 100;
	this.dyHist = dy;

	this.stHistName = "txtCmdHist" + this.id;

	st += "<TEXTAREA id=" + this.stHistName + " style='width:" + this.dx + ";height:" + this.dyHist;
	st += "'></TEXTAREA>";

	return st;
}

function Command.prototype.StCodeUI(dy)
{
	var st = "";

	if (!dy)
		dy = 600;
	this.dyCode = dy;

	this.stCodeName = "txtCmdCode" + this.id;
	st += "<TABLE><TR><TD>";
	st += "<TEXTAREA id=" + this.stCodeName + " style='width:" + this.dx + ";height:" + this.dyCode + "' ";
	st += "onkeydown='" + this.stVarName + ".CodeChar();' "
	st += "></TEXTAREA>";
	st += "</TD><TD>";
	st += "<INPUT TYPE=Button VALUE='Run Code' ";
	st += "onClick='" + this.stVarName + ".EvalCode();'>";
	st += "</TD></TR></TABLE>";

	return st;
}

function Command.prototype.WriteUI()
{
	document.write("<SPAN class=lblCmd>Command Line:<SPAN><BR>");
	document.write(this.StCmdLineUI());
	document.write("<BR><SPAN class=lblCmd>Command History:<SPAN><BR>");
	document.write(this.StHistoryUI());
	document.write("<BR><SPAN class=lblCmd>Code:<SPAN><BR>");
	document.write(this.StCodeUI());
	this.BindDOM();
}

// Extract variables pointing to the DOM UI elements for the command line and history.
function Command.prototype.BindDOM()
{
	this.txtCmd = eval(this.stLineName);
	this.txtHistory = eval(this.stHistName);
	this.txtCode = eval(this.stCodeName);
}

function Command.prototype.DoCommand(stCmd, fQuiet)
{
	eval(stCmd);
	if (fQuiet == undefined)
		fQuiet = false;
	if (this.txtHistory != undefined && !fQuiet)
		{
		var stHist = this.txtHistory.innerText;
		var ich = stHist.indexOf(stCmd);

		if (ich < 0)
			{
			this.txtHistory.insertAdjacentText("beforeEnd", stCmd + "\n");
			}
		}
}

function Command.prototype.CmdChar()
{
	if (event.keyCode == 13)
		{
		this.ExecCmdLine();
		event.returnValue = false;
		}
}

function Command.prototype.CodeChar()
{
	switch (event.keyCode)
		{
	case 9:
		var sel = document.selection.createRange();
		sel.text = "    ";
		event.returnValue = false;
		break;
		}
}

function Command.prototype.ExecCmdLine()
{
	this.DoCommand(this.txtCmd.value);
	this.txtCmd.select();
}

function Command.prototype.EvalCode()
{
	eval(this.txtCode.value);
}


function Command.prototype.StDoCmdAttr(stCmd, fQuiet)
{
	if (fQuiet == undefined)
		fQuiet = false;
	return StAttrQuote(this.stVarName + ".DoCommand(\"" + stCmd + "\", " + fQuiet + ");");
}

function Command.prototype.StButton(stLabel, stCmd, stCmdUp, fQuiet)
{
	st = "";

	st += "<INPUT TYPE=Button style=margin:2 Value=" + StAttrQuote(stLabel);
	if (stCmdUp == undefined || stCmdUp == "")
		{
		st += " onClick=" + this.StDoCmdAttr(stCmd, fQuiet);
		}
	else
		{
// BUG: Command needs to capture the mouse in order to ensure getting the onmouseup event - user
// can drag out and then relealse.  onmouseenter and onmouseleave are not substitute
		st += " onmousedown=" + this.StDoCmdAttr(stCmd, fQuiet);
		st += " onmouseup=" + this.StDoCmdAttr(stCmdUp, fQuiet);
		}

	st += ">";

	return st;
}

function DW(st)
{
	document.write(st);
}

//
// Debug object

function Debug()
{
}

function Debug.prototype.StUI()
{
	var st = "";

	st += "<DIV><B>dbg.Trace: </B><SPAN id=txtTrace></SPAN></DIV>";
	st += "<BR><B>Object Dump:</B><DIV id=divDumpObj></DIV>";

	return st;
}

function Debug.prototype.Trace(st)
{
	var stCaller = this.StCaller(Debug.prototype.Trace);

	txtTrace.innerText = stCaller + st;
}

function Debug.prototype.StCaller(fn)
{
	var stCaller = "";

	if (fn.caller)
		stCaller = fn.caller.StName();
	if (stCaller != "")
		stCaller = "[" + stCaller + "] ";
	return stCaller;
}

function Debug.prototype.DumpObj(obj)
{
	var st = "";

	if (obj)
		st = StDumpObj("Dump " + obj.constructor.StName() + " Object", obj);
	divDumpObj.innerHTML = st;
}

function Debug.prototype.Assert(f, stMsg)
{
	var st;

	if (f) return;

	var st = this.StCaller(Debug.prototype.Assert);
	if (stMsg != undefined)
		st += stMsg;
	alert("Assert Failed: " + st);
}

function Array.prototype.toString()
{
	var i;
	var st = "";

	st += "[";
	for (i = 0; i < this.length; i++)
		{
		if (i != 0)
			st += ", ";
		st += this[i].toString();
		}
	st += "]";
	return st;
}

function String.prototype.StRotate(iRot)
{
	return this.substring(iRot) +  this.substring(0, iRot);
}

function String.prototype.StReplace(stPat, stRep)
{

	var st = "";

	var ich = 0;
	var ichFind = this.indexOf(stPat, 0);

	while (ichFind >= 0)
		{
		st += this.substring(ich, ichFind) + stRep;
		ich = ichFind + stPat.length;
		ichFind = this.indexOf(stPat, ich);
		}
	st += this.substring(ich);

	return st;
}

//
// BAG - Object collections
//

Bag.idNext = 0;

function Bag()
{
	this.rg = new Array;
	this.stName = "Bag" + Bag.idNext++;
	this.idNext = 0;
	this.c = 0;
}

function Bag.prototype.Add(obj)
{
	// Already a member of this bag
	if (obj[this.stName] != undefined)
		return;

	this.rg[this.idNext] = obj;
	obj[this.stName] = this.idNext;
	this.idNext++;
	this.c++;
}

function Bag.prototype.Remove(obj)
{
	var id = obj[this.stName];

	// Not in this bag
	if (id == undefined)
		return;

	this.rg[id] = undefined;
	this.c--;
}

function Bag.prototype.FMember(obj)
{
	return obj[this.stName] != undefined;
}

//
// IBag - Iterator for Bag's
//

function IBag(bag)
{
	this.bag = bag;
	this.Init();
}

function IBag.prototype.Init()
{
	this.i = -1;
}

function IBag.prototype.FNext()
{
	while (++this.i < this.bag.rg.length)
		{
		if (this.bag.rg[this.i] != undefined)
			return true;
		}
	return false;
}

function IBag.prototype.Obj()
{
	if (this.i == -1)
		this.FNext();
	return this.bag.rg[this.i];
}

//
//   Object dump routines
//

StDumpObj.iDepth = 0;
StDumpObj.iDepthMax = 1;
StDumpObj.fProto = false;

function StDumpObj(stName, obj)
{
	var st = "";
	var cProps = 0;
	var prop;
		
	if (StDumpObj.iDepth > StDumpObj.iDepthMax)
		{
		st += "...";
		return st;
		}

	if (obj.constructor == undefined)
		return "ActiveX Control";

	StDumpObj.iDepth++;

	st += "<TABLE class=doTable BORDER=1 CELLPADDING=4>\n";
	if (stName != "")
		{
		st += "<TR><TD class=doTitle colspan=2>"
		st += stName;
		st += "</TD></TR>\n";
		}

	// All own properties
	for (prop in obj)
		{
		if (obj.hasOwnProperty(prop))
			{
			st += StDumpVar(prop, obj[prop]);
			cProps++;
			}
		}
		
	var stoProto = new StOnce("<TR><TD class=doProto colspan=2>prototype properties</TD></TR>\n");

	// Don't recurse on a prototype objects constructor
	// since it can point back to ourselves again (no loops!)
	if (obj.constructor.prototype != obj)
		{
		st += stoProto.St();
		st += StDumpVar("constructor", obj.constructor);
		cProps++;
		}

	if (StDumpObj.fProto)
		{
		// All properties contained in prototypes		
		for (prop in obj)
			{
			if (!obj.hasOwnProperty(prop))
				{
				st += stoProto.St();
				st += StDumpVar(prop, obj[prop]);
				cProps++;
				}
			}
		}
	st += "</TABLE>"

	StDumpObj.iDepth--;
	if (cProps == 0)
		return "";
	return st;
}

// StOnce.St() will return contained string ONE TIME when called - and empty string on all successive calls.
function StOnce(st)
{
	this.st = st;
	this.fOnce = false;
}

function StOnce.prototype.St()
{
	if (!this.fOnce)
		{
		this.fOnce = true;
		return this.st
		}
	return "";
}

function StDumpVar(stVar, value)
{
	var st = "";

	st += "<TR><TD class=doName>";
	st += stVar;
	st += "</TD><TD class=doValue>";
	if (value == undefined)
		{
		st += "&lt;UNDEFINED&gt;";
		}
	else if (typeof(value) == "object")
		{
		st += StDumpObj("", value);
		}
	else if (typeof(value) == "function")
		{
		stT = value.toString();
		st += StHTML(stT.substring(0, stT.indexOf("(")));
		st += StDumpObj("prototype", value.prototype);
		}
	else
		st += StHTML(value);
	st += "</TD></TR>\n";
	return st;
}

function StHTML(st)
{
	st = st.toString();
	st = st.replace(/&/g, '&amp;');
	st = st.replace(/</g, '&lt;');
	st = st.replace(/>/g, '&gt;');
	st = st.replace(/\n/g, '<br>');
	st = st.replace(/ /g, '&nbsp;');
	st = st.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
	return st;
}
