<%
' Performance and debugging globals
Dim cdepthTrace		' Current call trace depth
Dim cdepthHide		' Hide all trace and timing below this stack depth (one-shot)
Dim cdepthTime		' Stack counter used for timing
Dim ccallTrace		' Consecutive count of traced function calls
Dim timer			' Com interface for QueryPerformanceCounter
Dim fTrace			' Trace immediate (not defered to end)
Dim fTiming			' Time function calls
Dim rgFunctionName(30) ' Function names of each function in backtrace
Dim rgStart(30)		' Start time for each function entry
Dim rgInnerTime(30)	' Total time inside inner functions
Dim dictCalls		' Count of function calls
Dim dictTotalTime	' Total time in functions
Dim dictAttribTime	' Attributed time in individual functions
Dim dictCallsInFunc	' Use to keep from double counting total recursive function time
Dim cTicksOverhead	

sub TraceIn(stFunction, stExtra)
	Dim st

	if fTiming then
		timer.Stop
	end if

	cdepthTrace = cdepthTrace + 1
	ccallTrace = ccallTrace + 1
	
	if fTiming AND cdepthHide = 0 then
		cdepthTime = cdepthTime + 1
		rgFunctionName(cdepthTime) = stFunction
		dictCallsInFunc.Item(stFunction) = dictCallsInFunc.Item(stFunction) + 1
		dictCalls.Item(stFunction) = dictCalls.Item(stFunction) + 1
		rgStart(cdepthTime) = timer.Ticks
		rgInnerTime(cdepthTime) = 0
	end if

	if cdepthHide = 0 AND fTrace then
		st = "<br>"
		if ccallTrace < 1000 then st = st & "0"
		if ccallTrace < 100 then st = st & "0"
		if ccallTrace < 10 then st = st & "0"
		st = st & ccallTrace & "." & cdepthTrace & Space(2*cdepthTrace) & _
			Server.HTMLEncode(stFunction & stExtra)
		response.write st
	end if
	
	if fTiming then
		timer.Start
	end if
end sub

sub TraceOut()
	Dim stFunction
	Dim cTicks			' Raw ticks for this function
	Dim cTicksNoOver	' Raw ticks minus measurement overhead
	Dim cTicksAttrib	' ...minus time spent inside subroutines and subroutine overhead

	if fTiming then
		timer.Stop
	end if

	cdepthTrace = cdepthTrace - 1
	if cdepthTrace < cdepthHide then
		cdepthHide = 0
	end if

	if fTiming AND cdepthHide = 0 then
		stFunction = rgFunctionName(cdepthTime)
		dictCallsInFunc.Item(stFunction) = dictCallsInFunc.Item(stFunction) - 1
		cTicks = timer.Ticks - rgStart(cdepthTime)
		cTicksNoOver = cTicks - cTicksOverhead
		if cTicksNoOver < 0 then
			cTicksNoOver = 0
		end if
		' Only count the outer-most total time when calling functions recursively.
		if dictCallsInFunc.Item(stFunction) = 0 then
			dictTotalTime.Item(stFunction) = dictTotalTime.Item(stFunction) + cTicksNoOver
		end if
		cTicksAttrib = cTicksNoOver - rgInnerTime(cdepthTime)
		if cTicksAttrib < 0 then
			cTicksAttrib = 0
		end if
		dictAttribTime.Item(stFunction) = dictAttribTime.Item(stFunction) + cticksAttrib
		' bug: should be doing inner time adjustment even if we're not tracing in here???
		if cdepthTime >= 1 then
			rgInnerTime(cdepthTime - 1) = rgInnerTime(cdepthTime - 1) + cTicks
		end if
		cdepthTime = cdepthTime - 1
	end if

	if fTiming then
		timer.Start
	end if
end sub

sub HideTrace
	if cdepthHide = 0 OR cdepthTrace < cdepthHide then
		cdepthHide = cdepthTrace
	end if
end sub

sub DumpTiming()
	Dim rgKeys
	Dim iKey
	Dim stFunc

	response.write "<pre>"
	response.write "<br>Timing:  <i>Call overhead subtracted: " & cTicksOverhead & "</i>"

	response.write "<br><TABLE><TR><TH>Function<TH>Calls<TH>Attrib<TH>Total"
	rgKeys = dictCalls.Keys
	for iKey = 0 to dictCalls.Count - 1
		stFunc = rgKeys(iKey)
		if stFunc <> "EmptyFunction" then
			Response.Write "<TR><TD>" & stFunc & "<TD>" & dictCalls.Item(stFunc) & _
				"<TD>" & dictAttribTime.Item(stFunc) & _
				"<TD>" & dictTotalTime.Item(stFunc)
		end if
	next
	response.write "</TABLE>"
	response.write "</pre>" & stNewline
end sub

sub InitializeTimer()
	dim i
	
	fTiming = True
	set dictTotalTime = CreateObject("Scripting.Dictionary")
	set dictAttribTime = CreateObject("Scripting.Dictionary")
	set dictCalls = CreateObject("Scripting.Dictionary")
	set dictCallsInFunc = CreateObject("Scripting.Dictionary")
	set timer = CreateObject("TimerCtl.TimerCtl.1")

	for i = 1 to 10
		TraceIn "EmptyFunction", ""
		TraceOut
	next

	cTicksOverhead = CInt(dictAttribTime.Item("EmptyFunction")/10)
end sub
%>

