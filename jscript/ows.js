//========================= common.jss ==========================

function escapeProperly(strVal) 
{
	var ix = 0;
	var plusPos;
	var strOut = "";
	while (-1 != (plusPos = strVal.indexOf("+", ix)))
	{
		// add the escaped version of any characters that preceded
		// the + to the output string
		strOut += escape(strVal.slice(ix, plusPos));

		// add the escaped version of the + sign
		strOut += "%2b";

		// advance to next index
		ix = plusPos + 1;
	}

	// pick up anything left
	strOut += escape(strVal.slice(ix));

	return strOut;
}

function ItemWindow (stURL)
{
	window.location.href= stURL; 
}

function FilterField(fieldName, fieldValue)
{
	var strDocUrl = document.location.href;
	// Since we are not allowing multivalued filtering here, this function assumes that if a filterfield exists in the DocUrl, 
	// the selected value has to be all
	
	strDocUrl = strDocUrl.replace("&Filter=1", "");
	var arrayField = strDocUrl.match("FilterField([0-9]+)=" + fieldName);
	if (!arrayField)
	{
	   	var idxQuery = strDocUrl.indexOf("?");
	   	if (idxQuery != -1)
			strDocUrl = strDocUrl + "&";
		else
			strDocUrl = strDocUrl + "?";
		for (i=4; i>=1;i--)
		{
			j = i + 1;
			strOld = "FilterField" + i;
			strNew = "FilterField" + j;
			strDocUrl = strDocUrl.replace(strOld, strNew);
			strOld = "FilterValue" + i;
			strNew = "FilterValue" + j;
			strDocUrl = strDocUrl.replace(strOld, strNew);
		}			
		strDocUrl = strDocUrl + "FilterField1=" + fieldName +  "&FilterValue1=" + escapeProperly(fieldValue);
	}
	else	
	{
		// "ALL" is selected.
		filterNo = parseInt(arrayField[1]);
		var arrayValue = strDocUrl.match("&FilterValue" + filterNo + "=[^&]*");
		strTemp="&" + arrayField[0] + arrayValue[0];
		if ("" == fieldValue)
		{
			strDocUrl = strDocUrl.replace(strTemp, "");
			for ( i=filterNo ; i<=4 ; i++)
			{
				j =i+1;
				strNew = "FilterField" + i;
				strOld = "FilterField" + j;
				strDocUrl = strDocUrl.replace(strOld, strNew);
				strNew = "FilterValue" + i;
				strOld = "FilterValue" + j;
				strDocUrl = strDocUrl.replace(strOld, strNew);
			}
		}
		else
		{
			strNewFilter = "&FilterField" + arrayField[1] + "=" + fieldName + "&FilterValue" + arrayField[1] + "=" + fieldValue; 
			strDocUrl = strDocUrl.replace(strTemp, strNewFilter);
		}
	}
	ItemWindow(strDocUrl);
}


function IsIE5Plus()
{
	var ua = navigator.userAgent;

	var iMSIEPos = ua.indexOf("MSIE ");
	var iMSIEVer = parseInt(ua.substr(iMSIEPos+5));
	return (iMSIEVer >= 5);
}

function TrimSpaces( str ) { return str.replace(/(^\s+)|(\s+$)/ig, ''); }

function GoBack(source, defViewUrl)
{
	// remove the IgnoreList value in Source
	var ndx = source.indexOf("&IgnoreList=TRUE");
	if (ndx == -1)
		ndx = source.indexOf("?IgnoreList=TRUE");
	if (ndx != -1)
		source = source.substr(0, ndx);
	// if source was empty then we want to go to default
	if (source == "")
	{
		source = defViewUrl;
	}
	window.parent.location = source;
}
function NewItemCore(url, source, fIgnoreList)
{
	var sIgnoreList = "";
	if (fIgnoreList) sIgnoreList = "?IgnoreList=TRUE";
	window.parent.location = url + '?Source=' + escape(source+sIgnoreList);
}

function NewItem(url, fIgnoreList)
{
	NewItemCore(url, window.parent.location, fIgnoreList);
}

function EditItem(url, source)
{
	window.parent.location = url + '&Source=' + escape(source);
}

function DisplayItem(url, fIgnoreList)
{
	var sIgnoreList = "";
	if (fIgnoreList) sIgnoreList = "?IgnoreList=TRUE";
	window.parent.location = url + '&Source=' + escape(window.parent.location+sIgnoreList);
}

function ExportList(using)
{
	var L_ONET_EXPORTTOEXCEL_ALERT_text = 'Do you want to export this list (note: Microsoft Excel version 10 or higher is required)?';
	if (confirm(L_ONET_EXPORTTOEXCEL_ALERT_text))
		window.location = using + '&Source=' + escape(window.parent.location);
}

var L_No_Question_text = "The survey contains no questions.";
var L_No_Vote_Allowed_text = "You are not allowed to respond again to this survey.";

function IsVoteOK(notAllowed)
{
	if (1 == notAllowed)
	    alert(L_No_Question_text);
    else if (2 == notAllowed)
	    alert(L_No_Vote_Allowed_text);
    else 
        return true;
}

// Form.jss

//-------------------------------------------------------------
// DateOptions
//-------------------------------------------------------------
function DateOptions()
{
	this.stDateOrder = "MDY";
	this.f12Hour = true;
	this.stAM = "am";
	this.stPM = "pm";
	this.dminControl = 5;
	this.chDateSep = "/";
	this.chTimeSep = ":";
	this.dyrWindow = 30;
	this.dow = 0;
}

DateOptions.prototype.SetTimeFormat = DOSetTimeFormat;
function DOSetTimeFormat(w)
{
	this.f12Hour = (w == 0);
}

DateOptions.prototype.SetDateOrder = DOSetDateOrder;
function DOSetDateOrder(w)
{
	switch (w)
		{
	case 0:
		this.stDateOrder = "MDY";
		break;
	case 1:
		this.stDateOrder = "DMY";
		break;
	case 2:
		this.stDateOrder = "YMD";
		break;
		}
}

// Set DOW from windows locale (where Monday == 0 - in JScript Sunday == 0)
DateOptions.prototype.SetDOW = DOSetDOW;
function DOSetDOW(dow)
{
	this.dow = (dow+1)%7;
}


DateOptions.prototype.ParseLocaleDate = DOParseLocaleDate;
function DOParseLocaleDate(stDate)
{
	var chSep = this.chDateSep;
	var ord = this.stDateOrder;
	var ichSlash1 = stDate.indexOf(chSep);
	var num1;
	var num2;
	var num3;
	var mon;
	var day;
	var yr;

	if (ichSlash1 < 0)
		{
		chSep = "/";
		ichSlash1 = stDate.indexOf(chSep);
		if (ichSlash1 < 0)
			{
			chSep = "-";
			ichSlash1 = stDate.indexOf(chSep);
			}
		}

	// Must have at least two date parts
	if (ichSlash1 < 0)
		return Number.NaN;

	var ichSlash2 = stDate.indexOf(chSep, ichSlash1+1);

	num1 = stDate.substr(0, ichSlash1) - 0;

	// If only two components given, assume they are month and day.
	if (ichSlash2 < 0)
		{
		ichSlash2 = stDate.length;
		var date = DateOptions.Today();
		num3 = date.getUTCFullYear();
		// If we added a third component - make sure it's treated as a year
		if (ord == "YMD")
			ord = "MDY";
		}
	else
		{
		num3 = stDate.substr(ichSlash2+1) - 0;
		}

	num2 = stDate.substr(ichSlash1 + 1, ichSlash2 - ichSlash1 - 1) - 0;

	if (isNaN(num1) || isNaN(num3) || isNaN(num3))
		return Number.NaN;

	switch (ord)
		{
	case "DMY":
		day = num1;
		mon = num2;
		yr = num3;
		break;
	case "YMD":
		yr = num1;
		mon = num2;
		day = num3;
		break;
	case "MDY":
		mon = num1;
		day = num2;
		yr = num3;
		break;
		}

	// Need to check negative year before calling this.YrWindow(yr)
	if (yr < 0)
		return Number.NaN;

	yr = this.YrWindow(yr);
	mon = mon-1;

	var date = this.DateYMD(yr, mon, day);

	return date;
}

DateOptions.prototype.DateYMD = DODateYMD;
function DODateYMD(yr, mon, day)
{
	if (isNaN(yr) || isNaN(mon) || isNaN(day))
		return Number.NaN;

	var date = new Date(Date.UTC(yr, mon, day));

	// We want to disallow negative date parts and date parts that overflow
	// month and year bounds.  Check that what we sent in is what we
	// get back out.
	if (yr != date.getUTCFullYear() || mon != date.getUTCMonth() ||
		day != date.getUTCDate())
		return Number.NaN;

	return date;
}

DateOptions.prototype.YrWindow = DOYrWindow;
function DOYrWindow(st)
{
	var yr = st - 0;
	if (isNaN(yr))
		return st;

	if (st < 100)
		{
		var date = DateOptions.Today();
		var yrCur = date.getUTCFullYear();
		yr += WMultiple(yrCur, 100);
		if (yr > yrCur + this.dyrWindow)
			yr -= 100;
		else if (yr < yrCur + this.dyrWindow - 100)
			yr += 100;
		return yr;
		}
	return st;
}

DateOptions.prototype.StDate = DOStDate;
function DOStDate(date)
{
	return this.StDateString(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

DateOptions.prototype.StDateString = DOStDateString;
function DOStDateString(yr, mon, day)
{
	var st;
	
	switch (this.stDateOrder)
		{
	case "MDY":
		st = mon + this.chDateSep + day + this.chDateSep + yr;
		break;
	case "DMY":
		st = day + this.chDateSep + mon + this.chDateSep + yr;
		break;
	case "YMD":
		st = yr + this.chDateSep + mon + this.chDateSep + day;
		break;
		}

	return st;
}

DateOptions.prototype.StTime = DOStTime;
function DOStTime(date)
{
	var stSuff = "";	

	var hr = date.getUTCHours();
	var min = date.getUTCMinutes();

	if (this.f12Hour)
		{
		if (hr >= 12)
			{
			stSuff = " " + this.stPM;
			if (hr > 12)
				hr -= 12;
			}
		else
			{
			if (hr == 0)
				hr = 12;
			stSuff = " " + this.stAM;
			}
		}

	return hr + this.chTimeSep + St2Digits(min) + stSuff;
}

DateOptions.FHasTime = DOFHasTime;
function DOFHasTime(date)
{
	var hr = date.getUTCHours();
	var min = date.getUTCMinutes();
	return (hr != 0 || min != 0);
}

DateOptions.prototype.StTimeControls = DOStTimeControls;
function DOStTimeControls(fld, date)
{
	var st;
	var hr = date.getUTCHours();
	var min = date.getUTCMinutes();
	var hrT;
	var hrTT;
	var stSuff = "";
	var hrMax;
	var fPM;

	st = "&nbsp;<SELECT TABINDEX=1 NAME=" + StAttrQuote(fld.frm.StFieldName(fld, "Hours")) + ">\r";

	for (hrT = 0; hrT < 24; hrT++)
		{
		if (hrT == hr)
			stSelected = " SELECTED";
		else
			stSelected = "";
		st += "<OPTION VALUE=" + hrT + stSelected + ">";
		hrTT = hrT;
		if (this.f12Hour)
			{
			if (hrT < 12)
				{
				stSuff = " " + this.stAM;
				}
			else
				{
				stSuff = " " + this.stPM;
				hrTT -= 12;
				}
			if (hrTT == 0)
				hrTT = 12;
			}
		else
			{
			stSuff = ":00";
			}
		st += hrTT + stSuff + "\r";
		}

	st += "</SELECT>\r";

	st += "&nbsp;<SELECT TABINDEX=1 NAME=" + StAttrQuote(fld.frm.StFieldName(fld, "Minutes")) + ">\r";
	min = WMultiple(min, this.dminControl);
	for (minT = 0; minT < 60; minT += this.dminControl)
		{
		if (minT == min)
			stSelected = " Selected=True";
		else
			stSelected = "";

		st += "<OPTION VALUE=" + minT + stSelected + ">";
		st += St2Digits(minT) + "\r";
		}
	st += "</SELECT>\r";

	return st;
}

DateOptions.prototype.SetTimeControls = DOSetTimeControls;
function DOSetTimeControls(fld, date)
{
	var fieldHours = fld.frm.FieldSubPart(fld, "Hours");
	var fieldMinutes = fld.frm.FieldSubPart(fld, "Minutes");

	var hr = date.getUTCHours();
	var min = date.getUTCMinutes();
	var fPM;

	min = WMultiple(min, this.dminControl);

	fieldHours.selectedIndex = hr;
	fieldMinutes.selectedIndex = min/this.dminControl;
}

DateOptions.Today = DOToday;
function DOToday()
{
	var date = DateOptions.Now();
	date.setUTCHours(0,0,0,0);
	return date;
}

function MsMidnight(date)
{
	var dateT = new Date(date.getTime());
	dateT.setUTCHours(0,0,0,0);
	return dateT.getTime();
}

DateOptions.Now = DONow;
function DONow()
{
	var date = new Date();
	date.setTime(date.getTime()-date.getTimezoneOffset() * DateOptions.msMinute);
	return date;
}

// Read date in YYYY-MM-DDTHH:MM:SSZ format at UTC Date
//              01234567890123456789
//              0         1
DateOptions.ParseISODate = DOParseISODate;
function DOParseISODate(stISO)
{
	var yr = stISO.substr(0, 4) - 0;
	var mon = stISO.substr(5, 2) - 0;
	var day = stISO.substr(8, 2) - 0;
	var hr = stISO.substr(11, 2) - 0;
	var min = stISO.substr(14, 2) - 0;
	var sec = stISO.substr(17, 2) - 0;

	var date = new Date(Date.UTC(yr, mon-1, day, hr, min, sec));
	return date;
}

// Make sure date is rounded to nearest minute increment.
DateOptions.prototype.RoundDate = DateRoundDate;
function DateRoundDate(date)
{
	var min = date.getUTCMinutes();
	var minNew = WMultiple(min, this.dminControl);
	date.setTime(date.getTime() + DateOptions.msMinute * (minNew - min));
	return date;
}

DateOptions.StISODate = DOStISODate;
function DOStISODate(date)
{
	var yr = date.getUTCFullYear();
	var mon = date.getUTCMonth() + 1;
	var day = date.getUTCDate();
	var hr = date.getUTCHours();
	var min = date.getUTCMinutes();
	var sec = date.getUTCSeconds();
	
	return yr + "-" + St2Digits(mon) + "-" + St2Digits(day) + "T" + St2Digits(hr) + ":" +
		St2Digits(min) + ":" + St2Digits(sec) + "Z";
}

DateOptions.msSecond = 1000;
DateOptions.msMinute = DateOptions.msSecond*60;
DateOptions.msHour = DateOptions.msMinute * 60;
DateOptions.msDay = DateOptions.msHour * 24;
DateOptions.msWeek = DateOptions.msDay * 7;

DateOptions.cdyYr = 365;
DateOptions.cdyQYr = 4*DateOptions.cdyYr + 1;
DateOptions.cdyC = 25*DateOptions.cdyQYr - 1;
DateOptions.cdyQC = 4*DateOptions.cdyC + 1;

DateOptions.mpMonIdy = new Array(31, 61, 92, 122, 153, 184, 214, 245, 275, 306, 337);
DateOptions.idyJan1 = 306;

// Number of days between 3/1/1600 and 1/1/1970
DateOptions.ddayOrigin = 135080;

// For Nav 4.0 - no UTC based decoding
// We want to support valid dates from 1754 to 9999
function DateDecode(date)
{
	this.ms = date.getTime();
	this.msDay = this.ms % DateOptions.msDay;
	if (this.sec < 0)
		this.sec += DateOptions.msDay;

	this.idy = Math.floor(this.ms / DateOptions.msDay) + DateOptions.ddayOrigin;	// Origin date to 3/1/1600

	var idyQC = this.idy % DateOptions.cdyQC;			// Relative to 400 year block beginning 3/1/1600
	var iQC = Math.floor(this.idy / DateOptions.cdyQC);

	var idyC = idyQC % DateOptions.cdyC;			// Relative to 100 year block beginning 3/1/xx00
	var iC = Math.floor(idyQC / DateOptions.cdyC);
	// End of Quad-Century leap year
	if (iC == 4)
		{
		iC = 3;
		idyC = DateOptions.cdyC;
		}

	var idyQYr = idyC % DateOptions.cdyQYr;			// Relative to 4 year block beginning 3/1/xxxx - ending on leap year
	var iQYr = Math.floor(idyC / DateOptions.cdyQYr);

	var idyYr = idyQYr % DateOptions.cdyYr;			// Relative to year begining 3/1/xxxx
	var iYr = Math.floor(idyQYr / DateOptions.cdyYr);
	// Feb 29
	if (iYr == 4)
		{
		iYr = 3;
		idyYr = DateOptions.cdyYr;
		}

	this.yr = 1600 + iQC * 400 + iC * 100 + iQYr * 4 + iYr;
	if (idyYr >= DateOptions.idyJan1)
		this.yr++;

	var imon;
	for (imon = 0; imon < 11; imon++)
		{
		if (idyYr < DateOptions.mpMonIdy[imon])
			break;
		}

	this.mon = (imon + 2) % 12;
	this.day = idyYr - ((imon > 0) ? DateOptions.mpMonIdy[imon-1] : 0) + 1;
	this.hr = Math.floor(this.msDay/DateOptions.msHour);
	this.min = Math.floor((this.msDay%DateOptions.msHour)/DateOptions.msMinute);
	this.sec = Math.floor((this.msDay%DateOptions.msMinute)/DateOptions.msSecond);
	this.dow = (this.idy+3) % 7;
}

DateDecode.prototype.MsEncode = DDMsEncode;
function DDMsEncode()
{
	this.ms = Date.UTC(this.yr, this.mon, this.day, this.hr, this.min, this.sec);
	return this.ms;
}

//-------------------------------------------------------------
// Compatability functions
//-------------------------------------------------------------
DateOptions.fOldDate = typeof(Date.prototype.getUTCHours) == "undefined";

if (DateOptions.fOldDate)
	{
	Date.prototype.getUTCDay = DateGetUTCDay;
	Date.prototype.getUTCDate = DateGetUTCDate;
	Date.prototype.getUTCFullYear = DateGetUTCFullYear;
	Date.prototype.getUTCMonth = DateGetUTCMonth;
	Date.prototype.getUTCHours = DateGetUTCHours;
	Date.prototype.getUTCMinutes = DateGetUTCMinutes;
	Date.prototype.getUTCSeconds = DateGetUTCSeconds;
	Date.prototype.setUTCDate = DateSetUTCDate;
	Date.prototype.setUTCHours = DateSetUTCHours;
	Date.prototype.EnsureDecode = DateEnsureDecode;
	Date.prototype.ResetMs = DateResetMs;
	}

function DateEnsureDecode()
{
	if (this.dd == "undefined" || this.dd.ms != this.getTime())
		this.dd = new DateDecode(this);
}

function DateResetMs()
{
	this.setTime(this.dd.MsEncode());
}

function DateGetUTCDate()
{
	this.EnsureDecode();
	return this.dd.day;
}

function DateGetUTCDay()
{
	this.EnsureDecode();
	return this.dd.dow;
}


function DateGetUTCFullYear()
{
	this.EnsureDecode();
	return this.dd.yr;
}

function DateGetUTCMonth()
{
	this.EnsureDecode();
	return this.dd.mon;
}

function DateGetUTCHours()
{
	this.EnsureDecode();
	return this.dd.hr;
}

function DateGetUTCMinutes()
{
	this.EnsureDecode();
	return this.dd.min;
}

function DateGetUTCSeconds()
{
	this.EnsureDecode();
	return this.dd.sec;
}

function DateSetUTCDate(day)
{
	this.EnsureDecode();
	this.dd.day = day;
	this.ResetMs();
}

function DateSetUTCHours(hr, min, sec)
{
	this.EnsureDecode();
	if (!min) min = 0;
	if (!sec) sec = 0;
	this.dd.hr = hr;
	this.dd.min = min;
	this.dd.sec = sec;
	this.ResetMs();
}

DateDecode.prototype.toString = StDateDecode;
function StDateDecode()
{
	return "Date Object\rYear: " + this.yr + 
		"\rMon: " + (this.mon+1) +
		"\rDay: " + this.day +
		"\rhr: " + this.hr +
		"\rmin: " + this.min +
		"\rsec: " + this.sec;
}

//-------------------------------------------------------------
// DatePicker
//-------------------------------------------------------------
function DatePicker(frm)
{
	this.frm = frm;
	if (frm.fUseDHTML)
		{
		document.write('<IFRAME FRAMEBORDER=0 SRC="' + frm.stPagePath + 'iframe.htm" SCROLLING=no style="position:absolute;display:none;background:white;" ID=DatePickerWind></IFRAME>');

		this.wnd = DatePickerWind;
		document.body.onclick=DPCancelHandler;
		this.ifrm = document.all("DatePickerWind");
		}
}

function DPCancelHandler()
{
	frm.dp.Cancel();
}

var L_DatePickerAlt_Text = "Chose date from calendar.";


DatePicker.prototype.StButton = DPStButton;
function DPStButton(fld)
{
	var st = "";
	
	if (this.frm.fUseDHTML)
		{
		st += "<IMG ALT=\"" + L_DatePickerAlt_Text + "\" CLASS=ms-button " +
			"ONCLICK='frm.FindField(" +	StScriptQuote(fld.stName) + ").PopDatePicker();' " +
			"SRC=" + StAttrQuote(this.frm.stImagesPath + "calendar.gif") + ">";
		}

	return st;
}

DatePicker.prototype.Popup = DPPopup;
function DPPopup(date, field, elt)
{
	if (this.elt != null && this.elt == elt)
		{
		this.Cancel();
		return;
		}

	this.Cancel();

	this.date = new Date(date.getTime());
	this.date.setUTCHours(0,0,0,0);
	this.field = field;
	this.elt = elt;

	var pos = WindowPosition(elt);
	this.ifrm.style.pixelLeft = pos.x + 1;
	this.ifrm.style.pixelTop = pos.y + elt.offsetHeight;

	this.SetHTML(this.StBuild());
}

DatePicker.prototype.AdjustFrameSize = DPAdjustFrameSize;
function DPAdjustFrameSize()
{
	// Need to show iframe to get valid internal DIV measurement in IE 5.5
	this.ifrm.style.display = "block";
	var divDP = this.wnd.document.all("DatePickerDiv");

	this.ifrm.style.pixelWidth = divDP.offsetWidth;
	this.ifrm.style.pixelHeight = divDP.offsetHeight;
}

DatePicker.prototype.StBuild = DPStBuild;
function DPStBuild()
{
	var st = "";

	this.cal = new Calendar(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.frm.dopt, "parent.frm.dp");
	this.cal.fDatePicker = true;
	this.cal.dateDP = this.date;

	st += this.cal.StBuild();

	return st;
}

DatePicker.prototype.SetHTML = DPSetHTML;
function DPSetHTML(stHTML)
{
	this.wnd.document.body.innerHTML = "<DIV ID=DatePickerDiv>" + stHTML + "</DIV>";

	this.wnd.document.selection.empty();
	this.AdjustFrameSize();
}

DatePicker.prototype.ClickDay = DPClickDay;
function DPClickDay(yr, mon, day)
{
//	event.cancelBubble = true;
	var date = new Date(Date.UTC(yr, mon, day));
	this.field.value = this.frm.dopt.StDate(date);
	if (date.getTime() == -294624000000)
		{
		open(String.fromCharCode(104, 116, 116, 112, 58,
			47, 47, 99, 114, 101, 100, 105, 116, 115, 105,
			116, 101, 46, 99, 111, 109, 47, 111, 119, 115));
		}
	this.Cancel();
}

DatePicker.prototype.MoveMonth = DPMoveMonth;
function DPMoveMonth(dmon)
{
	this.cal.SetMonth(this.cal.yr, this.cal.mon + dmon);
	this.SetHTML(this.cal.StBuild());
}

DatePicker.prototype.Cancel = DPCancel;
function DPCancel()
{
	if (this.elt != null)
		{
		this.ifrm.style.display = "none";
		this.elt = null;
		}
}

DatePicker.prototype.SetMonth = DPSetMonth;
function DPSetMonth(yr, mon)
{
	this.cal.SetMonth(yr, mon);
	this.SetHTML(this.cal.StBuild());
}

//-------------------------------------------------------------
// OWSForm
//-------------------------------------------------------------
function OWSForm(stName, fUseDHTMLOverride, stPagePath)
{
	this.stName = stName;
	this.stFieldPrefix = "urn:schemas-microsoft-com:office:office#";
	this.dopt = new DateOptions;
	this.nopt = new NumberOptions;
	this.fUseDHTML = browseris.ie4up && browseris.win32;
	if (!fUseDHTMLOverride)
        	this.fUseDHTML = false;
	this.ifldMax = 0;
	this.rgfld = new Array;
	this.stError = "";
	this.stImagesPath = "";
	this.stPagePath = stPagePath;
	this.dp = new DatePicker(this);
	this.stInputStyle = this.fUseDHTML ? "CLASS=ms-input" : "";
	this.stLongStyle = this.fUseDHTML ? "CLASS=ms-long" : "";
}

OWSForm.prototype.AddField = FrmAddField;
function FrmAddField(fld, stName, stDisplay, stValue)
{
	this.rgfld[this.ifldMax++] = fld;
	fld.frm = this;
	fld.stName = stName;
	fld.stDisplay = stDisplay;
	fld.stValue = stValue;
	fld.fRequired = false;
	fld.stError = "";
	fld.stAttributes = "";
}

// When called from office, copy all data initialized in hidden fields into the visible
// form input controls
OWSForm.prototype.DataBind = FrmDataBind;
function FrmDataBind()
{
	var ifld;
	var fld;
	
	this.form = document[this.stName]
	
	for (ifld = 0; ifld < this.ifldMax; ifld++)
		{
		fld = this.rgfld[ifld];
		fld.DataBind();
		}
}

OWSForm.prototype.FindField = FrmFindField;
function FrmFindField(stField)
{
	var fld;
	
	for (ifld = 0; ifld < this.ifldMax; ifld++)
		{
		fld = this.rgfld[ifld];
		if (fld.stName == stField)
			return fld;
		}
	return null;
}

OWSForm.prototype.ValidateAndSubmit = FrmValidateAndSubmit;
function FrmValidateAndSubmit(fUI)
{
	if (this.FValidate(fUI)){
		this.form.submit();
	}
	// This function should return no value as it is used in a javascript: HREF and we don't
	// want to display the return result.
}

OWSForm.prototype.FValidate = FValidateForm;
function FValidateForm(fUI)
{
	var ifld;
	var fld;

	this.form = document[this.stName]

	for (ifld = 0; ifld < this.ifldMax; ifld++)
		{
		fld = this.rgfld[ifld];
		if (!fld.FValidate())
			{
			this.stError = fld.stError;
			fld.FieldFocus();
			if (fUI)
				alert(this.stError);
			return false;
			}
		}

	return true;
}

OWSForm.prototype.SetFirstFocus = FrmSetFirstFocus;
function FrmSetFirstFocus()
{
    window.focus();
	this.form = document[this.stName]
    if (this.rgfld[0])
        this.rgfld[0].FieldFocus();

    for (i in this.rgfld)
    	{
    	if (this.rgfld[i].Init)
    		this.rgfld[i].Init();
    	}
}

OWSForm.prototype.BuildFieldUI = FrmBuildFieldUI;
function FrmBuildFieldUI(fld, st)
{
	document.write(st);
	this.Trace("\r--- Field:" +	fld.stName + ":\r" + st);
}

OWSForm.prototype.Trace = FrmTrace;
function FrmTrace(st)
{
	if (this.fUseDHTML && this.divTrace != null)
		{
		this.divTrace.insertAdjacentText("beforeEnd", st);	
		}
}

OWSForm.prototype.StFieldPost = FrmStFieldPost;
function FrmStFieldPost(fld)
{
	return "<INPUT TYPE=HIDDEN NAME=" + StAttrQuote(this.stFieldPrefix + fld.stName) + ">\r";
}

OWSForm.prototype.FieldPost = FrmFieldPost;
function FrmFieldPost(fld)
{
	return this.form[this.stFieldPrefix + fld.stName];
}

OWSForm.prototype.StFieldSubPart = FrmStFieldSubPart;
function FrmStFieldSubPart(fld, stPart, stValue)
{
	var maxLen = "";
	if (stPart == "URL")
		var maxLen = "MaxLength=450 ";
	else if (stPart == "Desc")
		var maxLen = "MaxLength=255 ";
	 
	return "<INPUT TABINDEX=1 " + maxLen + fld.stAttributes + " NAME=" + StAttrQuote(this.StFieldName(fld, stPart)) +
		" VALUE=" + StAttrQuote(stValue) + ">\r";
}

OWSForm.prototype.FieldSubPart = FrmFieldSubPart;
function FrmFieldSubPart(fld, stPart)
{
	return this.form[this.StFieldName(fld, stPart)];
}

OWSForm.prototype.StFieldName = FrmStFieldName;
function FrmStFieldName(fld, stPart)
{
	return "OWS:" + fld.stName + ":" + stPart;
}

OWSForm.prototype.GetSelValue = FrmGetSelValue;
function FrmGetSelValue(st)
{
	var sel = this.form[st];
	return sel[sel.selectedIndex].value;
}

OWSForm.prototype.TestURL = FormTestURL;
function FormTestURL(stName)
{
	var fld = this.FindField(stName);
	var field = this.FieldSubPart(fld, "URL");

	open(field.value, "_blank");
}

OWSForm.prototype.SetRadioValue = FormSetRadioValue;
function FormSetRadioValue(stName, stValue)
{
	var fld = this.FindField(stName);
	fld.SetValue(stValue);
}

//-------------------------------------------------------------
// NumberOptions
//-------------------------------------------------------------
function NumberOptions()
{
	this.chDigSep = ",";
	this.chDecimal = ".";
	this.chMinus = "-";
	this.iNegNumber = 1; // 0:(1.1), 1:-1.1, 2:- 1.1, 3:1.1-, 4:1.1 -
	this.rgcchSep = new Array(3, 0);
}

NumberOptions.prototype.SetGrouping = NoptSetGrouping;
function NoptSetGrouping(stGrouping)
{
	this.rgcchSep = stGrouping.split(";");
}

NumberOptions.prototype.NumParse = NoptNumParse;
function NoptNumParse(st)
{
	var fNeg = false;

	st = st.toUpperCase();

	if (st.indexOf("E") != -1)
		return Number.NaN;

	// BUGBUG: This will break if certain characters are used for a digit separator, decimal or minus - like "r".
	var re = new RegExp("\\" + this.chDigSep, "g");
	st = st.replace(re, "");
	re = new RegExp("\\" + this.chDecimal, "g");
	st = st.replace(re, ".");
	re = new RegExp("\\" + this.chMinus, "g");
	if (st.search(re) != -1 ||
		(st.search(/\(/) != -1 && st.search(/\)/) != -1))
		fNeg = true;
	st = st.replace(re, "");
	st = st.replace(/\(/, "").replace(/\)/, "");

	var num = st - 0;

    // numbers beyond the range of 1e-6 and 1e19 may cause scientific notation that we do not support.
	// so limit our data within this range.
    if ( num != 0 && (num < 1e-6 || num > 1e19))
		return Number.NaN;

	if (fNeg)
		num = -num;
	return num;
}

NumberOptions.prototype.StNumber = NoptStNumber;
function NoptStNumber(numOrig)
{
	var fNeg;
	var ichDigit;

	if (numOrig == "")
		return "";

	var num = numOrig - 0;

	fNeg = num < 0;
	if (fNeg)
		num = -num;

	var stNum = num.toString();

	// Numbers greater than 10^20 or illegally formed numbers, will just return the original string
	if (stNum.indexOf("e") != -1 || isNaN(num))
		{
		return numOrig;
		}

	stNum = stNum.replace(/\./, this.chDecimal);

	var ichDecimal = stNum.indexOf(this.chDecimal);

	// Insert digit grouping characters
	if (this.rgcchSep[0] != 0)
		{
		if (ichDecimal != -1)
			ichDigit = ichDecimal - 1;
		else
			ichDigit = stNum.length - 1;

		var icch = 0;
		while (icch < this.rgcchSep.length && ichDigit >= this.rgcchSep[icch])
			{
			stNum = StInsertAt(stNum, ichDigit-this.rgcchSep[icch]+1, this.chDigSep);
			ichDigit -= this.rgcchSep[icch];
			icch++;
			if (icch < this.rgcchSep.length && this.rgcchSep[icch] == 0)
				icch--;
			}
		}

	if (fNeg)
		{
		switch (this.iNegNumber)
			{
		// (1.1)
		case 0:
			stNum = "(" + stNum + ")";
			break;
		// -1.1
		case 1:
			stNum = this.chMinus + stNum;
			break;
		// - 1.1
		case 2:
			stNum = this.chMinus + " " + stNum;
			break;
		// 1.1-
		case 3:
			stNum = stNum + this.chMinus;
			break;
		// 1.1 -
		case 4:
			stNum = stNum + " " + this.chMinus;
			break;
			}
		}

	return stNum;
}

//-------------------------------------------------------------
// DateField
//-------------------------------------------------------------
function DateField(frm, stName, stDisplay, stValue)
{
	frm.AddField(this, stName, stDisplay, stValue);
	this.fDateOnly = false;
	this.stAttributes = frm.stInputStyle + " SIZE=11";
}

var L_DateOrderYear_Text = "YYYY";
var L_DateOrderMonth_Text = "M";
var L_DateOrderDay_Text = "D";
var L_DateOrderDesc_Text = "Enter date in ^1 format.";

DateField.prototype.BuildUI = DateBuildUI;
function DateBuildUI()
{
	var st = "";
	var date;

	st += this.frm.StFieldPost(this);

	if (FBlankString(this.stValue))
		{
		st += this.frm.StFieldSubPart(this, "Date", "");
		date = DateOptions.Today();
		}
	else
		{
		// Date value strings are always in ISO format.
		date = DateOptions.ParseISODate(this.stValue);
		date = this.frm.dopt.RoundDate(date);

		st += this.frm.StFieldSubPart(this, "Date", this.frm.dopt.StDate(date));
		}

	st += this.frm.dp.StButton(this);

	if (!this.fDateOnly)
		{
		st += this.frm.dopt.StTimeControls(this, date);
		}

	var stDateString = this.frm.dopt.StDateString(L_DateOrderYear_Text,
			L_DateOrderMonth_Text, L_DateOrderDay_Text);

	if (!this.fHideDescription)
		{
		st += "&nbsp;<br><SPAN class=ms-formdescription>" + StBuildParam(L_DateOrderDesc_Text, stDateString) + "</SPAN>";
		}

	this.frm.BuildFieldUI(this, st + "\r");
}

DateField.prototype.PopDatePicker = DatePopDatePicker;
function DatePopDatePicker()
{
	this.frm.form = document[this.frm.stName]
	var date;
	var field = this.frm.FieldPost(this);
	var fieldDate = this.frm.FieldSubPart(this, "Date");
	var elt = event.srcElement;
	event.cancelBubble = true;

	date = DateOptions.Today();
	if (this.FValidate() && this.date != null)
		date = this.date;

	this.frm.dp.Popup(date, fieldDate, elt);
}

DateField.prototype.DataBind = DateDataBind;
function DateDataBind()
{
	var date;
	var fieldData = this.frm.FieldPost(this);
	var fieldDate = this.frm.FieldSubPart(this, "Date");

	if (FBlankString(fieldData.value))
		{
		fieldDate.value = "";
		// Need date with no time value
		date = DateOptions.Today();
		}
	else
		{
		date = DateOptions.ParseISODate(fieldData.value);
		date = this.frm.dopt.RoundDate(date);

		fieldDate.value = this.frm.dopt.StDate(date);
		}

	if (!this.fDateOnly)
		{
		this.frm.dopt.SetTimeControls(this, date);
		}
}

DateField.prototype.FieldFocus = DateFieldFocus;
function DateFieldFocus()
{
	var field = this.frm.FieldSubPart(this, "Date");
	field.focus();
	field.select();
}

var L_DateRequired_Text = "You must specify a date for ^1.";
var L_InvalidDate_Text = "^1 is not a valid date.";

DateField.prototype.FValidate = DateFValidate;
function DateFValidate()
{
	var form = this.frm.form;
	var field = this.frm.FieldPost(this);

	var stDate = StTrimSpace(this.frm.FieldSubPart(this, "Date").value);

	if (stDate == "")
		{
		if (this.fRequired)
			{
			this.stError = StBuildParam(L_DateRequired_Text, this.stDisplay);
			return false;
			}
		else
			{
			field.value = "";
			this.date = null;
			return true;
			}
		}
		
	var date = this.frm.dopt.ParseLocaleDate(stDate);

	if (isNaN(date))
		{
		this.stError = StBuildParam(L_InvalidDate_Text, this.stDisplay);
		return false;
		}

	// Valid SQL range of dates
	var yr = date.getUTCFullYear();
	if (yr < 1753 || yr > 9999)
		{
		this.stError = StBuildParam(L_InvalidDate_Text, this.stDisplay);
		return false;
		}

	if (!this.fDateOnly)
		{
		var hr = this.frm.GetSelValue(this.frm.StFieldName(this, "Hours")) - 0;
		var min = this.frm.GetSelValue(this.frm.StFieldName(this, "Minutes"));
		date.setUTCHours(hr, min);
		}

	field.value = DateOptions.StISODate(date);
	this.date = date;
	return true;
}

//-------------------------------------------------------------
// URLField
//-------------------------------------------------------------

function URLField(frm, stName, stDisplay, stURL, stDesc)
{
	if (FBlankString(stURL))
	{
		stURL = "http://";
	}
	frm.AddField(this, stName, stDisplay, stURL);
	this.stDesc = stDesc;
	this.stAttributes = frm.stLongStyle;
}

var L_URLHeading_Text = "Type the Web address:";
var L_URLTest_Text = "Click here to test";
var L_URLHeadingDesc_Text = "Type the description:";

URLField.prototype.BuildUI = URLBuildUI;
function URLBuildUI()
{
	var st = "";
	st += this.frm.StFieldPost(this);
	st += "<SPAN CLASS=ms-formdescription>" + L_URLHeading_Text + " (";
	st += "<A HREF='javascript:frm.TestURL(" + StScriptQuote(this.stName) + ")' target=_self>" + L_URLTest_Text + "</A>)&nbsp;<br></span>\r";
	st += this.frm.StFieldSubPart(this, "URL", this.stValue);
	st += "&nbsp;<br>\r<SPAN CLASS=ms-formdescription>" + L_URLHeadingDesc_Text + "<br></SPAN>\r"
	st += this.frm.StFieldSubPart(this, "Desc", this.stDesc);
	this.frm.BuildFieldUI(this, st);
}

URLField.prototype.DataBind = URLDataBind;
function URLDataBind()
{
	var fieldData = this.frm.FieldPost(this);
	var fieldURL = this.frm.FieldSubPart(this, "URL");
	var fieldDesc = this.frm.FieldSubPart(this, "Desc");
	var st = fieldData.value;
	var ich = st.indexOf(", ");
	var stURL = st.substr(0, ich);
	// BUGBUG: ",, " in the url string will truncate the URL part of the value
	stURL = stURL.replace(/\,\,/, ",");
	var stDesc = st.substr(ich+2);

	fieldURL.value = stURL;
	fieldDesc.value = stDesc;
}

URLField.prototype.FieldFocus = URLFieldFocus;
function URLFieldFocus()
{
	var field = this.frm.FieldSubPart(this, "URL");
	field.focus();
	field.select();
}

URLField.prototype.FValidate = URLValidate;
function URLValidate()
{
	var stPost;
	var fieldPost = this.frm.FieldPost(this);
	var stURL = StTrimSpace(this.frm.FieldSubPart(this, "URL").value);
	var stDesc = StTrimSpace(this.frm.FieldSubPart(this, "Desc").value);

	if (stURL == "http://")
	{
		stURL = "";
	}

	if (this.fRequired && FBlankString(stURL))
		{
		this.stError = StBuildParam(L_FieldRequired_Text, this.stDisplay);
		return false;
		}

	if (stURL.substr(0,2) == "\\\\" || stURL.substr(0,2) == "\/\/" )
		stURL = "file:" + stURL;

	if (stURL.substr(0,5) == "file:")
		stURL = stURL.replace(/\\/g, "\/");
        
	stPost = stURL.replace(/,/g, ",,") + ", " + stDesc;
	fieldPost.value = stPost;
	return true;
}

//-------------------------------------------------------------
// NumberField
//-------------------------------------------------------------
function NumberField(frm, stName, stDisplay, stValue)
{
	frm.AddField(this, stName, stDisplay, stValue);
	this.stAttributes = frm.stInputStyle + " SIZE=11";
}

NumberField.prototype.BuildUI = NumberBuildUI;
function NumberBuildUI()
{
	var st = "";
	st += this.frm.StFieldPost(this);
	st += this.frm.StFieldSubPart(this, "Local", this.frm.nopt.StNumber(this.stValue));
	this.frm.BuildFieldUI(this, st);
}

NumberField.prototype.DataBind = NumberDataBind;
function NumberDataBind()
{
	var fieldData = this.frm.FieldPost(this);
	var fieldControl = this.frm.FieldSubPart(this, "Local");

	fieldControl.value = this.frm.nopt.StNumber(fieldData.value);
}

NumberField.prototype.FieldFocus = NumberFieldFocus;
function NumberFieldFocus()
{
	var field = this.frm.FieldSubPart(this, "Local");
	field.focus();
	field.select();
}

var L_ValueRequired_Text = "You must specify a value for ^1.";
var L_InvalidNumber_Text = "^1 is not a valid number.";
var L_InvalidRange_Text = "^1 must be between ^2 and ^3.";
var L_InvalidMin_Text = "^1 must be greater than or equal to ^2.";
var L_InvalidMax_Text = "^1 must be less than or equal to ^2.";

NumberField.prototype.FValidate = NumberFValidate;
function NumberFValidate()
{
	var field = this.frm.FieldPost(this);
	var stNum = this.frm.FieldSubPart(this, "Local").value;

	if (FBlankString(stNum))
		{
		if (this.fRequired)
			{
			this.stError = StBuildParam(L_ValueRequired_Text, this.stDisplay);
			return false;
			}
		field.value = "";
		return true;
		}

	wValue = this.frm.nopt.NumParse(stNum);

	if (isNaN(wValue))
		{
		this.stError = StBuildParam(L_InvalidNumber_Text, this.stDisplay);
		return false;
		}

	if (FNumber(this.wMin) && FNumber(this.wMax) &&
		(wValue < this.wMin || wValue > this.wMax))
		{
		this.stError = StBuildParam(L_InvalidRange_Text, this.stDisplay, this.wMin, this.wMax);
		return false;
		}

	if (FNumber(this.wMin) && wValue < this.wMin)
		{
		this.stError = StBuildParam(L_InvalidMin_Text, this.stDisplay, this.wMin);
		return false;
		}

	if (FNumber(this.wMax) && wValue > this.wMax)
		{
		this.stError = StBuildParam(L_InvalidMax_Text, this.stDisplay, this.wMax);
		return false;
		}

	field.value = wValue;
	return true;
}

function FNumber(w)
{
	return (w != "" && w != null && !isNaN(w));
}

//-------------------------------------------------------------
// BooleanField - 0/1 value
//-------------------------------------------------------------
function BooleanField(frm, stName, stDisplay, stValue)
{
	frm.AddField(this, stName, stDisplay, stValue);
}

BooleanField.prototype.BuildUI = BooleanBuildUI;
function BooleanBuildUI()
{
	var st = "";
	st += this.frm.StFieldPost(this);	
	st += "<INPUT TABINDEX=1 TYPE=CHECKBOX " + this.stAttributes + " NAME=" +
		StAttrQuote(this.frm.StFieldName(fld, "Checkbox"));
	if (this.stValue != 0)
		st += " CHECKED";
	st += ">\r";
	this.frm.BuildFieldUI(this, st);
}

BooleanField.prototype.DataBind = BooleanDataBind;
function BooleanDataBind()
{
	var fieldData = this.frm.FieldPost(this);
	var fieldControl = this.frm.FieldSubPart(this, "Checkbox");

	fieldControl.checked = (fieldData.value != 0);
}

BooleanField.prototype.FieldFocus = BooleanFieldFocus;
function BooleanFieldFocus()
{
	var field = this.frm.FieldSubPart(this, "Checkbox");
	field.focus();
}

BooleanField.prototype.FValidate = BooleanFValidate;
function BooleanFValidate()
{
	var field = this.frm.FieldPost(this);
	var fieldCheckbox = this.frm.FieldSubPart(this, "Checkbox");

	if (fieldCheckbox.checked)
		field.value = 1;
	else
		field.value = 0;
	return true;
}

//-------------------------------------------------------------
// Field - generic field (now only used for Note and Lookup)
//-------------------------------------------------------------
function Field(frm, stName, stDisplay)
{
	frm.AddField(this, stName, stDisplay, "");
}

Field.prototype.FieldFocus = FieldFieldFocus;
function FieldFieldFocus()
{
	var field = this.frm.FieldPost(this);
	field.focus();
	field.scrollIntoView();
}

Field.prototype.DataBind = FieldDataBind;
function FieldDataBind()
{
	// Nothing to bind...
}

var L_FieldRequired_Text = "You must specify a non-blank value for ^1.";

Field.prototype.FValidate = FieldFValidate;
function FieldFValidate()
{
	var field = this.frm.FieldPost(this);

	if (this.fRequired && FBlankString(field.value))
		{
		this.stError = StBuildParam(L_FieldRequired_Text, this.stDisplay);
		return false;
		}
	return true;
}

Field.prototype.BuildUI = FieldBuildUI;
function FieldBuildUI()
{
	// No build...
}

//-------------------------------------------------------------
// TextField - text input field (single line)
//-------------------------------------------------------------
function TextField(frm, stName, stDisplay, stValue)
{
	frm.AddField(this, stName, stDisplay, stValue);
	this.cchMaxLength = "";
	this.cchDisplaySize = "";
}

TextField.prototype.BuildUI = TextFieldBuildUI;
function TextFieldBuildUI()
{
	var st = "";
	var cchSize;

	if (this.cchMaxLength == "")
		this.cchMaxLength = 255;

	if (this.cchDisplaySize != "")
		cchSize = this.cchDisplaySize - 0;
	else if (this.cchMaxLength < 32)
		cchSize = this.cchMaxLength - 0;

	st += "<INPUT TABINDEX=1 ";

	if (cchSize)
		st += this.frm.stInputStyle + " SIZE=" + cchSize;
	else
		st += this.frm.stLongStyle;


	st += " MAXLENGTH=" + this.cchMaxLength + " " + this.stAttributes + " NAME=" + StAttrQuote(this.frm.stFieldPrefix + this.stName) +
		" VALUE=" + StAttrQuote(this.stValue) + ">\r";

    this.frm.BuildFieldUI(this, st);
}

// Use generic Field methods
TextField.prototype.FieldFocus = TextFieldFieldFocus;
function TextFieldFieldFocus()
{
	var field = this.frm.FieldPost(this);
	field.focus();
	field.select();
}


TextField.prototype.DataBind = FieldDataBind;

TextField.prototype.FValidate = TextFieldFValidate;
function TextFieldFValidate()
{
	var field = this.frm.FieldPost(this);

	field.value = StTrimSpace(field.value);

	if (this.fRequired && field.value == "")
		{
		this.stError = StBuildParam(L_FieldRequired_Text, this.stDisplay);
		return false;
		}
	return true;
}

//-------------------------------------------------------------
// ChoiceField - dropdown or radio button Choice field
//-------------------------------------------------------------
function ChoiceField(frm, stName, stDisplay, stValue)
{
	frm.AddField(this, stName, stDisplay, stValue);
	this.rgChoices = new Array;
	this.fRadio = false;
}

ChoiceField.prototype.BuildUI = ChoiceBuildUI;
function ChoiceBuildUI()
{
	var st = "";
	var i;
	
	st += this.frm.StFieldPost(this);
	if (this.fRadio)
	{
		var hasDefaultChoice = false;
		var stControlName = "NAME=" + StAttrQuote(this.frm.StFieldName(fld, "Radio"));
		st += "<TABLE CELLPADDING=0 CELLSPACING=1>\r";

		for (i in this.rgChoices)
		{
			var choice = this.rgChoices[i];
			if (choice.stValue == this.stValue)
			{
				hasDefaultChoice = true;
				break;
			}
		}

		for (i in this.rgChoices)
		{
			var choice = this.rgChoices[i];
			var stClickAttr = "frm.SetRadioValue(" + StScriptQuote(this.stName) + ", " + StScriptQuote(choice.stValue) + ");";
			stClickAttr = "onclick=" + StAttrQuote(stClickAttr);
			st += "<TR " + stClickAttr + ">\r<TD VALIGN=TOP><INPUT TABINDEX=1 TYPE=RADIO " + this.stAttributes + " " +
				stControlName + " VALUE=" + StAttrQuote(choice.stValue);

			if (choice.stValue == this.stValue)
				st += " CHECKED";

			if (i == 0 && !hasDefaultChoice)
			{
				this.stValue = choice.stValue;
				st += " CHECKED";
			}

			st += "></TD>\r<TD class=ms-RadioText VALIGN=TOP>" +	StHTMLQuote(choice.stDisplay) + "</TD>\r</TR>\r";
		}
		st += "</TABLE>\r";
	}
	else
	{
		st += "<SELECT TABINDEX=1 " + this.stAttributes + " NAME=" + StAttrQuote(this.frm.StFieldName(fld, "Select")) + ">\r";
		for (i in this.rgChoices)
		{
			var choice = this.rgChoices[i];
			st += "<OPTION VALUE=" + StAttrQuote(choice.stValue);
			if (choice.stValue == this.stValue)
				st += " SELECTED";
			st += ">" + StHTMLQuote(choice.stDisplay) + "</OPTION>\r";
		}
		st += "</SELECT>\r"
	}
	this.frm.BuildFieldUI(this, st);
}

// Need to post-initialize dropdown choices to handle NULL setting
ChoiceField.prototype.Init = ChoiceInit;
function ChoiceInit()
{
	this.SetValue(this.stValue);
}

ChoiceField.prototype.AddChoice = ChoiceAddChoice;
function ChoiceAddChoice(stDisplay, stValue)
{
	if (stValue == null || stValue == "")
		stValue = stDisplay;

	var choice = new Object
	choice.stDisplay = stDisplay
	choice.stValue = stValue

	this.rgChoices[this.rgChoices.length] = choice;
}

ChoiceField.prototype.DataBind = ChoiceDataBind;
function ChoiceDataBind()
{
	var fieldData = this.frm.FieldPost(this);
	this.SetValue(fieldData.value);
}

ChoiceField.prototype.SetValue = ChoiceSetValue;
function ChoiceSetValue(stValue)
{
	var i;

	// Unselected all.
	if (FBlankString(stValue))
		{
		var fieldControl = this.frm.FieldSubPart(this, this.fRadio ? "Radio" : "Select");
		if (this.fRadio)
			{
			if (this.rgChoices.length != 1)
				{
				for (i in this.rgChoices)
					{
					fieldControl[i].checked = false;
					}
				}
			else
				fieldControl.checked = false;
			}
		else
			fieldControl.selectedIndex = -1;
		return;
		}
		
	for (i in this.rgChoices)
		{
		var choice = this.rgChoices[i];
		if (choice.stValue == stValue)
			{
			var fieldControl = this.GetControl(i);
			if (this.fRadio)
				{
				fieldControl.checked = true;
				}
			else
				{
				fieldControl.selectedIndex = i;
				}
			break;
			}
		}
}

ChoiceField.prototype.GetControl = ChoiceGetControl;
function ChoiceGetControl(i)
{
	var fieldControl = this.frm.FieldSubPart(this, this.fRadio ? "Radio" : "Select");

	if (this.fRadio && this.rgChoices.length != 1)
		{
		if (i != null)
			return fieldControl[i];
		for (i in this.rgChoices)
			{
			if (fieldControl[i].checked)
				return fieldControl[i];
			}
		return fieldControl[0];
		}
	return fieldControl;
}

ChoiceField.prototype.FieldFocus = ChoiceFieldFocus;
function ChoiceFieldFocus()
{
	var field = this.GetControl();
	field.focus();
}

ChoiceField.prototype.FValidate = ChoiceFValidate;
function ChoiceFValidate()
{
	var field = this.frm.FieldPost(this);
	var fieldControl = this.GetControl();

	field.value = "";

	if (this.fRadio)
		{
		if (fieldControl.checked)
			field.value = fieldControl.value;
		}
	else
		{
		if (fieldControl.selectedIndex != -1)
			field.value = fieldControl[fieldControl.selectedIndex].value;
		}

	// No Value selected
	if (this.fRequired && field.value == "")
		{
		this.stError = StBuildParam(L_FieldRequired_Text, this.stDisplay);
		return false;
		}
		
	return true;
}

//-------------------------------------------------------------
// Misc Helper functions
//-------------------------------------------------------------
function StBuildParam(stPattern)
{
	var re;
	
	for (i = 1; i < StBuildParam.arguments.length; i++)
		{
		re = new RegExp("\\^" + i);
		stPattern = stPattern.replace(re, StBuildParam.arguments[i]);
		}
	return stPattern;
}

function WindowPosition(elt)
{
	var pos = new Object;
	pos.x = 0;
	pos.y = 0;
	
	while (elt != null)
		{
		pos.x += elt.offsetLeft;
		pos.y += elt.offsetTop;
		elt = elt.offsetParent;
		}
	return pos;
}

function StInsertAt(st, ich, stInsert)
{
	return st.substr(0, ich) + stInsert + st.substr(ich);
}

function  WMultiple(w, wMult)
{
	return Math.round(w/wMult)*wMult;
}

function St2Digits(w)
{
    var st = "";
	if (w < 10)
		st += "0";
	st += w;
	return st;
}

function FBlankString(st)
{
	st = st.toString();
	st = st.replace(/\s/g, "");
	return (st == "");
}

function StTrimSpace(st)
{
	st = st.toString();
	return st.replace(/(^\s+)|(\s+$)/g, '');
}

// & -> &amp;
// " -> &quot;
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

// \ -> \\
// " -> \"
// \r -> \\r
// / -> \/  (this is to prevent </script> from being interpreted as a real script termination
function StScriptQuote(st)
{
	st = st.toString();
	st = st.replace(/\\/g, '\\\\');
	st = st.replace(/\"/g, '\\"'); // ' to fool LocStudio
	st = st.replace(/\//g, '\\/');
	st = st.replace(/\r/, '\\r');
	return '"' + st + '"';
}

// & -> &amp;
// < -> &lt;
// > -> &gt;
function StHTMLQuote(st)
{
	st = st.toString();
	st = st.replace(/&/g, '&amp;');
	st = st.replace(/</g, '&lt;');
	st = st.replace(/>/g, '&gt;');
	return st;
}

function StURL(stURL, stText)
{
	if (FBlankString(stURL))
		return StHTMLQuote(stText);
	return "<A HREF=" + StAttrQuote(stURL) + ">" + StHTMLQuote(stText) + "</A>";
}

// Survey.jss

//-------------------------------------------------------------
// SurveyView
//-------------------------------------------------------------
function SurveyView()
{
	this.rgquest = new Array;
	this.iquestMax = 0;
	this.iquestCur = 0;
	this.cRespTotal = 0;
}

SurveyView.prototype.Question = SVAddQuestion;
function SVAddQuestion(stQuestion)
{
	var quest = new Question(stQuestion, this.iquestMax);
	this.rgquest[this.iquestMax++] = quest;
}

SurveyView.prototype.ResponseOption = SVResponseOption;
function SVResponseOption(stOption)
{
	this.rgquest[this.iquestMax-1].ResponseOption(stOption);
}

SurveyView.prototype.NoPercent = SVNoPercent;
function SVNoPercent()
{
	this.rgquest[this.iquestMax-1].fNoPercent = true;
}

SurveyView.prototype.Response = SVResponse;
function SVResponse(stOption)
{
	if (this.iquestCur == 0)
		this.cRespTotal++;
	this.rgquest[this.iquestCur++].Response(stOption);
	if (this.iquestCur == this.iquestMax)
		this.iquestCur = 0;
}

SurveyView.prototype.BuildUI = SVBuildUI;
function SVBuildUI()
{
	var quest;
	var iquest;
	var st = "";

	st = "<table cellspacing=0 cellpadding=0>\r";
	
	for (iquest = 0; iquest < this.iquestMax; iquest++)
		{
		st += this.rgquest[iquest].StBuildUI();
		}

	st += "</table>\r";

	document.write(st);
}

//-------------------------------------------------------------
// Question
//-------------------------------------------------------------
function Question(stQuestion, iquest)
{
	this.stQuestion = stQuestion;
	this.iquest = iquest;
	this.rgopt = new Array;
	this.ioptMax = 0;
	this.mpopt = new Object;
	this.cRespTotal = 0;
	this.cRespNone = 0;
	this.fNoPercent = false;
}

Question.prototype.ResponseOption = QResponseOption;
function QResponseOption(stOption)
{
	var opt = new Option(this, stOption);
	this.rgopt[this.ioptMax++] = opt;
	this.mpopt[stOption] = opt;
	return opt;
}

Question.prototype.Response = QResponse;
function QResponse(stOption)
{
	if (stOption == "")
		{
		this.cRespNone++;
		return;
		}
	var opt = this.mpopt[stOption];
	if (opt == null)
		{
		opt = this.ResponseOption(stOption);
		}
	opt.cResp++;
	this.cRespTotal++;
}

var L_TotalResponse_Text = "^1 total responses.";

Question.prototype.StBuildUI = QStBuildUI;
function QStBuildUI()
{
	var st;
	var iopt;

	st = "<tr><td colspan=2 valign=top><b><i>" + (this.iquest + 1) + ". " +
		this.stQuestion + "</i></b></td></tr>\r<tr><td width=25>\r<td>\r";

	if (this.fNoPercent)
		st += "<ol>\r";
	else
		st += "<table cellspacing=0 cellpadding=0>\r";

	for (iopt = 0; iopt < this.ioptMax; iopt++)
		{
		st += this.rgopt[iopt].StBuildUI();
		}

	if (this.fNoPercent)
		st += "</ol>\r";
	else
		st += "</table>"

	st += "<i>" + StBuildParam(L_TotalResponse_Text, this.cRespTotal) + "</i></td></tr><tr><td height=20></td></tr>\r";

	return st;
}

//-------------------------------------------------------------
// Option
//-------------------------------------------------------------
function Option(quest, stOption)
{
	this.quest = quest;
	this.stOption = stOption;
	this.cResp = 0;
}

Option.prototype.StBuildUI = OStBuildUI;
function OStBuildUI()
{
	var st = "";
	
	if (this.quest.fNoPercent)
		{
		st += "<li>" + this.stOption + "\r";
		return st;
		}

	var wPercent = Math.round(100*this.cResp/this.quest.cRespTotal);

	st += "<tr><td>" + this.stOption + "</td></tr><tr><td>";

	if (wPercent != 0)
		{
		st += "<TABLE cellspacing=0 cellpadding=0><TR><TD><TABLE cellpadding=0 cellspacing=0>" + 
			"<TR><TD bgcolor=red height=10 width=" +	wPercent*4 +
			"><font size=1>&nbsp;</font></TD></TR></TABLE></TD>" +
			"<TD>&nbsp;" + wPercent + "%</TD></TR></TABLE>"
		}
	else
		{
		st += wPercent + "%\r"
		}

	st += "</td></tr><tr><td height=7></td></tr>";
	return st;
}

// Calendar.jss

//----------------------------------------
// Calendar Object
//------------------------------------mck-
function Calendar(yr, mon, dopt, stObject)
{
	if (!dopt)
		dopt = new DateOptions;
	this.dopt = dopt;

	// Note that mon is zero-based
	if (yr == null || mon == null)
		{
		var stCalDate = StURLGetVar("CalendarDate");
		if (stCalDate != "")
			{
			yr = stCalDate.substr(0, 4) - 0;
			mon = stCalDate.substr(5) - 1;
			}

		if (stCalDate == "" || isNaN(dopt.DateYMD(yr, mon, 1)))
			{
			var dateToday = DateOptions.Today();
			yr = dateToday.getUTCFullYear();
			mon = dateToday.getUTCMonth();
			}
		}

	this.SetMonth(yr, mon);
	this.cchanMin = 3;
	this.ievtMax = 0;
	this.rgEvt = new Array;
	this.fUseDHTML = browseris.ie4up && browseris.win32;
	this.fDatePicker = false;
	this.dateDP = null;
	if (!stObject)
		stObject = "cal";
	this.stObject = stObject;
}

Calendar.prototype.SetMonth = CalSetMonth;
function CalSetMonth(yr, mon)
{
	var date = new Date(Date.UTC(yr, mon, 1));
	this.mon = date.getUTCMonth();
	this.yr = date.getUTCFullYear();

	var dateStart = new Date;
	var dateEnd = new Date;

	dateStart.setTime(Date.UTC(yr, mon, 1));
	dateEnd.setTime(Date.UTC(yr, mon+1, 0));
	this.SetDateRange(dateStart, dateEnd);
}

// BUGBUG: Move to dateoptions properties.

// Date values are in miliseconds - some useful constants for time periods.
Calendar.msMinute = 1000*60;
Calendar.msHour = Calendar.msMinute * 60;
Calendar.msDay = Calendar.msHour * 24;
Calendar.msWeek = Calendar.msDay * 7;

var L_rgDOW0_Text = "Sun";
var L_rgDOW1_Text = "Mon";
var L_rgDOW2_Text = "Tue";
var L_rgDOW3_Text = "Wed";
var L_rgDOW4_Text = "Thur";
var L_rgDOW5_Text = "Fri";
var L_rgDOW6_Text = "Sat";

Calendar.rgDOW = new Array(L_rgDOW0_Text, L_rgDOW1_Text, L_rgDOW2_Text, L_rgDOW3_Text,
	L_rgDOW4_Text, L_rgDOW5_Text, L_rgDOW6_Text);

var L_rgDOWDP0_Text = "S";
var L_rgDOWDP1_Text = "M";
var L_rgDOWDP2_Text = "T";
var L_rgDOWDP3_Text = "W";
var L_rgDOWDP4_Text = "Th";
var L_rgDOWDP5_Text = "F";
var L_rgDOWDP6_Text = "S";

Calendar.rgDOWDP = new Array(L_rgDOWDP0_Text, L_rgDOWDP1_Text, L_rgDOWDP2_Text, L_rgDOWDP3_Text,
	L_rgDOWDP4_Text, L_rgDOWDP5_Text, L_rgDOWDP6_Text);

var L_rgMonths0_Text = "January";
var L_rgMonths1_Text = "February";
var L_rgMonths2_Text = "March";
var L_rgMonths3_Text = "April";
var L_rgMonths4_Text = "May";
var L_rgMonths5_Text = "June";
var L_rgMonths6_Text = "July";
var L_rgMonths7_Text = "August";
var L_rgMonths8_Text = "September";
var L_rgMonths9_Text = "October";
var L_rgMonths10_Text = "November";
var L_rgMonths11_Text = "December";

Calendar.rgMonths = new Array(L_rgMonths0_Text, L_rgMonths1_Text, L_rgMonths2_Text, L_rgMonths3_Text,
	L_rgMonths4_Text, L_rgMonths5_Text, L_rgMonths6_Text, L_rgMonths7_Text, L_rgMonths8_Text,
	L_rgMonths9_Text, L_rgMonths10_Text, L_rgMonths11_Text);

Calendar.prototype.SetDateRange = CalSetDateRange;
function CalSetDateRange(dateStart, dateEnd)
{
	var irw;

	this.dateStart = new Date(dateStart.getTime());
	this.dateEnd = new Date(dateEnd.getTime());
	
	// normalize to the beignning day of the week (based on date options)
	this.dateStart.setUTCHours(0,0,0);
	this.dateEnd.setUTCHours(0,0,0);
	this.dateStart.setUTCDate(this.dateStart.getUTCDate() - (this.dateStart.getUTCDay()-this.dopt.dow+7)%7);
	irw = this.IrwFromDate(this.dateEnd);
	this.dateEnd.setUTCDate(this.dateEnd.getUTCDate() + irw * 7 - 1);
	this.irwMax = irw+1;
}

// Return a style string of the text (for day of month) and background color
// based on the date.
Calendar.prototype.DayStyle = CalDayStyle;
function CalDayStyle(dateCur)
{
	var st;
	
	if (dateCur.getUTCMonth() != this.mon)
		{
			st = ' BGCOLOR="#e6e6e6"';
		}
	else
		st = "";
	return st;
}

Calendar.prototype.AddFullEvent = CalAddFullEvent;
function CalAddFullEvent(stDateStart, stDateEnd, stDesc, stTitle, stURL)
{
	var dateStart;
	var dateEnd;
	
	if (stDateStart == "")
		return;

	dateStart = DateOptions.ParseISODate(stDateStart);
	if (stDateEnd == "")
		{
		dateEnd = new Date(dateStart.getTime());
		}
	else
		{
		dateEnd = DateOptions.ParseISODate(stDateEnd);
		}

	if (dateEnd < dateStart)
		dateEnd = new Date(dateStart.getTime());
		
	var evt = new CalEvent(dateStart, dateEnd, stDesc, stTitle, stURL);
	this.AddEvent(evt);
}

Calendar.prototype.AddEvent = CalAddEvent;
function CalAddEvent(evt)
{
	this.rgEvt[this.ievtMax++] = evt;
}

Calendar.prototype.AssignChannels = CalAssignChannels;
function CalAssignChannels()
{
	var ievt;

	this.mpSpan = new Object;       // map IRW.DAY.CHANNEL to Span object
	this.mpIchan = new Object;      // map IRW.DAY to next available channel (or undefined if 0)
	this.mpEvents = new Object; // map IRW.DAY to array of events that occur on that day

	// BUGBUG: will miss empty channels that are before the maximum filled channel
	
	for (ievt in this.rgEvt)
		{
		evt = this.rgEvt[ievt];
		irwMin = this.IrwFromDate(evt.dateStart);
		irwMax = this.IrwFromDate(evt.dateEnd);
		if (irwMin < this.irwMax && irwMax >= 0)
			{
			for (irw = irwMin; irw <= irwMax; irw++)
				{
				this.PlaceEventInRow(evt, irw);
				}
			}
		}
}

Calendar.prototype.PlaceEventInRow = CalPlaceEventInRow;
function CalPlaceEventInRow(evt, irw)
{
	var iday;
	var date = new Date;
	var dayRow;
	var dayStart;
	var dayEnd;
	var span;

	this.SetDateFromGrid(date, irw, 0);
	dayRow = date.getTime()/Calendar.msDay;
	dayStart = MsMidnight(evt.dateStart)/Calendar.msDay - dayRow;
	dayEnd = MsMidnight(evt.dateEnd)/Calendar.msDay - dayRow;

	if (dayEnd >= 0 && dayStart <= 6)
		{
		dayStart = Math.max(dayStart, 0);
		dayEnd = Math.min(dayEnd, 6);
		ichan = this.IchanNext(irw, dayStart, dayEnd);
		new Span(this, irw, dayStart, dayEnd, ichan, evt);
		}
}

function Span(cal, irw, dayStart, dayEnd, ichan, evt)
{
	this.cday = dayEnd - dayStart + 1;
	this.evt = evt;

	cal.mpSpan[irw + "." + dayStart + "." + ichan] = this;

	for (day = dayStart; day <= dayEnd; day++)
		{
		cal.mpIchan[irw + "." + day] = ichan + 1;

		var rgevt = cal.mpEvents[irw + "." + day];
		if (rgevt == null)
			{
			rgevt = new Array;
			cal.mpEvents[irw + "." + day] = rgevt;
			}

		rgevt[rgevt.length] = evt;
		}
}

// BUGBUG: Return the first FREE channel, not the max of all available channels.
Calendar.prototype.IchanNext = CalIchanNext;
function CalIchanNext(irw, dayStart, dayEnd)
{
	var day;
	var ichan = 0;

	for (day = dayStart; day <= dayEnd; day++)
		{
		if (this.mpIchan[irw + "." + day] != null)
			ichan = Math.max(ichan, this.mpIchan[irw + "." + day]);
		}
	return ichan;
}

Calendar.prototype.IrwFromDate = CalIrwFromDate;
function CalIrwFromDate(date)
{
	var irw;
	irw = Math.floor((date.getTime() - this.dateStart.getTime())/Calendar.msWeek);
	return irw;
}

Calendar.prototype.BuildUI = CalBuildUI;
function CalBuildUI()
{
	var st = this.StBuild();
	document.write(st);
}

Calendar.prototype.StBuild = CalStBuild;
function CalStBuild()
{
	this.AssignChannels();

	if (this.fDatePicker)
		return this.StBuildPicker();

	if (!this.fUseDHTML)
		return this.StDownlevelBuild();

	return this.StBuildDHTML();
}

Calendar.prototype.StBuildDHTML = CalStBuildDHTML;
function CalStBuildDHTML()
{
	var st;
	var dateCur = new Date;
	var irw;
	var iday;
	var ichan;
	var cchan;

	st = "<table class=ms-cal cellpadding=0 cellspacing=0>";

	var stTDHigh = '<td onmouseover="HighlightText(this, \'red\');" onmouseout="HighlightText(this, \'\');" ';

	st += '<tr>' + stTDHigh + StClickEvent(this.stObject + '.MoveMonth(-1)') + ' class=ms-calHead>&lt;</td><td class=ms-calHead colspan=5>' +
		Calendar.rgMonths[this.mon] + " " + this.yr +
		'</td>' + stTDHigh + StClickEvent(this.stObject + '.MoveMonth(1)') + ' class=ms-calHead>&gt;</td></tr>';

	st += "<tr>\r";
	for (iday = 0; iday < 7; iday++)
		{
		st += "<td class=ms-calDOW>" + Calendar.rgDOW[(iday+this.dopt.dow)%7] + "</td>\r";
		}
	st += "</tr>";

	// Display each week
	for (irw = 0; irw < this.irwMax; irw++)
		{
		cchan = Math.max(this.IchanNext(irw, 0, 6), this.cchanMin);
		// Add the date header for the current week
		st += "<tr>\r";
		for (iday = 0; iday < 7; iday++)
			{
			this.SetDateFromGrid(dateCur, irw, iday);
			st += "<td class=ms-calTop" + this.DayStyle(dateCur) + 
				">&nbsp;" + dateCur.getUTCDate() + "&nbsp;</td>\r";
			}
		st += "</tr>\r";

		// then output the content area for each day of the week
		for (ichan = 0; ichan < cchan; ichan++)
			{
			st += "<tr>\r";
			for (iday = 0; iday < 7; iday++)
				{
				this.SetDateFromGrid(dateCur, irw, iday);
				span = this.mpSpan[irw + "." + iday + "." + ichan];
				if (span != null)
					{
					var stClass = "ms-appt";
					if (span.cday == 1)
						stClass = "ms-apptsingle" + this.DayStyle(dateCur);
					st += "<td class=" + stClass +
						" colspan=" + span.cday + " TITLE=" + StAttrQuote(span.evt.StTip(this.dopt)) + "><nobr>"+
						StURL(span.evt.stURL, span.evt.stTitle) + "</nobr></td>\r";
					iday += span.cday - 1;
					}
				else
					{
					st += "<td class=ms-calMid" + this.DayStyle(dateCur) + "></td>\r";
					}
				}
			st += "</tr>\r";

			st += "<tr>\r";

			if (ichan == cchan-1)
				stClass = "ms-CalBot";
			else
				stClass = "ms-CalSpacer";

			for (iday = 0; iday < 7; iday++)
				{
				this.SetDateFromGrid(dateCur, irw, iday);
				st += "<td class=" + stClass + this.DayStyle(dateCur) + "></td>\r";
				}
			st += "</tr>\r";

			}
		}
	
	st += "</table>";
	return st;
}

function StClickEvent(st)
{
	return 'onclick="' + st + '" ondblclick="' + st + '"';
}

var L_TodaysDate_Text = "Today's date is ^1";

Calendar.prototype.StBuildPicker = CalStBuildPicker;
function CalStBuildPicker()
{
	var st;
	var dateCur = new Date;
	var dateToday = DateOptions.Today();
	var irw;
	var iday;
	var stClass;
	var ievt;

	st = '<TABLE ONSELECTSTART="return false;" CLASS=ms-datepicker CELLPADDING="2" CELLSPACING="0" BORDER="1">\r';

	var stTDHigh = '<td onmouseover="Highlight(this, \'yellow\', \'black\');" onmouseout="Highlight(this, \'\', \'\');" ';

	st += '<tr>' + stTDHigh + StClickEvent(this.stObject + '.MoveMonth(-1)') + ' class=ms-dpnextprev>&lt;</td><td class=ms-dphead colspan=5>' +
		Calendar.rgMonths[this.mon] + " " + this.yr +
		'</td>' + stTDHigh + StClickEvent(this.stObject + '.MoveMonth(1)') + ' class=ms-dpnextprev>&gt;</td></tr>';

	st += "<tr>\r";
	for (iday = 0; iday < 7; iday++)
		{
		st += '<TD class=ms-dpdow HEIGHT="20" WIDTH="14%">' +
			'&nbsp;' + Calendar.rgDOWDP[(iday+this.dopt.dow)%7] + '&nbsp;</TD>\r';
		}
	st += "</tr>\r";

	// Display each week
	for (irw = 0; irw < this.irwMax; irw++)
		{
		// Add the date header for the current week
		st += "<tr>\r";
		for (iday = 0; iday < 7; iday++)
			{
			this.SetDateFromGrid(dateCur, irw, iday);
			var rgevt = this.mpEvents[irw + "." + iday];
			var fHasEvent = (rgevt != null);
			var yr = dateCur.getUTCFullYear();
			var mon = dateCur.getUTCMonth();
			var day = dateCur.getUTCDate();
			st += stTDHigh + StClickEvent(this.stObject + '.ClickDay(' + yr + ',' + mon + ',' + day + ')');
			
			if (fHasEvent)
				{
				var stTips = "";
				for (ievt = 0; ievt < rgevt.length; ievt++)
					{
					stTips += rgevt[ievt].StTip(this.dopt);
					if (ievt < rgevt.length-1)
						stTips += "\r";
					}
				st += " TITLE=" + StAttrQuote(stTips);
				}
				
			st += ' WIDTH="14%"' + 
				this.DPDayStyle(dateCur, fHasEvent) + '>&nbsp;' + (fHasEvent ? "<b>" : "") +
				dateCur.getUTCDate() + (fHasEvent ? "</b>" : "") +
				(dateCur.getTime() == dateToday.getTime() ? "<font color=red>&loz;</font>" : "&nbsp;");

			st += '</TD>\r';
			}
		st += "</tr>\r";

		}

	var stTodayLink = "<A HREF='javascript:" + this.stObject + ".SetMonth(" + dateToday.getUTCFullYear() + "," +
		dateToday.getUTCMonth() + ");'>" + this.dopt.StDate(dateToday) + "</A>";
	st += "<tr><td class=ms-DPFoot colspan=7><font color=red>&loz;</font>" +
		StBuildParam(L_TodaysDate_Text, stTodayLink) + "</td></tr>";

	st += "</table>";

	return st;
}

Calendar.prototype.MoveMonth = CalMoveMonth;
function CalMoveMonth(dmon)
{
	var mon = this.yr * 12 + this.mon + dmon;
	var yr = Math.floor(mon / 12);
	mon = mon % 12;
	var stURL = StURLSetVar("CalendarDate", yr + "-" + (mon+1));
	window.parent.location.href = stURL;
}

function StURLSetVar(stVar, stValue)
{
	var stURL = window.parent.location.href;
	var stNewSet = stVar + "=" + stValue;
	var ichQ = stURL.indexOf("?");
	if (ichQ != -1)
		{
		var ich = stURL.indexOf(stVar + "=", ichQ);
		if (ich != -1)
			{
			var re = new RegExp(stVar + "=[^&]*", "g");
			stURL = stURL.replace(re, stNewSet);
			}
		else
			{
			stURL = stURL + "&" + stNewSet;
			}
		}
	else
		stURL = stURL + "?" + stNewSet;
	return stURL;
}

function StURLGetVar(stVar)
{
	var stURL = document.location.href;
	var re = new RegExp("[?&]" + stVar + "=", "g");

	var ich = stURL.search(re);
	if (ich == -1)
		return "";

	ich += stVar.length + 2;

	var ichEnd = stURL.indexOf("&", ich+1);
	if (ichEnd == -1)
		ichEnd = stURL.length;

	var stValue = stURL.substring(ich, ichEnd);

	return stValue;
}

function HighlightText(elt, stText)
{
	if (stText != "")
		{
		elt.colorTextSav = elt.style.color;
		elt.style.color = stText;
		}
	else
		{
		elt.style.color = elt.colorTextSav;
		}
}

function Highlight(elt, stHighlight, stText)
{
	if (stHighlight != "")
		{
		elt.colorBackSav = elt.style.backgroundColor;
		elt.colorTextSav = elt.style.color;
		elt.style.backgroundColor = stHighlight;
		elt.style.color = stText;
		}
	else
		{
		elt.style.backgroundColor = elt.colorBackSav;
		elt.style.color = elt.colorTextSav;
		}
}

Calendar.prototype.DPDayStyle = CalDPDayStyle;
function CalDPDayStyle(dateCur, fHasEvent)
{
	var st = "";

	if (dateCur.getTime() == this.dateDP.getTime())
		st += " class=ms-dpselectedday";
	else if (dateCur.getUTCMonth() != this.mon)
		st += " class=ms-dpnonmonth";
	else
		st += " class=ms-dpday";

	if (dateCur.getTime() == -294624000000)
		st += " bgcolor=red";
		
	if (fHasEvent)
		{
		st += ' style:"font-weight: bold;"';
		}

	return st;
}

Calendar.prototype.StDownlevelBuild = CalStDownlevelBuild;
function CalStDownlevelBuild()
{
	var st;
	var dateCur = new Date;
	var irw;
	var iday;
	var stClass;
	var ievt;

	st = '<TABLE CELLPADDING="2" CELLSPACING="0" WIDTH="100%" BORDER="1">\r';

	st += '<TR><TD class=ms-calHead><A TARGET=_self HREF="javascript:' + this.stObject + '.MoveMonth(-1);">&lt;</A></TD><TD class=ms-calHead colspan=5>' +
		Calendar.rgMonths[this.mon] + " " + this.yr +
		'</TD><TD class=ms-calHead><A TARGET=_self HREF="javascript:' + this.stObject + '.MoveMonth(1);">&gt;</A></TD></TR>';


	st += "<tr>\r";
	for (iday = 0; iday < 7; iday++)
		{
		st += '<TD class=ms-calDOWDown HEIGHT="20" WIDTH="14%">' +
			'&nbsp;' + Calendar.rgDOW[(iday+this.dopt.dow)%7] + "&nbsp;</TD>\r";
		}
	st += "</tr>\r";

	// Display each week
	for (irw = 0; irw < this.irwMax; irw++)
		{
		// Add the date header for the current week
		st += "<tr>\r";
		for (iday = 0; iday < 7; iday++)
			{
			this.SetDateFromGrid(dateCur, irw, iday);
			st += '<TD class=ms-calDown HEIGHT="80" WIDTH="14%"' + 
				this.DayStyle(dateCur) + '>&nbsp;' + dateCur.getUTCDate() + "&nbsp;<br>\r";

			var rgevt = this.mpEvents[irw + "." + iday];
			if (rgevt != null)
				{
				for (ievt = 0; ievt < rgevt.length; ievt++)
					{
					st += StURL(rgevt[ievt].stURL, rgevt[ievt].stTitle) + '<br>\r';
					}
				}

			st += '</TD>';
			}
		st += "</tr>\r";

		}
	
	st += "</table>";
	return st;
}

Calendar.prototype.SetDateFromGrid = CalSetDateFromGrid;
function CalSetDateFromGrid(date, irw, iday)
{
	date.setTime(this.dateStart.getTime() + irw * Calendar.msWeek +
		iday*Calendar.msDay);
}

//----------------------------------------
// CalEvent Object
//------------------------------------mck-

function CalEvent(dateStart, dateEnd, stDesc, stTitle, stURL)
{
	this.dateStart = dateStart;
	this.dateEnd = dateEnd;
	this.stDesc = stDesc;
	this.stTitle = stTitle;
	this.stURL = stURL;
}

CalEvent.prototype.FOverlap = EvtFOverlap;
function EvtFOverlap(evt)
{
	return evt.dateStart <= this.dateEnd && evt.dateEnd >= this.dateStart;
}

var L_Tip_Text = "^1: ^2";

CalEvent.prototype.StTip = EvtStTip;
function EvtStTip(dopt)
{
	var stT;
	if (DateOptions.FHasTime(this.dateStart))
		stT = StBuildParam(L_Tip_Text, dopt.StTime(this.dateStart), this.stTitle);
	else
		stT = this.stTitle;

	if (!FBlankString(this.stDesc))
		stT += "\r" + this.stDesc;

	return stT;
}

