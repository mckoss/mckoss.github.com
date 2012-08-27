<!-- Standard Debugging Information Below -->

<HR>
<P>For debugging this page also displays all the information in the
Request Object.

<h2>Cookies:</h2>
<I>Raw Cookies: <%= Request.Cookies %></I><p>
<%
Dim cookie
Dim key
Dim var
Dim field
Dim name

' How do I get an apriori count of the number of cookies in the collection?
For Each cookie in Request.Cookies
	If Not Request.Cookies(cookie).HasKeys Then
		Response.Write cookie & ": " & Request.Cookies(cookie) & "<br>"
	Else
		For Each key in Request.Cookies(cookie)
			Response.Write cookie & "[" & key & "]: " & Request.Cookies(cookie)(key) & "<br>"
		Next
	End If
Next
%>  

<h2>Client Certificates:</h2>
<%
For Each key in Request.ClientCertificate
   Response.Write key & ": " & Request.ClientCertificate(key) & "<br>"
Next
%>


<h2>Query string fields:</h2>
<I>Unparsed query string: <%= Request.QueryString %></I><p>
<%
For Each var In Request.QueryString
	Response.Write var & ": " & Request.QueryString(var) & "<br>"
Next
%>

<h2>Form (POST) fields:</h2>
<I>Unparsed form data: <%= Request.Form %></I><p>
<%
For Each field In Request.Form
	Response.Write field & ": " & Request.Form(field) & "<br>"
Next
%>

<h2>Server Variables:</h2>
<TABLE BORDER>
<TR><TD><B>Variable</B><TD><B>Value</B>
<%
For Each name In Request.ServerVariables
	Response.Write "<TR><TD>" & name & "<TD><pre>" & Server.HTMLEncode(Request.ServerVariables(name)) & "</pre>"
Next
%>
</TABLE>

<h2>Application Globals:</h2>
<TABLE BORDER>
<TR><TD><B>Key</B><TD><B>Value</B>
<%
For Each name In Application.Contents
	Response.Write "<TR><TD>" & name & "<TD><pre>" & Left(Server.HTMLEncode(Application(name)), 255) & "...</pre>"
Next
%>
</TABLE>


