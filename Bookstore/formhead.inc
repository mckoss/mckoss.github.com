<script>
function NavigateISBN(stISBN)
{
	var stURL;

	if (stISBN == "")
		{
		stURL = "http://www.amazon.com/exec/obidos/redirect-home/" +
			stStoreID;
		}
	else
		{
		stURL = "http://www.amazon.com/exec/obidos/ASIN/" + stISBN + "/" +
			stStoreID;
		}
	window.open(stURL, "", "width=640,height=480,scrollbars=yes,resizable=yes");
}

function ValidateForm()
{
	if (bookform.ISBN.value == "")
		{
		alert("You must enter an ISBN number to submit a book review.  Note that " +
			"you should hit TAB and not RETURN to move between fields of the form (hitting RETURN " +
			"completes the form and sends it to the bookstore).");
		return(false);
		}
	return(true);
}
</script>

<HR NOSHADE>
Enter book information here:
<p>

<form ID=bookform action="default.asp" method=post onsubmit="return ValidateForm();">
<table class=form>

