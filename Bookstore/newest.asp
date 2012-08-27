<%@ LANGUAGE="VBSCRIPT" %>
<%Option Explicit%>
<!--#INCLUDE FILE=xml.inc-->
<!--#INCLUDE FILE=trace.inc-->
<!--#INCLUDE FILE=../scripts/util.inc-->
<!--#INCLUDE FILE=bookstore.inc-->
<html>

<head>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1252">

<title>Newest book - test page</title>
</head>

<body>

<%=StLinkExch(3)%>
<% DisplayNewest() %>


</body>

</html>
