<%
' Global variables
dim fPost		' Request type
dim stDebug		' Misc debug string
dim stPass		' Pass phrase controls security
dim stCmd		' Command type
dim stURL

stURL = "/bookstore/default.asp"

dim istMax
istMax = 8
dim rgstFields(10)
rgstFields(0) = "Title"
rgstFields(1) = "Author"
rgstFields(2) = "Reviewer"
rgstFields(3) = "Date"
rgstFields(4) = "ISBN"
rgstFields(5) = "Categories"
rgstFields(6) = "Review.Rating"
rgstFields(7) = "*Review.Synopsis"

function StFromFile(stFileName)
	Dim fs
	Dim fileT
	Dim st
	Dim stPath

	TraceIn "StFromFile", "(" & stFileName & ")"
	
	stPath = Server.MapPath("/bookstore/" & stFileName)
		
	Set fs = CreateObject("Scripting.FileSystemObject")
	Set fileT = fs.OpenTextFile(stPath, 1, FALSE)
	st = fileT.ReadAll
	fileT.Close
	StFromFile = st
	TraceOut
end function

function SaveStFile(stFileName, stContent)
	Dim fs
	Dim fileT
	Dim st
	Dim stPath

	Set fs = CreateObject("Scripting.FileSystemObject")
	stPath = UCase(Request.ServerVariables("PATH_TRANSLATED"))
	stPath = Server.MapPath("/bookstore/" & stFileName)

	'Set fileT = fs.CreateTextFile(stPath, TRUE)
	set fileT = fs.OpenTextFile(stPath, 2, TRUE)
	fileT.Write stContent
	fileT.Close
end function

sub BookStore()
	dim dictStore
	dim dictBook
	dim ich
	dim stStore

	GatherGlobals

	stStore = StFromFile("books.xml")
	set dictStore = CreateObject("Scripting.Dictionary")
	ich = ParseXML(stStore, 1, dictStore)
	if ich < 0 then
		response.write "Parse error in line: " & LineNumber(stStore, 1, -ich)
		exit sub
	end if

	response.write "<html><head>"
	response.write "<meta HTTP-EQUIV=""Content-Type"" content=""text/html; charset=iso-8859-1"">"
	response.write "<link REL=stylesheet TYPE=""text/css"" HREF=books.css>"
	
	response.write "<title>" & dictStore.Item("X:Title").Item("B") & _
		"</title></head><body>"

	response.write "<script>var stStoreID;stStoreID = """ & _
		dictStore.Item("X:ID").Item("B") & """;</script>"

	response.write "<h1 align=center><A HREF=""" & _
		stURL & """>" & _
		dictStore.Item("X:Title").Item("B") & "</A></h1>"

	select case stCmd
	case "STORE"
		DisplayStore dictStore
	case "SAVE"
		SaveBook dictStore, FALSE
	case "DELETE"
		SaveBook dictStore, TRUE
	case "NEW"
		BookForm 0, dictStore
	case "EDIT"
		set dictBook = BookLookup(dictStore.Item("X:BOOKS"), GetVar("ISBN", FALSE, ""))
		BookForm dictBook, dictStore
	case "REMOVE"
		RemoveBook dictStore.Item("X:BOOKS"), GetVar("ISBN", FALSE, "")
	case "NEWEST"
		NewestBook dictStore.Item("X:BOOKS"), dictBook
		DisplayBook dictBook, dictStore, ""
	case else
		response.write "Unknown function: " & stCmd
	end select
	
	response.write "<br><img border=0 src=""http://fastcounter.bcentral.com/fastcounter?2421357+4842721""></body></html>"
end sub

sub DisplayNewest()
	dim stStore
	dim dictStore
	dim ich
	dim dictBook

	stStore = StFromFile("books.xml")
	set dictStore = CreateObject("Scripting.Dictionary")
	ich = ParseXML(stStore, 1, dictStore)
	if ich < 0 then
		response.write "Parse error in line: " & LineNumber(stStore, 1, -ich)
		exit sub
	end if
	NewestBook dictStore.Item("X:BOOKS"), dictBook
	DisplayBook dictBook, dictStore, ""
end sub

sub BookForm(dictBook, dictStore)
	dim ist
	dim stType
	dim stField
	dim stValue
	dim stPart
	dim ichFind
	dim stFile
	dim dictFieldHelp
	
	if IsObject(dictBook) then
		response.write "<p>" & dictStore.Item("X:SaveDescription").Item("B")
		response.write "<HR NOSHADE>This is how the book review looks currently:<br>"
		DisplayBook dictBook, dictStore, ""
	else
		response.write "<p>" & dictStore.Item("X:NewDescription").Item("B")
	end if

	stFile = StFromFile("FormHead.inc")
	response.write stFile

	set dictFieldHelp = dictStore.Item("X:FieldHelp")

	for ist = 0 to istMax-1
		stField = rgstFields(ist)
		if mid(stField, 1, 1) = "*" then
			stField = mid(stField, 2)
			stType = "TEXTAREA ROWS=15 COLS=80"
		else
			if stField = "ISBN" AND IsObject(dictBook) then
				stType = "INPUT type=HIDDEN class=long SIZE=80"
			else
				stType = "INPUT type=TEXT class=long SIZE=80"
			end if
		end if

		ichFind = InStr(1, stField, ".")
		if ichFind <> 0 then
			stPart = Mid(stField, 1, ichFind-1)
			stField = Mid(stField, ichFind+1)
		else
			stPart = ""
		end if

		stValue = ""
		if IsObject(dictBook) then
			if stPart <> "" then
				if dictBook.Item("X:" & stPart).Exists("X:" & stField) then
					stValue = dictBook.Item("X:" & stPart).Item("X:" & stField).Item("B")
				end if
			else
				if dictBook.Exists("X:" & stField) then
					stValue = dictBook.Item("X:" & stField).Item("B")
				end if
			end if
			stValue = StReplace(stValue, CHR(9), "")
		else
			' Hack - should be in data
			if stField = "Date" then
				' For Y2K - be sure that whole year is in date string.
				stValue = Month(Date) & "/" & Day(Date) & "/" & Year(Date)
			end if
		end if


		response.write "<tr><th>" & stField & ":<td><" & stType
		response.write " name=" & stField
		if Left(stType,8) = "TEXTAREA" then
			response.write ">" & stValue & "</TEXTAREA>"
		else
			response.write " value=""" & stValue & """>"
		end if

		' Hack - should be in data
		if stField = "ISBN" then
			if IsObject(dictBook) then
				response.write stValue & vbNewLine & _
					"<br><input type=button onclick=""NavigateISBN('" & _
					stValue & "');"" value=Lookup>"
			else
				response.write vbNewLine & "<br><input type=button onclick=""NavigateISBN(bookform.ISBN.value);"" value=Lookup>"
			end if
		end if

		if dictFieldHelp.Exists("X:" & stField) then
			response.write "<br>" & dictFieldHelp.Item("X:" & stField).Item("B") & "<p>"
		end if
		
		response.write vbNewLine
	next

	stFile = StFromFile("FormTail.inc")
	response.write stFile

	if NOT IsObject(dictBook) then
		response.write "<HR noshade>To edit an existing review, click on a book title below:<p>"
		DisplayBooklist dictStore.Item("X:BOOKS"), dictStore, TRUE
	end if

end sub

sub SaveBook(dictStore, fDelete)
	dim dictBook
	dim dictBookOld
	dim stBook
	dim ich
	dim stStore
	dim stISBN

	set dictBook = CreateObject("Scripting.Dictionary")
	DictBookFromForm(dictBook)

	if Not dictBook.Exists("X:Title") then
		response.write "You must have a valid Title to submit this review.  Press " & _
			"the back button to re-enter your submission."
		exit sub
	end if

	if dictBook.Exists("X:ISBN") then
		stISBN = dictBook.Item("X:ISBN").Item("B")
	else
		stISBN = ""
	end if
	
	if stISBN = "" then
		response.write "You must have a valid ISBN number to submit this review.  Press " & _
			"the back button to re-enter your submission."
		exit sub
	end if

	RemoveBook dictStore.Item("X:BOOKS"), stISBN

	if NOT fDelete then
		AddChildTag dictStore.Item("X:BOOKS"), dictBook
	end if

	stStore = StXML(dictStore, 0)

	SaveStFile "books.xml", stStore

	' Need to reparse - why?  I think the AddChildTag does not set up a valid
	' dictionary?
	dictStore.RemoveAll
	ParseXML stStore, 1, dictStore

	if fDelete then
		BookForm 0, dictStore
	else
		BookForm dictBook, dictStore
	end if
end sub

sub DictBookFromForm(dictBook)
	dim stBook
	dim ist
	dim stField
	dim stType
	dim stPart
	dim ichFind
	dim dictField
	dim dictPart
	dim stXML

	ParseXML "<BOOK></BOOK>", 1, dictBook
	
	for ist = 0 to istMax-1
		stField = rgstFields(ist)
		if mid(stField, 1, 1) = "*" then
			stField = mid(stField, 2)
			stType = "TEXTAREA"
		else
			stType = "INPUT class=long"
		end if

		ichFind = InStr(1, stField, ".")
		if ichFind <> 0 then
			stPart = Mid(stField, 1, ichFind-1)
			stField = Mid(stField, ichFind+1)
		else
			stPart = ""
		end if

		stXML = StXMLFromField(stField)
		if stXML <> "" then
			set dictField = CreateObject("Scripting.Dictionary")
			ParseXML stXML, 1, dictField

			if stPart = "" then
				AddChildTag dictBook, dictField
			else
				if NOT dictBook.Exists("X:" & stPart) then
				set dictPart = CreateObject("Scripting.Dictionary")
				ParseXML "<" & stPart & "></" & stPart & ">", 1, dictPart
				AddChildTag dictBook, dictPart
				end if
				AddChildTag dictBook.Item("X:" & stPart), dictField
			end if
		end if
	next
end sub

function StXMLFromField(stField)
	dim stValue
	
	stField = UCASE(stFIELD)
	stValue = GetVar(stField, FALSE, "")
	if stValue <> "" then
		stValue = "<" & stField & ">" & QuoteString(stValue, FALSE) & "</" & stField & ">"
	end if
	
	StXMLFromField = stValue
end function

sub GatherGlobals()
	fPost = Request.ServerVariables("REQUEST_METHOD") = "POST"
	stDebug = GetVar("Debug", TRUE, "")

	fTrace = InStr(1, stDebug, "TRACE")
	if fTrace then
		response.write "<pre>"
	end if

	stPass = GetVar("Pass", TRUE, "")

	stCmd = UCase(GetVar("Cmd", FALSE, "Store"))
end sub

function GetVar(stName, fAllowCookie, stDefault)
	Dim stResult

	TraceIn "GetVar", "(" & stName & ")"

	if fAllowCookie then
		stResult = Request.Cookies(stName)
	end if

	if fPost then
		if Request.Form(stName) <> "" then
			stResult = Request.Form(stName)
		end if
		if stResult="" then
			stResult = Request.QueryString(stName)
		end if
	else
		if Request.QueryString(stName) <> "" then
			stResult = Request.QueryString(stName)
		end if
	end if

	stResult = Trim(stResult)

	if stResult = "" then
		stResult = stDefault
	end if

	' Update user cookie whenever there is a change
	if fAllowCookie AND Request.Cookies(stName) <> stResult then
		Response.Cookies(stName) = stResult
		Response.Cookies(stName).Expires = Date + 30
	end if

	GetVar = stResult
	TraceOut
end function

sub DisplayStore(dictStore)
	dim stSection

	stSection = GetVar("Section", FALSE, "")

	if stSection = "" then
		response.write "<p>" & dictStore.Item("X:Description").Item("B")
		DisplayBooklist dictStore.Item("X:BOOKS"), dictStore, FALSE
	else
		DisplayBooks dictStore.Item("X:BOOKS"), dictStore, stSection
	end if
end sub

sub HowToBuy()
end sub

sub DisplayBooklist(dictBooks, dictStore, fEdit)
	dim iBook
	dim iBooks
	dim stTag
	dim dictBook
	dim dictCats
	dim rgstKeys
	dim ist
	dim stCat
	dim stBookCat
	dim fFirstInCat
	
	response.write "<TABLE class=list>"
	response.write "<TR><TD class=top>Topic</TD>" &_
		"<TD class=top>Book</TD>" & _
		"</TR>"

	set dictCats = CreateObject("Scripting.Dictionary")
	CountBooks dictBooks, dictCats

	iBooks = CountTags("BOOK", dictBooks)
	rgstKeys = dictCats.Keys
	for ist = 0 to dictCats.Count - 1
		stCat = rgstKeys(ist)
		fFirstInCat = TRUE

		for iBook = 0 to iBooks-1
			if iBook = 0 then
				stTag = "X:BOOK"
			else
				stTag = "X:BOOK[" & iBook & "]"
			end if
			
			set dictBook = dictBooks.Item(stTag)

			stBookCat = "None"
			if dictBook.Exists("X:Categories") then
				stBookCat = dictBook.Item("X:Categories").Item("B")
			end if

			if InStr(1, stBookCat, stCat) <> 0 then
				response.write vbNewLine & "<tr valign=top>"
				if fFirstInCat then
					response.write "<TD ROWSPAN=" & dictCats.Item(stCat) & ">"
					if NOT fEdit then
						response.write "<A HREF=""" & _
						stURL & "?Section=" & stCat & """>"
					end if
					response.write "<B>" & stCat & "</B>"
					if NOT fEdit then
						response.write "</A>"
					end if
					response.write "</TD>"
					fFirstInCat = FALSE
				end if

				response.write "<TD>"
				if fEdit then
					response.write "<A HREF=""" & _
					    stURL & "?Cmd=Edit&ISBN=" & _
						dictBook.Item("X:ISBN").Item("B") & """>"
				else
					response.write "<A HREF=""" & _
					    stURL & "?Section=" & stCat &_
						"#" & dictBook.Item("X:ISBN").Item("B") & """>"
				end if
				response.write dictBook.Item("X:Title").Item("B") & "</A>"
				if dictBook.Exists("X:Date") then
					if CDate(dictBook.Item("X:Date").Item("B")) > Date-5 then
						response.write "<IMG align=top SRC=images/new.gif>"
					end if
				end if

				if dictBook.Exists("X:Reviewer") then
					response.write "<br><i>reviewed by " & _
						dictBook.Item("X:Reviewer").Item("B") & "</i>"
				end if
				response.write "</TD>"

				response.write "</TR>"
			end if
		next
	next
	
	response.write "</TABLE>"
end sub

sub CountBooks(dictBooks, dictCats)
	dim iBooks
	dim iBook
	dim stTag
	dim dictBook
	dim stCats
	dim stCat
	dim ich
	dim ichFind
	
	iBooks = CountTags("BOOK", dictBooks)
	for iBook = 0 to iBooks-1
		if iBook = 0 then
			stTag = "X:BOOK"
		else
			stTag = "X:BOOK[" & iBook & "]"
		end if
		set dictBook = dictBooks.Item(stTag)

		if dictBook.Exists("X:Categories") then
			stCats = dictBook.Item("X:Categories").Item("B")
			if stCats <> "" then
				ich = 1
			    ichFind = InStr(ich, stCats, ",")
			    Do While ichFind <> 0
			    	stCat = Trim(Mid(stCats, ich, ichFind-ich))
			    	dictCats.Item(stCat) = dictCats.Item(stCat) + 1
			        ich = ichFind + 1
			        ichFind = InStr(ich, stCats, ",")
			    Loop
				stCat = Trim(Mid(stCats, ich))
		    	dictCats.Item(stCat) = dictCats.Item(stCat) + 1
			end if
		else
			dictCats.Item("None") = dictCats.Item("None") + 1
		end if
	next
end sub

sub NewestBook(dictBooks, ByRef dictBookRet)
	dim iBooks
	dim iBook
	dim dateBook
	dim dateMax
	dim stTag
	dim dictBook

	iBooks = CountTags("BOOK", dictBooks)
	for iBook = 0 to iBooks-1
		if iBook = 0 then
			stTag = "X:BOOK"
		else
			stTag = "X:BOOK[" & iBook & "]"
		end if
		set dictBook = dictBooks.Item(stTag)

		if dictBook.Exists("X:Date") then
			dateBook = CDate(dictBook.Item("X:Date").Item("B"))
			if dateBook > dateMax then
				dateMax = dateBook
				set dictBookRet = dictBook
			end if
		end if
	next
end sub

sub DisplayBooks(dictBooks, dictStore, stSection)
	dim iBooks
	dim iBook
	dim stTag
	dim dictBook
	dim dictCats
	dim ist
	dim stCat
	dim stBookCat
	dim rgstKeys
	
	iBooks = CountTags("BOOK", dictBooks)

	set dictCats = CreateObject("Scripting.Dictionary")
	CountBooks dictBooks, dictCats

	rgstKeys = dictCats.Keys
	for ist = 0 to dictCats.Count - 1
		stCat = rgstKeys(ist)

		if stSection = "*" OR stSection = stCat then
			response.write "<A NAME=""#Section" & stCat & """></A>"
			response.write vbNewLine & vbNewLine & "<DIV class=section>" & stCat & "</DIV>"

			for iBook = 0 to iBooks-1
				if iBook = 0 then
					stTag = "X:BOOK"
				else
					stTag = "X:BOOK[" & iBook & "]"
				end if
				
				set dictBook = dictBooks.Item(stTag)

				stBookCat = "None"
				if dictBook.Exists("X:Categories") then
					stBookCat = dictBook.Item("X:Categories").Item("B")
				end if

				if InStr(1, stBookCat, stCat) <> 0 then
					DisplayBook dictBook, dictStore, stCat
				end if
			next
		end if
	next

	if stSection <> "" then
		response.write "<p><HR noshade><A HREF=""" & _
		stURL & """>Back to store front</A>"
	end if
end sub

function BookLookup(dictBooks, stISBN)
	dim iBooks
	dim iBook
	dim stTag
	dim dictBook

	iBooks = CountTags("BOOK", dictBooks)

	for iBook = 0 to iBooks-1
		if iBook = 0 then
			stTag = "X:BOOK"
		else
			stTag = "X:BOOK[" & iBook & "]"
		end if
		set dictBook = dictBooks.Item(stTag)
		if stISBN = "" OR dictBook.Item("X:ISBN").Item("B") = stISBN then
			set BookLookup = dictBook
			exit function
		end if
	next
end function

sub RemoveBook(dictBooks, stISBN)
	dim iBooks
	dim iBook
	dim stTag
	dim dictBook

	iBooks = CountTags("BOOK", dictBooks)

	for iBook = 0 to iBooks-1
		if iBook = 0 then
			stTag = "X:BOOK"
		else
			stTag = "X:BOOK[" & iBook & "]"
		end if
		set dictBook = dictBooks.Item(stTag)
		if dictBook.Item("X:ISBN").Item("B") = stISBN then
			dictBooks.Remove(stTag)
			exit sub
		end if
	next
end sub

sub DisplayBook(dictBook, dictStore, stCat)
	dim dictReview
	dim stBookURL
	dim stISBN
	dim stReview
	dim stCats
	dim stOtherCat
	dim ich
	dim ichFind

	stISBN = dictBook.Item("X:ISBN").Item("B")
	stBookURL = "http://www.amazon.com/exec/obidos/ASIN/" & stISBN & "/" & _
		dictStore.Item("X:ID").Item("B")

	response.write "<BR>"
	response.write "<A NAME=#" & stISBN & "></A>"

	response.write "<TABLE><TR valign=top><TD width=120>"
	response.write "<A HREF=""" & stBookURL & """>"
	response.write CoverImage(stISBN)
	response.write "</A>"
	response.write "</TD><TD>"

	response.write "<SPAN class=BookTitle>"
	response.write "<A HREF=""" & stBookURL & """>"
	if dictBook.Exists("X:Title") then
		response.write dictBook.Item("X:Title").Item("B")
	else
		response.write "???No Title???"
	end if
	response.write "</A>"
	response.write "</SPAN>"
	DisplayRating dictBook
	response.write "<p><SPAN class=BookAuthor> by " & _
		dictBook.Item("X:Author").Item("B") & _
		"</SPAN>"
	if dictBook.Exists("X:Reviewer") then
		response.write "<p><SPAN class=BookAuthor>reviewed by " & _
			dictBook.Item("X:Reviewer").Item("B") & _
			"</SPAN>"
	end if
	
	stReview = dictBook.Item("X:REVIEW").Item("X:SYNOPSIS").Item("B")
	response.write StFormatText(stReview)

	' Cross-link to other book categories
	stCats = dictBook.Item("X:Categories").Item("B")
	if stCats <> "" then
		dim fFirst
		fFirst = TRUE
	
		ich = 1
	    ichFind = InStr(ich, stCats, ",")
	    Do While ichFind <> 0
	    	stOtherCat = Trim(Mid(stCats, ich, ichFind-ich))
			CrossRef stCat, stOtherCat, stISBN, fFirst
	        ich = ichFind + 1
	        ichFind = InStr(ich, stCats, ",")
	    Loop
		stOtherCat = Trim(Mid(stCats, ich))
		CrossRef stCat, stOtherCat, stISBN, fFirst
    end if

	response.write "</TD></TR></TABLE><br>"
end sub

sub CrossRef(stCat, stOtherCat, stISBN, ByRef fFirst)
	if stCat <> stOtherCat then
		if fFirst then
			response.write "<p>See also: "
			fFirst = FALSE
		else
			response.write ", "
		end if
		response.write "<A HREF=""" & _
			stURL & "?Section=" & stOtherCat & _
			"#" & stISBN & """>" & stOtherCat & "</A>"
	end if
end sub

sub DisplayRating(dictBook)
	dim i

	if dictBook.Item("X:REVIEW").Exists("X:Rating") then
		response.write " "
		for i = 1 to dictBook.Item("X:REVIEW").Item("X:Rating").Item("B")
			response.write "<IMG SRC=images/star.gif>"
		next
	end if
end sub

' TODO: Why not juse call StReplace here??
' Insert HTML formatting characters so that text formatted with CRLF's and
' leading spaces looks correct in HTML.
Function StFormatText(stString)
    Dim st
    Dim ich
    Dim ichFind
    Dim ichLast
    Dim stPattern

    TraceIn "StFormatText", ""

	stPattern = vbNewLine & vbNewLine
    st = "<p>"

    ich = 1
    ichLast = Len(stString)
    ichFind = InStr(ich, stString, stPattern)
    Do While ichFind <> 0
        st = st & Mid(stString, ich, ichFind - ich) & vbNewLine & "<p>"
        ich = ichFind + Len(stPattern)
        Do While (ich <= ichLast AND Mid(stString, ich, 1) = " ")
	        ich = ich + 1
	        st = st & "&nbsp;"
        Loop
        ichFind = InStr(ich, stString, stPattern)
    Loop
    st = st & Mid(stString, ich)
    StFormatText = st
    TraceOut
End Function

dim fHasImageError

function CoverImage(stISBN)
	if NOT fHasImageError then
		response.write _
			vbNewLine & "<SCRIPT>" & _
			"function ImageError()" & _
			"{" & _
			"    event.srcElement.src = 'images/book.gif';" &_
			"}" &_
			"</SCRIPT>"
		fHasImageError = TRUE
	end if

	CoverImage = "<img  width=90 height=140 border=0 " & _
		"onerror=""ImageError();"" " & _
		"src=""http://images.amazon.com/images/P/" & stISBN & _
		".01.MZZZZZZZ.jpg"" border=1 alt=Cover>"
end function

%>

