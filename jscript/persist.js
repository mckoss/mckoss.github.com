// Persist JSCRIPT Objects to an XML formatted stream
// that preserves datatypes and structure.
 
function PersistContext()
{
	this.Init();

	// 0: Type-major
	// 1: Name-major with types
	// 2: Name-major with no types
	this.iStyle = 0;
}

PersistContext.idSerial = 0;

PersistContext.prototype.Init = PCInit;
function PCInit()
{
	this.st = "";
	this.rgstName = new Array;
	this.mapObjects = new Object;
	this.istName = 0;
	this.idSerial = PersistContext.idSerial++;
}

PersistContext.prototype.SetName = PCSetName;
function PCSetName(stName)
{
	this.rgstName[this.istName++] = stName;
}

PersistContext.prototype.StName = PCStName;
function PCStName()
{
	return this.rgstName[this.istName-1];
}

PersistContext.prototype.PopName = PCPopName;
function PCPopName()
{
	this.istName--;
}

PersistContext.prototype.AddLine = PCAddLine;
function PCAddLine(st)
{
//alert("AddLine: " + st);
	var ich;
	var ichMax = (this.istName-1) * 2;

	for (ich = 0; ich<ichMax; ich++)
		this.st += " ";
	this.st += st + "\r";
}

PersistContext.prototype.StPath = PCStPath;
function PCStPath()
{
	var ist;
	var st = "";

	for (ist = 0; ist < this.istName; ist++)
		{
		if (ist != 0)
			st += ".";
		st += this.rgstName[ist];
		}
	return st;		
}

PersistContext.prototype.PersistOpen = PCPersistOpen;
function PCPersistOpen(obj)
{
	var stType = this.StType(obj);
	var st = StBuildParam(PersistContext.rgstObjectOpen[this.iStyle],
		stType, this.StName());
	this.AddLine(st);
}

PersistContext.prototype.PersistClose = PCPersistClose;
function PCPersistClose(obj)
{
	var stType = this.StType(obj);
	var st = StBuildParam(PersistContext.rgstObjectClose[this.iStyle],
		stType, this.StName());
	this.AddLine(st);
}

PersistContext.prototype.StType = PCStType;
function PCStType(obj)
{
	var stType = typeof(obj);

	if (stType == "object")
		{
		switch (obj.constructor)
			{
		case Array:
			return "Array";
		case Object:
			return "Object";
		case Date:
			return "Date";
		case Function:
			return "Function";
		}
		stType = obj.constructor.toString();
		stType = stType.substr(9, stType.indexOf("(")-9);
		}
	else
		{
		stType = stType.substr(0, 1).toUpperCase() + stType.substr(1);
		}
	return stType;
}

// Format for Type, Name, Value
PersistContext.rgstValue = new Array(
	"<^1 Name=^2.a Value=^3.a/>",
	"<^2 Type=^1.a>^3</^2>",
	"<^2>^3</^2>");

// Format for Class, Name, [Ref]
PersistContext.rgstObjectOpen = new Array(
	"<^1 Name=^2.a>",
	"<^2 Type=^1.a>",
	"<^2>");
PersistContext.rgstObjectClose = new Array(
	"</^1>",
	"</^2>",
	"</^2>");	
PersistContext.rgstObjectRef = new Array(
	"<^1 Name=^2.a Ref=^3.a/>",
	"<^2 Ref=^3.a/>",
	"<^2 Ref=^3.a/>");

PersistContext.prototype.PersistValue = PCPersistValue;
function PCPersistValue(stType, value)
{
	this.AddLine(StBuildParam(PersistContext.rgstValue[this.iStyle],
		stType, this.StName(), value));
}

function StAttribute(stAttr)
{
	return "\"" + stAttr + "\"";
}

PersistContext.mapExcludeProps = new Object;
PersistContext.mapExcludeProps.stPersistPath = true;
PersistContext.mapExcludeProps.idSerial = true;

Number.prototype.Persist = ScalarPersist;
String.prototype.Persist = ScalarPersist;
Boolean.prototype.Persist = ScalarPersist;
function ScalarPersist(pc)
{
	if (PersistContext.mapExcludeProps[pc.StName()])
		return;
	pc.PersistValue(pc.StType(this.valueOf()), this.valueOf());
}

Object.prototype.Persist = ObjectPersist;
function ObjectPersist(pc)
{
	var stType = pc.StType(this);

	if (stType == "Function")
		{
		return;
		}

	if (this.idSerial == pc.idSerial)
		{
		var st = StBuildParam(PersistContext.rgstObjectRef[pc.iStyle],
			stType, pc.StName(), this.stPersistPath);
		pc.AddLine(st);
		return;
		}
	this.idSerial = pc.idSerial;
	this.stPersistPath = pc.StPath();
	pc.PersistOpen(this);
	for (prop in this)
		{
		pc.SetName(prop);
		this[prop].Persist(pc);
		pc.PopName();
		}
	pc.PersistClose(this);
}

function StAttrQuote(st)
{
	return '"' + StAttrQuoteInner(st) + '"';
}

function StAttrQuoteInner(st)
{
	st = st.toString();
	st = st.replace(/&/g, '&amp;');
	st = st.replace(/\"/g, '&quot;'); // " to fool LocStudio
	st = st.replace(/\r/g, '&#13;');
	return st;
}

function StBuildParam(stPattern)
{
	var re;
	var i;
	
	for (i = 1; i < StBuildParam.arguments.length; i++)
		{
		re = new RegExp("\\^" + i + "\.a", "g");
		stPattern = stPattern.replace(re, StAttrQuote(StBuildParam.arguments[i]));				re = new RegExp("\\^" + i, "g");
		stPattern = stPattern.replace(re, StBuildParam.arguments[i]);
		}
	return stPattern;
}

//
// Parsing XML to create objects

PersistContext.prototype.ParseXML = PCParseXML;
function PCParseXML(stXML)
{
	this.doc = new ActiveXObject("Microsoft.XMLDOM");
	var fParsed = this.doc.loadXML(stXML);
	if (!fParsed)
		{
		var pe = this.doc.parseError;
		var code = (pe.errorCode ^ 0x80000000) & 0xFFFFFFF;
		alert("Error in line " + pe.line + ": " + pe.reason +
			"(Error code: " + code.toString(16).toUpperCase() + ")");
		return;
		}

	return this.ObjectNode(this.doc.documentElement);
}


PersistContext.prototype.StNameNode = PCStNameNode;
function PCStNameNode(node)
{
	if (this.iStyle == 0)
		return node.attributes.getNamedItem("Name").nodeValue;
	return node.baseName;
}

PersistContext.prototype.StTypeNode = PCStTypeNode;
function PCStTypeNode(node)
{
	if (this.iStyle == 0)
		return node.baseName;

	var stType = node.attributes.getNamedItem("Type").nodeValue;
	if (this.iStyle == 1)
		return stType;
	if (!stType)
		stType = "Object";
	return stType;
}

PersistContext.prototype.StValueNode = PCStValueNode;
function PCStValueNode(node)
{
	var stValue;
	if (this.iStyle == 0)
		stValue = node.attributes.getNamedItem("Value").nodeValue;
	else
		stValue = node.nodeValue;

	switch (this.StTypeNode(node))
		{
	case "Number":
		return parseFloat(stValue);
	case "Boolean":
		return stValue == "true";
		}

	return stValue;
}


PersistContext.prototype.ObjectNode = PCObjectNode;
function PCObjectNode(node)
{
	var i;
	var nodes = node.childNodes;
	var obj;

	if (node.attributes.getNamedItem("Ref"))
		{
		obj = this.mapObjects[node.attributes.getNamedItem("Ref").nodeValue];
		return obj;
		}

	for (i = 0; i < nodes.length; i++)
		{
		if (nodes(i).nodeType == 1)
			{
			if (!obj)
				{
				obj = eval("new " + this.StTypeNode(node));
				this.SetName(this.StNameNode(node));
				this.mapObjects[this.StPath()] = obj;
				}

			var objChild = this.ObjectNode(nodes(i));
			obj[this.StNameNode(nodes(i))] = objChild;
			}
		}

	if (obj)
		{
		this.PopName();
		return obj;
		}

	return this.StValueNode(node);
}
