var socket = io();
var top;
var left;
var offset;
var currColor;
var mouseIsDown;
var startX;
var startY;

var brushTool;
var rectTool;
var circleTool;
var fillTool;
var eraserTool;

var cursorDraw = "url(img/cursor-draw.png) 0 0, auto";
var cursorSmallBrush = "url(img/cursor-small-draw.png) 10 10, auto";
var cursorMedBrush = "url(img/cursor-med-draw.png) 10 10, auto";
var cursorLargeBrush = "url(img/cursor-large-draw.png) 10 10, auto";
var cursorCircle = "url(img/cursor-circle.png) 0 10, auto";
var cursorRect = "url(img/cursor-rect.png) 0 10, auto";
var cursorEraser = "url(img/cursor-eraser.png) 0 34, auto";


var canvas, ctx, flag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    dot_flag = false;

var color = "black",
    lineWidth = 8;

function loadLogin(){
	var wid = $(window).width();
	var hei = $(window).height();

	$("#loginOverlay").css("height", hei + 'px');
	$("#box").css("left", (wid/2)-(550 * .5)+"px");
}

socket.on("loginBad", function(errorMessage){
	$("#loginError").empty();
	$("#loginError").append(errorMessage);
	$("#userName").val("");
	$("#userName").focus();
});

socket.on("loginOk", function(){
	$("#loginOverlay").css("display", "none");
	$("#box").css("display", "none");
});

function sanitizeForHTML(stringToConvert) {
	stringToConvert = stringToConvert.replace(/&/g, "&amp;");
	stringToConvert = stringToConvert.replace(/</g, "&lt;");
	stringToConvert = stringToConvert.replace(/>/g, "&gt;");
	stringToConvert = stringToConvert.replace(/\//g, "&#47;");
	stringToConvert = stringToConvert.replace(/"/g, "&quot;");
	stringToConvert = stringToConvert.replace(/'/g, "&#39;");

	return stringToConvert;
}


socket.on("updateUsers", function(players){
	$("#userList").empty();
	var th = $("<th colspan='3'>Players</th>");
	$("#userList").append(th);
	for(var i = 0; i < players.length; i++){
		var tr = $("<tr></tr>");
		var playerNum = i+1;
		tr.append("<td class='playerRank' rowspan='2'>#" + players[i].rank + " </td>");
		tr.append("<td class='playerNames'>" + sanitizeForHTML(players[i].name) + "</td>");
		if(players[i].drawer)
			tr.append("<td class='drawer' rowspan='2'><img src='imgs/pencil.png' class='pencil'></td>");
		else
			tr.append("<td rowspan='2'></td>");
		$("#userList").append(tr);
		$("#userList").append("<tr><td class='playerScore'>" + players[i].score + "</td></tr>");
	}
});

socket.on("sayAll", function(dataFromServer) {
	$("#chatField").append(sanitizeForHTML(dataFromServer) + "\n");
});

function sendChatToServer() {
	socket.emit("chat", $("#chatText").val() );
	socket.emit("checkAnswer", $("#chatText").val() );
	$("#chatText").val("");
	$("#chatText").focus();
}

/*function adjustCanvasHeight () {
	var canvasWidth = $(".canvas").width();
	$(".canvas").css("height", canvasWidth);
	console.log(canvasWidth);
	console.log("height change!");
	console.log(canvas.css(width));
}*/

function draw() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
	ctx.lineTo(currX, currY);
	ctx.lineJoin = ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    if (eraserTool) {
		ctx.strokeStyle = "#ffffff";
	}
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.closePath();
}

function findxy(res, e) {
	if (brushTool || eraserTool) {
		if (res == 'down') {
			changeBrushSize(lineWidth);
			prevX = currX;
			prevY = currY;
			currX = e.pageX - offset.left;
			currY = e.pageY - offset.top;

			flag = true;
			dot_flag = true;
			if (dot_flag) {
				ctx.beginPath();
				ctx.fillStyle = color;
				if (eraserTool) {
					ctx.fillStyle = "#ffffff";
				}
				ctx.fillRect(currX, currY, 2, 2);
				ctx.closePath();
				dot_flag = false;
			}
		}
		if (res == 'up' || res == "out") {
			flag = false;
		}
		if (res == 'move') {
			if (flag) {
				prevX = currX;
				prevY = currY;
				currX = e.pageX - offset.left;
				currY = e.pageY - offset.top;
				draw();
			}
    	}
    	if (res == 'click' && res !== 'move') {
			ctx.fillStyle = color;
			if (eraserTool) {
				ctx.fillStyle = "#ffffff";
			}
			ctx.beginPath();
			var clickX = e.pageX - offset.left;
			var clickY = e.pageY - offset.top;
			ctx.arc(clickX, clickY, lineWidth/2, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.closePath();
		}
	}
	if (rectTool) {
		if(mouseIsDown && res == 'up'){
		    mouseIsDown=false;
		    var mouseX = e.pageX - offset.left;
		    var mouseY = e.pageY - offset.top;
		    ctx.rect(startX,startY,mouseX-startX,mouseY-startY);
		    ctx.fill();
		    ctx.closePath();
		}
		else if (res == 'down') {
		    mouseIsDown=true;
		    startX = e.pageX - offset.left;
		    startY = e.pageY - offset.top;
		    ctx.beginPath();
		    ctx.fillStyle = color;
		}
		/*else if (res == 'move') {
			var mouseX = e.pageX - offset.left;
		    var mouseY = e.pageY - offset.top;
		    ctx.beginPath();
		    ctx.fillStyle = color;
		    ctx.rect(startX,startY,mouseX-startX,mouseY-startY);
		    ctx.fill();
		}*/
	}
	if (circleTool) {
			if(mouseIsDown && res == 'up'){
			    mouseIsDown=false;
			    var mouseX = e.pageX - offset.left;
			    var mouseY = e.pageY - offset.top;
			    ctx.fillStyle = color;
			    ctx.beginPath();
			    var midX = (startX+mouseX)/2;
			    var midY = (startY+mouseY)/2;
			    var radius = (startX-mouseX)/2;
			    if (radius < 0) {
					radius *= -1;
				}
				ctx.arc(midX, midY, radius, 0, 2*Math.PI, false);
				ctx.fill();
			    ctx.closePath();
			}
			else if (res == 'down') {
			    mouseIsDown=true;
			    startX = e.pageX - offset.left;
			    startY = e.pageY - offset.top;
			}
			/*else if (res == 'move') {
				var mouseX = e.pageX - offset.left;
			    var mouseY = e.pageY - offset.top;
			    ctx.beginPath();
			    ctx.fillStyle = color;
			    ctx.rect(startX,startY,mouseX-startX,mouseY-startY);
			    ctx.fill();
			}*/
	}
}

function changeColor(newColor, colorName) {
	currColor.src = "img/" + colorName + ".png";
	color = newColor;
}

function changeBrushSize(newSize) {
	lineWidth = newSize;
	if (brushTool) {
		if (lineWidth == 30) {
			canvas.style.cursor = cursorLargeBrush;
		}
		else if (lineWidth == 15) {
			canvas.style.cursor = cursorMedBrush;
		}
		else if (lineWidth == 8) {
			canvas.style.cursor = cursorSmallBrush;
		}
	}
}

function setToolsFalse() {
	brushTool = false;
	rectTool = false;
	circleTool = false;
	fillTool = false;
	eraserTool = false;
}


function startUp(){
	//adjustCanvasHeight();
	currColor = document.getElementById('current-color');
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext("2d");
	canvas.width = 600;
	canvas.height = 500;
	w = 600;
	h = 500;
	offset = $(canvas).offset();

	mouseIsDown = false;

	brushTool = true;
	rectTool = false;
	circleTool = false;
	fillTool = false;
	eraserTool = false;

	canvas.addEventListener("mousemove", function (e) {
		findxy('move', e)
	}, false);
	canvas.addEventListener("mousedown", function (e) {
		findxy('down', e)
	}, false);
	canvas.addEventListener("mouseup", function (e) {
		findxy('up', e)
	}, false);
	canvas.addEventListener("mouseout", function (e) {
		findxy('out', e)
    }, false);
    canvas.addEventListener("click", function (e) {
			findxy('click', e)
	}, false);

    // tool clicks
    $("#brush-tool").click(function() {
		setToolsFalse();
		brushTool = true;
	});
	$("#rect-tool").click(function() {
		setToolsFalse();
		rectTool = true;
		canvas.style.cursor = cursorRect;
	});
	$("#circle-tool").click(function() {
		setToolsFalse();
		circleTool = true;
		canvas.style.cursor = cursorCircle;
	});
	$("#fill-tool").click(function() {
		setToolsFalse();
		fillTool = true;
	});
	$("#eraser-tool").click(function() {
		setToolsFalse();
		eraserTool = true;
		canvas.style.cursor = cursorEraser;
	});

	// clearing canvas
	$("#clear-canvas").click(function() {
		ctx.clearRect(0, 0, 600, 500);
	});

	// color changing clicks
	$("#black").click(function() {
		changeColor("#000000", "black");
	});
	$("#dark-brown").click(function() {
		changeColor("#534741", "dark-brown");
	});
	$("#light-brown").click(function() {
		changeColor("#a67c52", "light-brown");
	});
	$("#red").click(function() {
		changeColor("#ee1c24", "red");
	});
	$("#pink").click(function() {
		changeColor("#f26d7d", "pink");
	});
	$("#dark-green").click(function() {
		changeColor("#005826", "dark-green");
	});
	$("#dark-blue").click(function() {
		changeColor("#0054a6", "dark-blue");
	});
	$("#purple").click(function() {
		changeColor("#605ca9", "purple");
	});
	$("#white").click(function() {
		changeColor("#ffffff", "white");
	});
	$("#grey").click(function() {
		changeColor("#959595", "grey");
	});
	$("#beige").click(function() {
		changeColor("#fbcf9e", "beige");
	});
	$("#orange").click(function() {
		changeColor("#f26522", "orange");
	});
	$("#yellow").click(function() {
		changeColor("#fff200", "yellow");
	});
	$("#light-green").click(function() {
		changeColor("#00a651", "light-green");
	});
	$("#light-blue").click(function() {
		changeColor("#00aef0", "light-blue");
	});
	$("#lilac").click(function() {
		changeColor("#bd8cbf", "lilac");
	});

	// brush size changing clicks
	$("#small-brush").click(function() {
		changeBrushSize(8);

	});
	$("#med-brush").click(function() {
		changeBrushSize(15);
	});
	$("#large-brush").click(function() {
		changeBrushSize(30);
	});

	$("#userName").focus();
	$("#login").click(function(){
		socket.emit("login", $("#userName").val());
	});
	$("#userName").keypress(function(event) {
		if (event.which == 13) {
			socket.emit("login", $("#userName").val());
			event.preventDefault();
		}
	});

	$("#chatButton").click(sendChatToServer);
	$("#chatText").keypress(function(event) {
		if (event.which == 13) {
			sendChatToServer();
			event.preventDefault();
		}
	});
	loadLogin();
}



$(startUp);