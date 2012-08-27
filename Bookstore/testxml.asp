<%@ LANGUAGE="VBSCRIPT" %>
<%Option Explicit%>
<!--#INCLUDE FILE=xml.inc-->
<HTML>
<HEAD>
<META NAME="GENERATOR" Content="Microsoft Visual InterDev 1.0">
<META HTTP-EQUIV="Content-Type" content="text/html; charset=iso-8859-1">
<TITLE>Document Title</TITLE>
</HEAD>
<BODY>

<%

Dim stDebug

Sub TraceIn(stDummy1, stDummy2)
end Sub

Sub TraceOut
end Sub

Sub HideTrace
end Sub

sub DisplayXML(ByRef dict)
	Dim rgKeys
	Dim iKey

	Response.Write "<I>" & dict.Item("T") & " has " & dict.Count & " keys defined.</I><br>"

	rgKeys = dict.Keys
	for iKey = 0 to dict.Count - 1
		if Mid(rgKeys(iKey), 1, 1) = "X" then
			Response.Write rgKeys(iKey) & "<br>"
			Response.Write "<BLOCKQUOTE>"
			DisplayXML(dict.Item(rgKeys(iKey)))
			Response.Write "</BLOCKQUOTE>"
		else
			Response.Write "<pre>" & rgKeys(iKey) & ": '" & _
				Server.HTMLEncode(dict.Item(rgKeys(iKey))) & "'</pre><br>"
		end if
	next
end sub

sub TestParse(st)
	Dim dictXML
	Dim ich

	' Test the C++ parser
	stDebug = ""
	set dictXML = CreateObject("Scripting.Dictionary")
	Response.Write "<TR VALIGN=top><TD WIDTH=200>" & Server.HTMLEncode(st)
	ich = ParseXML(st, 1, dictXML)
	Response.Write "<TD WIDTH=20>" & ich
	Response.Write "<TD WIDTH=200><pre>" & Server.HTMLEncode(StXML(dictXML, 0)) & "</pre>"
	DisplayXML(dictXML)

	' ... and compare to the ASP Parser
	stDebug = "ASPPARSE"
	set dictXML = CreateObject("Scripting.Dictionary")
	ich = ParseXML(st, 1, dictXML)
	Response.Write "<TD WIDTH=20>" & ich
	Response.Write "<TD WIDTH=200><pre>" & Server.HTMLEncode(StXML(dictXML, 0)) & "</pre>"
	DisplayXML(dictXML)

end sub

sub WriteFile(stFile)
	Dim fs
	Dim ts

	Set fs = CreateObject("Scripting.FileSystemObject")
	Set ts = fs.OpenTextFile(Server.MapPath(stFile), 1, FALSE)

	Response.Write Server.HTMLEncode(ts.ReadAll)

	ts.Close
end Sub
%>

<H2>XML Parser Test</H2>
I've written and XML parser in VBScript for use in my ASP files and JohnAz has created a
compatiable replacement written in C++.  This ASP script
tests out the parser in both forms and compares the results.  The source code is also dumped out below - feel free to
steal this code for your own purposes.<A HREF="mailto:mikeko@microsoft.com">- Mike Koss</A>
<p>
In order to make this a pure ASP solution, I use the Scripting.Dictionary object provided
by IIS.  Like perl, this associative array lets me store the results of each section
of the parsed XML.  In order to represent the structure and attributes of XML I store
parts in specially keyed entries in the dictionary:
<TABLE BORDER=1>
<TR><TD>Key<TD>Description
<TR><TD>T<TD>The Name of the tag at the top level of the XML.
<TR><TD>B<TD>All the body text that is at the top level of the XML is appended here.
<TR><TD>U<TD>Tags that are <I>empty</I>, e.g., &lt;FOO/&gt; are marked with a "U" entry in
    the dictionary.
<TR><TD>A:NAME<TD>Any attributes of the current (top level) tag are stored in a dictionary entry
    preceeded by "A:" and whose value is the given value of attribute.  I support
	attributes that have no explicit value by setting their value to TRUE <I>(from my
	reading of the XML spec, this form of attribute is not allowed???)</I>
<TR><TD>X:TAGNAME<TD>All sub tags are stored as sub-dcitionaries.  The entry name is the
    name of the tag preceeded by an "X:".  For tags that appear more than once, the ones beyond
    the first have appended sequence number; eg. X:TAGNAME[1].
<TR><TD>M:TAGNAME<TD>For tags that appear multiple times - this field gives the count.
Those beyond the first are named X:TAGNAME[N] for N = 1 to count-1.
</TABLE>
<p>
<TABLE COLS=3 BORDER=1>
<TR><TD><B>XML to Parse</B><TD><B>Result</B><TD><B>Regenerated</B>
<TD><B>ASP Result</B><TD><B>ASP Regenerated</B>
<%
'                   1         2         3         4         5         6         7
'          123456789012345678901234567890123456789012345678901234567890123456789012
TestParse "<XML BODY=HTML><![CDATA[<HTML><BODY>This is HTML</BODY></HTML>]]></XML>"
TestParse "<A>AAA</A>"
TestParse "<UNIT/>"
TestParse "<XML></XML>"
TestParse "<XML>Top<A>AAA</A><B>BBB</B>MoreTop<C>CCC</C></XML>Junk"
TestParse "<XML Foo Bar=Baz Boff></XML>"
TestParse "<XML><A Test=""my string""/></XML>"
TestParse "<XML><A Foo=Bar>Some text<!-- And a comment --> and more</A></XML>"
TestParse "<XML ATTR=""My """"quoted"""" string""></XML>"
TestParse "<XML>""Quoted BODY <XML> is cool""</XML>"
TestParse "<XML><PART>Part 1</PART><PART>Part 2</PART><PART>Part 3</PART></XML>"
TestParse "<XML><!-- A comment for the <XML> -->Body<Sub/></XML>"
TestParse "<XML><FOO>   Space but not quoted   </FOO><BAR>""  Space and Quoted    ""</BAR></XML>"
TestParse "<XML></BAT></XML>"
TestParse "<XML><FIELD DEFAULT=(None) Name=Title></FIELD></XML>"
TestParse "<VAR Name=ProjectName>Teampages - MikeKo's private test site</VAR>"
TestParse "<EMBED EXPANDXML Name=FooterCommon/>"


%>
</TABLE>

<HR NOSHADE>
<H2>Source Code:<br>xml.inc</H2>
<pre>
<%WriteFile("xml.inc")%>
<HR NOSHADE><H2>testxml.asp</H2>
<%WriteFile("testxml.asp")%>
</pre>

%>

</BODY>
</HTML>
