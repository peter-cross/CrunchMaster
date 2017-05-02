window.onload = init;

function init()
{
	var canvas = document.getElementById("cvs");
	canvas.width = window.innerWidth;
	//canvas.width = document.body.clientWidth;
	
	canvas.height = window.innerHeight - 5
	//canvas.height = document.body.clientHeight
					-document.getElementById("title").offsetHeight
					-document.getElementById("tips").offsetHeight;
	
	var context = canvas.getContext("2d");
	
	context.translate(0.5, 0.5);
	
	var grid = [];			// Grid
	var accounts = [];		// array of accounts
	var transactions = []; 	// array of transactions
	
	var cellWidth, cellHeight;
	
	var selectedCell = undefined;
	var selectedCells = [];
	
	var links = [];
	var hoverLink = "";
	
	//canvas.removeEventListener();	
	canvas.addEventListener("click", addSomething); 
	canvas.addEventListener("dblclick", deleteSomething);
	document.getElementById("grid").addEventListener("click", createGrid);
	document.getElementById("clear").addEventListener("click", clearGrid);
	
	document.getElementById("chart").addEventListener("click", chartTAccounts);
	
	document.getElementById("save").addEventListener("click", saveGrid);
	document.getElementById("restore").addEventListener("click", restoreGrid);
	
	
	main();
	
	
	function main()
	{
		createGrid();
	}
	
	function createGrid()
	{
		var X = Number(document.getElementById("X").value);
		var Y = Number(document.getElementById("Y").value);
		
		canvas.width = canvas.width;
		
		if (X<1 || Y<1)
			alert("Grid values are invalid \nX:"+X+" Y:"+Y);
		
		
		var width = (canvas.width-2)/X;
		var height = (canvas.height-2)/Y;
		
		context.beginPath();
		context.lineWidth = 0.5;
		context.strokeStyle="#DDD";
		
		var i=X;
		while (i--)
		{
			context.moveTo(i*width-2, 0);
			context.lineTo(i*width-2, canvas.height);
			grid[i] = [];
		}
		
		var j=Y;
		while (j--)
		{
			context.moveTo(0, j*height);
			context.lineTo(canvas.width, j*height);
			
			i=X;
			while (i--)
				grid[i][j]=
				{
					account: undefined, // T-Account
					X:i, 
					Y:j,
					debit: {}, 			// Cell transaction on debit side
					credit: {} 			// Cell transaction on credit side
				};
		}
		
		cellWidth = width;
		cellHeight = height;
		
		context.closePath();
		context.stroke();
	}
	
	function clearGrid()
	{
		grid = [];
		accounts = [];		// array of accounts
		transactions = []; 	// array of transactions
	
		createGrid();
	}
	
	function highlightCell(cell)
	{
		cell.img = context.getImageData((cell.X*cellWidth)-2, cell.Y*cellHeight, cellWidth, cellHeight);
		
		var img = context.getImageData((cell.X*cellWidth)-2, cell.Y*cellHeight, cellWidth, cellHeight);
		
		for (var i=0; i<img.data.length; i+=4)
		{
			var avg = (img.data[i] + img.data[i+1] + img.data[i+2])/3;
			
			img.data[i]   = img.data[i]   * (255- avg/255);
			img.data[i+1] = img.data[i+1] * (255- avg/255);
			img.data[i+2] = img.data[i+2] * (255- avg/255);
			img.data[i+3] = 255 * 0.6;
		}
		
		context.putImageData(img, (cell.X*cellWidth)-2, cell.Y*cellHeight);
	}
	
	function currentCell()
	{
		var x = event.clientX - event.target.offsetLeft;
		var y = event.clientY - event.target.offsetTop;
		
		var X = Math.floor(x/(cellWidth-1));
		var Y = Math.floor(y/(cellHeight-1));
		
		return grid[X][Y];
	}
	
	function drawAccount(cell)
	{
		context.beginPath();
		context.strokeStyle ="rgb(128, 128, 128)";
		context.lineWidth = 4;
		
		context.moveTo(cell.X*cellWidth + cellWidth/10, cell.Y*cellHeight + cellHeight/5 +2);
		context.lineTo(cell.X*cellWidth + cellWidth*9/10-1, cell.Y*cellHeight + cellHeight/5 +2);
		
		if (cell.account.length == 1)
		{
			context.moveTo(cell.X*cellWidth + cellWidth/2, cell.Y*cellHeight + cellHeight/5);
			context.lineTo(cell.X*cellWidth + cellWidth/2, cell.Y*cellHeight + cellHeight*4/5);
			context.clearRect(cell.X*cellWidth + cellWidth/2-3, cell.Y*cellHeight + cellHeight/5, 6, cellHeight*4/5-1);			
		}
		else if (cell.account.length > 1)
		{
			context.moveTo(cell.X*cellWidth + cellWidth/2, cell.Y*cellHeight + cellHeight/5);
			context.lineTo(cell.X*cellWidth + cellWidth/2, cell.Y*cellHeight + cellHeight-1);
			context.clearRect(cell.X*cellWidth + cellWidth/2-3, cell.Y*cellHeight + cellHeight/5, 6, cellHeight*4/5-1);			
			
			for (var i=1; i<cell.account.length-1; i++)
			{
				context.moveTo(cell.X*cellWidth + cellWidth/2, (cell.Y+i)*cellHeight);
				context.lineTo(cell.X*cellWidth + cellWidth/2, (cell.Y+i)*cellHeight + cellHeight-1);
				context.clearRect(cell.X*cellWidth + cellWidth/2-3, (cell.Y+i)*cellHeight, 6, cellHeight-1);			
			}
			
			context.moveTo(cell.X*cellWidth + cellWidth/2, (cell.Y+cell.account.length-1)*cellHeight);
			context.lineTo(cell.X*cellWidth + cellWidth/2, (cell.Y+cell.account.length-1)*cellHeight + cellHeight*4/5);
			context.clearRect(cell.X*cellWidth + cellWidth/2-3, (cell.Y+cell.account.length-1)*cellHeight, 6, cellHeight-1);			
		}
		
		var txtHeight = context.measureText('M').width;
				
		context.textAlign = "center";
		context.font = "1em Calibri";
		context.fillStyle = "rgb(10,10,10);";
		context.fillText(cell.account.name, cell.X*cellWidth + cellWidth/2, cell.Y*cellHeight + cellHeight/5 - context.measureText('M').width/5);
							
		context.closePath();
		context.stroke();
		
		// If there is a transaction on debit side
		if (Object.keys(cell.debit).length>0)
		{
			drawTransaction(cell.debit);
		}
			
		// If there is a transaction on credit side
		if (Object.keys(cell.credit).length>0)
		{
			drawTransaction(cell.credit);
		}
				
	}
		
	function drawTransaction(T)
	{
		if (Object.keys(T).length==0) return;
		
		
		var X1 = T.X1;
		var X2 = T.X2;
		var Y = T.Y;
		
		
		context.beginPath();
		context.strokeStyle ="rgb(128, 128, 128)";
		context.lineWidth = 4;
		
		context.moveTo(X1*cellWidth + cellWidth/2 + 5, Y*cellHeight + cellHeight*4/5 - 5);
		context.lineTo(X2*cellWidth + cellWidth/2 - 5, Y*cellHeight + cellHeight*4/5 - 5);
		
		context.textAlign = "center";
		context.font = "0.9em Tahoma";
		context.fillText(T.description, ((X1+X2)/2)*cellWidth + cellWidth/2, Y*cellHeight + cellHeight*4/5 - 10);
		//drawLink(((X1+X2)/2)*cellWidth + cellWidth/2, Y*cellHeight + cellHeight*4/5 - 10, "wwww.korrespondent.net", T.description);
		
		
		var X0 = undefined;
		var Y0 = undefined;
		
		if (T.credit.Y < Y)
		{
			X0 = T.credit.X;
			Y0 = T.credit.Y;
			
			context.moveTo(X0*cellWidth + cellWidth/2, Y0*cellHeight + cellHeight*4/5);
			context.lineTo(X0*cellWidth + cellWidth/2, Y*cellHeight + cellHeight*4/5);
			
		}
		
		if (T.debit.Y < Y)
		{
			X0 = T.debit.X;
			Y0 = T.debit.Y;
			
			context.moveTo(X0*cellWidth + cellWidth/2, Y0*cellHeight + cellHeight*4/5);
			context.lineTo(X0*cellWidth + cellWidth/2, Y*cellHeight + cellHeight*4/5);
		}
		
		context.closePath();
		context.stroke();
		
	}
	
	
	function addAccountInfo(text)
	{
		
		if (text == null) 
			return null;
	
		if (text.indexOf("/") !== -1)
			var txt = text.toUpperCase();	
		else
			var txt = text[0].toUpperCase()+text.slice(1);
							
		var ind = accounts.indexOf(txt);
	
		if (ind == -1)
		{
			accounts.push(txt);
		
		
			// Transactions matrix
			for (var i=1; i<=accounts.length; i++)
			{
				if (transactions.length < i)
					transactions.push([]);
			
				for (var j=1; j<=accounts.length; j++)
				{
					if (transactions[i-1].length < j)
						transactions[i-1].push([]);
			
				} // End of for (j)
		
			} // End of for (i)
		
			return accounts.length-1;
		
		}
		else
		{
			return ind;
		}	
	
	}
	
	function addSomething(event)
	{
		if (selectedCells.length>0) return;
		
		var cell = currentCell();
		
		if (cell.account === undefined && !event.shiftKey)
		{
			addAccount(cell);
			
		}
		else if (typeof cell.account === "object" && !event.shiftKey)
		{
			selectCell(cell);
			
		}
		else if (selectedCell !== undefined && event.shiftKey)
		{
			selectArea(selectedCell, cell);
		}
		
		
		
		
		function addAccount(cell)
		{
			cell.img = context.getImageData((cell.X*cellWidth)-2, cell.Y*cellHeight, cellWidth, cellHeight);
			highlightCell(cell);
			
			
			var ind = addAccountInfo(window.prompt("Enter account name: ", ""));
			
			if (ind == null) 
			{
				context.putImageData(cell.img, (cell.X*cellWidth)-2, cell.Y*cellHeight);

				return;
			}
						
			cell.account = {};
			cell.account.name = accounts[ind];
			cell.account.index = ind;
			cell.account.X = cell.X;
			cell.account.Y = cell.Y;
			cell.account.length = 1;
		
			context.putImageData(cell.img, (cell.X*cellWidth)-2, cell.Y*cellHeight);
					
			drawAccount(cell);
			
		}
		
		
		function selectCell(cell)
		{
			
			// If some cell is already selected
			if (selectedCell !== undefined)
			{
				// We select some another new cell
				if (selectedCell.X !== cell.X || selectedCell.Y !== cell.Y)
				{
					highlightCell(cell);
					
					addTransaction(selectedCell, cell);
					selectedCell = undefined;
					return;
				}
				// We select the same cell
				else
				{
					context.putImageData(selectedCell.img, (cell.X*cellWidth)-2, cell.Y*cellHeight);
					selectedCell = undefined;
					return;
				}
			}
			
			// If it's a new cell
			else
			{
				selectedCell = cell;
				highlightCell(cell);
			}
				
		}
		
		
		function selectArea(selectedCell, cell)
		{
			//alert("Select area!");
			var X1 = Math.min(selectedCell.X, cell.X);
			var X2 = Math.max(selectedCell.X, cell.X);
			var Y1 = Math.min(selectedCell.Y, cell.Y);
			var Y2 = Math.max(selectedCell.Y, cell.Y);
			
			selectedCells = [];
					
			for (var i=X1; i<=X2; i++)
			{
				for (var j=Y1; j<=Y2; j++)
				{
					var cell = grid[i][j];
					
					selectedCells.push(cell);
					
					if (i==selectedCell.X && j==selectedCell.Y) continue;
					
					highlightCell(cell);
				}
			}
			
			selectedCell = undefined;
		}
		
		function addTransaction(c1, c2)
		{
			var text = window.prompt("Enter transaction description: ", "");
			
			context.putImageData(c1.img, (c1.X*cellWidth)-2, c1.Y*cellHeight);
			context.putImageData(c2.img, (c2.X*cellWidth)-2, c2.Y*cellHeight);
							
			if (text == null) return;
			
			var txt = text[0].toUpperCase()+text.slice(1);
			
			var X1 = Math.min(c1.account.X, c2.account.X);
			var X2 = Math.max(c1.account.X, c2.account.X);
			var Y = Math.max(c1.account.Y, c2.account.Y);
			
			//while ((Object.keys(grid[X1][Y].credit).length>0) || (Object.keys(grid[X2][Y].debit).length>0))
			//	Y++;
			
			var OK = true;
			
			for (var i=X1; i<=X2; i++)
			{
				if ((i==X1 || i==X2))
				{
					if (((i==X1) && (Object.keys(grid[i][Y].credit).length>0)) || 	// there is a transaction on credit side
					 	((i==X2 ) && (Object.keys(grid[i][Y].debit).length>0)))		// there is a transaction on debit side 
					{
						Y++;
						OK = false;
						break;	
					}
					else
						continue;
				}
				
				// Checking if there are transactions on selected Y axis
				else if (typeof grid[i][Y].account === "object" || 			// there is an account
					(Object.keys(grid[i][Y].credit).length>0) || 	// there is a transaction on credit side
					(Object.keys(grid[i][Y].debit).length>0))		// there is a transaction on debit side
				{
					Y++;
					OK = false;
					break;
				}
			}
			
				
			while (!OK)
			{
				
				for (var i=X1; i<=X2; i++)
				{
					if ((i==X1 || i==X2))
					{
						if (((i==X1) && (Object.keys(grid[i][Y].credit).length>0)) || 	// there is a transaction on credit side
						 	((i==X2 ) && (Object.keys(grid[i][Y].debit).length>0)))		// there is a transaction on debit side 
						{
							Y++;
							i = X1;
							continue;	
						}
						else
							continue;
					}
				
					// Checking if there are transactions on selected Y axis
					else if (typeof grid[i][Y].account === "object" || 			// there is an account
						(Object.keys(grid[i][Y].credit).length>0) || 	// there is a transaction on credit side
						(Object.keys(grid[i][Y].debit).length>0))		// there is a transaction on debit side
					{
						// Moving to the text line
						Y++;
						break;
					}
					
					// Last cycle and didn't find any transactions
					if (i==X2-1)
						OK = true;
				}
			}
			
						
			var debit = (c2.X>c1.X)? c2.account : c1.account;
			var credit = (c1.X<c2.X) ? c1.account : c2.account;
			
			var transaction = 
				{
					description: txt,
					X1: X1,
					X2: X2,
					Y: Y,
					debit: debit,
					credit: credit,
					length: (debit.X - credit.X + 1)
				};
			
			// Horizontal cells
			for (var i=X1+1; i<X2; i++)
					grid[i][Y].account = "";
			
			// Vertical cells
			for (var i=credit.Y+1; i<=Y; i++)
			{
				grid[credit.X][i].account = "";
				//grid[credit.X][i].account.length++;
			}
			
			for (var i=debit.Y+1; i<=Y; i++)
			{
				grid[debit.X][i].account = "";
				//grid[debit.X][i].account.length++;
			}									
			// Transactions [debit][credit]
			transactions[debit.index][credit.index] = transaction;
			grid[debit.X][Y].debit = transaction;
			grid[credit.X][Y].credit = transaction;
			
			if (Y > c2.Y)
			{
				c2.account.length = Math.max(c2.account.length, Y-c2.Y+1);
			}
			
			if (Y > c1.Y)
			{
				c1.account.length = Math.max(c1.account.length, Y-c1.Y+1);
			}
			
			drawTransaction(transaction);
			
		}
		
		
		
	}
	
	function deleteSomething(event)
	{
		var cell = currentCell();
		
		selectedCell = undefined;
		
		if (selectedCells.length>0)
		{
			if (window.confirm("Delete all selected accounts with transactions ?"))
			{
				for (var i=0; i<selectedCells.length; i++)
				{
					var cell = selectedCells[i];
					if (cell.account !== undefined)
					{
						deleteAccount(cell);	
					}
					else
					{
						clearCells([cell]);
					}
				}
			
			}
			
			else
			{
				for (var i=0; i<selectedCells.length; i++)
				{
					var cell = selectedCells[i];
					context.putImageData(cell.img, (cell.X*cellWidth)-2, cell.Y*cellHeight);
				}
					
			}
				
			selectedCells = [];	
		}
		
		else if (window.confirm("Delete account " + cell.account.name + "?"))
		{
			deleteAccount(cell);
		}
		
	}
	
	
	function deleteAccount(cell)
	{
		var cells = [];
		
		// T-account primary cell
		cells.push(cell);
		
		// If it's a long T-account
		if (cell.account.length > 1)
		{
			// Adding additional cells for long T-account
			for (var i=1; i<cell.account.length; i++)
				cells.push(grid[cell.X][cell.Y+i]);
		}
		
		// Checking for transactions for T-account cells
		for (var i=0; i<cells.length; i++)
		{
			
			// If there is a transaction on debit side
			if (Object.keys(cells[i].debit).length>0)
			{
				// Debit transaction
				var T = cells[i].debit;
				
				// Pushing to array transaction cells
				for (var j=T.X1+1; j<T.X2; j++)
					cells.push(grid[j][cells[i].Y]);
				
				var C = grid[T.X1][cells[i].Y]
				C.credit = {};
				
				clearCells([C]);
								
				
				if (C.account !== "")
				{
					drawAccount(C);
				}
				else
				{	
					if ((T.Y-T.credit.Y+1) === T.credit.length && Object.keys(C.debit).length==0)
					{
						var j = 1;
						while (Object.keys(C.debit).length==0 & Object.keys(C.credit).length==0)
						{
								clearCells([C]);
								T.credit.length--;	
								
								if (T.credit.length==0) break;
																
								C = grid[T.X1][cells[i].Y-j];	
								j++;
						}
					}
					else
						drawTransaction(C.debit);		
					drawAccount(grid[T.credit.X][T.credit.Y]);
				}
				// Deleting transaction from transaction matrix
				transactions[T.debit.index][T.credit.index] = [];
			}
			
			// If there is a transaction on credit side
			if (Object.keys(cells[i].credit).length>0)
			{
				// Credit transaction
				var T = cells[i].credit;
				
				// Pushing to array transaction cells
				for (var j=T.X1+1; j<T.X2; j++)
					cells.push(grid[j][cells[i].Y]);
					
				var C = grid[T.X2][cells[i].Y]
				C.debit = {};
				
				clearCells([C]);
								
				
				if (C.account !== "")
				{
					drawAccount(C);
				}
				else
				{	
					if ((T.Y-T.debit.Y+1) === T.debit.length && Object.keys(C.credit).length==0)
					{
						var j = 1;
						while (Object.keys(C.debit).length==0 && Object.keys(C.credit).length==0)
						{
								clearCells([C]);
								T.debit.length--;	
								
								if (T.debit.length==0) break;
																
								C = grid[T.X2][cells[i].Y-j];	
								j++;
						}			
					}
					else
						drawTransaction(C.credit);		
					drawAccount(grid[T.debit.X][T.debit.Y]);
				}

				// Deleting transaction from transaction matrix
				transactions[T.debit.index][T.credit.index] = [];
			}
			
		}
		
		clearCells(cells);
		clearCellsData(cells);
		
	}
	
	function clearCells(cells)
	{
		if (cells.length == 0) return;
		
		for (var i=0; i<cells.length; i++)
		{
			context.clearRect(cells[i].X*cellWidth, cells[i].Y*cellHeight, cellWidth, cellHeight);
			
			context.beginPath();
			context.lineWidth = 0.5;
			context.strokeStyle="#DDD";
			
			context.moveTo(cells[i].X*cellWidth-2, cells[i].Y*cellHeight);
			context.lineTo(cells[i].X*cellWidth-2 + cellWidth, cells[i].Y*cellHeight);
			
			context.moveTo(cells[i].X*cellWidth-2, cells[i].Y*cellHeight + cellHeight);
			context.lineTo(cells[i].X*cellWidth-2 + cellWidth, cells[i].Y*cellHeight + cellHeight);
			
			context.moveTo(cells[i].X*cellWidth-2, cells[i].Y*cellHeight);
			context.lineTo(cells[i].X*cellWidth-2, cells[i].Y*cellHeight + cellHeight);
			
			context.moveTo(cells[i].X*cellWidth-2 + cellWidth, cells[i].Y*cellHeight);
			context.lineTo(cells[i].X*cellWidth-2 + cellWidth, cells[i].Y*cellHeight + cellHeight);
			
			context.closePath();
			context.stroke();
			
		}
	}
	
	function clearCellsData(cells)
	{
		if (cells.length == 0) return;
		
		for (var i=0; i<cells.length; i++)
		{
			var cell = grid[cells[i].X][cells[i].Y];
			
			cell.account = undefined; // T-Account
			cell.debit = {};
			cell.credit = {};
			
		}
	}

	function chartTAccounts()
	{
		//alert("Chart T-Accounts");
		var W = window.outerWidth;
		var H = window.outerHeight;
		
		var winH = Math.min(Math.max(100, accounts.length*context.measureText('M').width)*1.1, H-110);
		
		var param = "top=" + ((H-Math.max(180, winH+70))/2) + ", left=" + ((W-520)/2) + ", height=" + Math.max(180, winH+70) + ", width=520, location=no, toolbar=no, menubar=no, scrollbars=yes, resizable=no, directories=no, status=no, titlebar=0 ";
		var win = window.open("", "Chart", param);
		
		fillTheChart();
		
		
		function fillTheChart()
		{
			win.document.write("<div style='text-align: center; font-size: 1.5em;'>Chart of Accounts</div>");
		
			var select = "<select id='select' multiple style='width: 450px; height: " + (winH+20) +"px;'>";
		
			for (var i=0; i<accounts.length; i++)
				select += "<option> " + accounts[i] + " </option>";
			
			select += "</select>";
		
			win.document.write(select);
			win.document.write("<div style='display: inline-block; vertical-align: top; margin-left: 4px;'><button id='add' style='width: 50px; display: inline-block;' >Add</button>");
			win.document.write("<br><button id='delete' style='width: 50px; display: inline-block;'>Delete</button>");
			win.document.write("<br><button id='close' style='width: 50px; display: inline-block;' onclick='window.close();'>Close</button></div>");
		
			win.document.getElementById("add").addEventListener("click", addAcc);
			win.document.getElementById("delete").addEventListener("click", delAcc);
		}

		function addAcc()
		{
			addAccountInfo(win.prompt("Enter account name: ", ""));
			win.close();
			
			winH = Math.min(Math.max(100, accounts.length*context.measureText('M').width)*1.1, H-110);
		
			param = "top=" + ((H-Math.max(180, winH+70))/2) + ", left=" + ((W-520)/2) + ", height=" + Math.max(180, winH+70) + ", width=520, location=no, toolbar=no, menubar=no, scrollbars=yes, resizable=no, directories=no, status=no, titlebar=0 ";
			
			win = window.open("", "Chart", param);
			
			fillTheChart();
		}
		
		function delAcc()
		{
			
			var e = win.document.getElementById("select");
			
			if (e.selectedIndex != -1)
			{
				var op = e.options[e.selectedIndex].text;
			
				if(win.confirm("Delete selected account " + op + "?"))
				{
					accounts.splice(e.selectedIndex, 1);
					win.close();
					
					winH = Math.min(Math.max(100, accounts.length*context.measureText('M').width)*1.1, H-110);
		
					param = "top=" + ((H-Math.max(180, winH+70))/2) + ", left=" + ((W-520)/2) + ", height=" + Math.max(180, winH+70) + ", width=520, location=no, toolbar=no, menubar=no, scrollbars=yes, resizable=no, directories=no, status=no, titlebar=0 ";
			
					win = window.open("", "Chart", param);
			
					fillTheChart();
						
				}
			}
			else
				win.alert("Select account please");
			
			
		}
		
			
	}	
	
	function saveGrid(event)
	{
		alert("Save grid \n Coming soon...");
	}
	
	
	function restoreGrid(event)
	{
		alert("Restore grid \n Coming soon...");
	}
	
	
	// Draw the link
    function drawLink(x, y, href, title)
    {
        var linkTitle = title,
            linkX = x,
            linkY = y,
            linkWidth = context.measureText(linkTitle).width,
            linkHeight = parseInt(context.font); // Get lineheight out of fontsize

        // Draw the link
        context.fillText(linkTitle, linkX, linkY);

        // Underline the link (you can delete this block)
        context.beginPath();
        context.moveTo(linkX, linkY + linkHeight);
        context.lineTo(linkX + linkWidth, linkY + linkHeight);
        context.lineWidth = 1;
        context.strokeStyle = "#0000ff";
        context.stroke();

        // Add mouse listeners
        canvas.addEventListener("mousemove", on_mousemove, false);
        canvas.addEventListener("click", on_click, false);

        // Add link params to array
        links.push(x + ";" + y + ";" + linkWidth + ";" + linkHeight + ";" + href);
    }

    // Link hover
    function on_mousemove (ev) 
    {
        var x, y;

        // Get the mouse position relative to the canvas element
        if (ev.layerX || ev.layerX == 0) { // For Firefox
            x = ev.layerX;
            y = ev.layerY;
        }

        // Link hover
        for (var i = links.length - 1; i >= 0; i--) 
        {
            var params = [];

            // Get link params back from array
            params = links[i].split(";");

            var linkX = parseInt(params[0]),
                linkY = parseInt(params[1]),
                linkWidth = parseInt(params[2]),
                linkHeight = parseInt(params[3]),
                linkHref = params[4];

            // Check if cursor is in the link area
            if (x >= linkX && x <= (linkX + linkWidth) && y >= linkY && y <= (linkY + linkHeight))
            {
                document.body.style.cursor = "pointer";
                hoverLink = linkHref;
                break;
            }
            else 
            {
                document.body.style.cursor = "";
                hoverLink = "";
            }
        }
    }

    // Link click
    function on_click(e) 
    {
        if (hoverLink)
        {
            window.open(hoverLink); // Use this to open in new tab
            //window.location = hoverLink; // Use this to open in current window
        }
    }
    
	
}


		




