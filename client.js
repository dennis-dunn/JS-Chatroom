/*=====================================================
CLIENT SIDE
=====================================================*/
//Initialization:
var bHosting = 0;
var iConStage = 0;
var sText = "";
var hSocket = null;
var socketListen;
var sUserName = "A";
var _sIP = "";

document.getElementById('idIP').value = "localhost:8080";
setCon(0);//Set initial controls' states
/*=====================================================
Function declarations
=====================================================*/
/*-----------------------------------------------------
Display text add line to list ctrl.
message: Plain text to print onto the cleint's list control.
-----------------------------------------------------*/
function log(message) {
	var li = document.createElement('li');
	li.innerHTML = message;
	document.getElementById('message-list').appendChild(li);
}
/*-----------------------------------------------------
Display a JSON package as a text line in the server console output.
hJSON : Object tree containing the info: {time, text, color, author}
-----------------------------------------------------*/
function displayTextMessage(hJSON) {
	if (hJSON.type == 'text') {
		var hMessagePacket = hJSON.data;
		log('<span style="color:' + hMessagePacket.color + ';">[' + tools.stringifyTime(hMessagePacket.time) + '] (' + hMessagePacket.author + '): ' + hMessagePacket.text + '</span>');
	}
	else {
		log('<span style="color:red;">Unknown package: '+ hJSON + '</span>');
	}
}
/*-----------------------------------------------------
Initiates a connection to a server, such as pressing the connect button.
-----------------------------------------------------*/
function onConnect() {
	if (iConStage == 0)
		connect();
	else {//close-quote
		setCon(0);//update values/controls for closed connection
		if (hSocket != null) {//If this was forced from the server-side
			hSocket.close(); //close the socket
			delete hSocket;
		}
	}
}
/*-----------------------------------------------------
Handle some values and controls for various connection stages
iStage: Integer corresponding to the client's authorization stage.
		0: Disconnected
		1: Attampting to contact the server
		2: Connected, awaiting server authorization request.
		3: Fully connected, server has granted authorization.
-----------------------------------------------------*/
function setCon(iStage) {
	//log('setCon ' + iStage)
	document.getElementById("idSend").disabled = (iStage != 0);
	document.getElementById("idIP").disabled = (iStage > 0);
	document.getElementById("idUserName").disabled = (iStage > 0);
	document.getElementById("idSend").disabled = (iStage < 3); //Can't send until fully authenticated
	document.getElementById("idText").disabled = (iStage < 3); //Can't send until fully authenticated
	if (iStage == 0){ //closeCon
		if (iConStage > 1) //Only display if previously connected
			log('<span style="color:black;">Client disconnected</span>');
		document.getElementById("idConnect").innerHTML = "Connect";
	}
	else if (iStage > 0) {
		document.getElementById("idConnect").innerHTML = "Disconnect";
	}
	iConStage = iStage; //Fully connected now
}
/*-----------------------------------------------------
User needs to authenticate with the server
hSocket: The socket object to send authentication to
data: Unused, could contain authorzation key, etc. from the server
-----------------------------------------------------*/
function authenticate(hSocket, data) {
	log('Sending authentication...');
	//TODO: authenticate the client here
	tools.sendAuthentication(hSocket,'OK',sUserName);//Send authentication data (password, key, etc) to the server
}
/*-----------------------------------------------------
Handle received command codes.
hSocket: The socket object that received the code package
data: an object package containing {code, value} pair.
-----------------------------------------------------*/
function handleCode(hSocket, data) {
	if (data.code == 'setCon')
		setCon(data.value);
	//else if (data.code == '...') //TODO: Handle more codes here
	else //Unknown command code
		log('<span style="color:red;">Unknown code received ' + data.value + '</span>');
}
/*-----------------------------------------------------
Initiates a connection to a listening server by creating a socket.
All callback functions contained inside.
-----------------------------------------------------*/
function connect() {
	sUserName = document.getElementById("idUserName").value
	_sIP = document.getElementById("idIP").value
	setCon(1);//Connection initaited, requesting server to accept
	log('Client "' + sUserName + '" is connecting...');
	var sAddress = 'ws://' + _sIP;
	try { // Create a socket instance
		hSocket = new WebSocket(sAddress);//was ws://localhost:8080');
	}
	catch (e) {
		setCon(0);
		log('<span style="color:red;">Client couldn\'t connect to host ' + sAddress + '</span>');
		return;
	}
	/*-----------------------------------------------------
	Callback override for once the connection to a server is successful
	-----------------------------------------------------*/
	hSocket.onopen = function(event) { 
		log('<span style="color:green;">Connection successful!</span>');
		setCon(2);//Able to send/receive authentication now
		/*-----------------------------------------------------
		Listen for messages
		event: An event containing {type, data, ...}
		-----------------------------------------------------*/
		hSocket.onmessage = function(event) { // [type data]
			if (event.type == 'message') {//received a message of some type
				//In the case of a message, the data will be a JSON text string
				var hJSON = tools.parseJSON(event.data);//Parse into an object {type, ...}
				if (hJSON.type == 'text')
					displayTextMessage(hJSON);//forward the whole object directly to be handled
				else if (hJSON.type == 'auth') //Authorization request from server
					authenticate(hSocket, hJSON.data);
				else if (hJSON.type == 'code') //Generic command code received
					handleCode(hSocket, hJSON.data);
			}
		}
		/*-----------------------------------------------------
		Callback override for when the current socket closes
		event: 
		-----------------------------------------------------*/
		hSocket.onclose = function(event) {
			delete hSocket; //deletes self (is this safe?)
			hSocket = null;
			if (iConStage > 0) { //Was the connection still open? Closed from the server side
				log('<span style="color:red;">Server closed the connection.</span>');
			}
			setCon(0);//update values/controls for a closed connection
		};
		/*-----------------------------------------------------
		Any error occurred
		event: object with error info {data, ...}
		-----------------------------------------------------*/
		hSocket.onerror = function(event) {
			log(event.data);
		};
	};
}
/*-----------------------------------------------------
Event listener for keyboard key presses (key-up).
event: Object with event data
-----------------------------------------------------*/
document.getElementById("idText").addEventListener("keyup",function(event) {
	event.preventDefault();
	if (event.keyCode === 13) { //Return key
		onSend(); //Press the send button
	}
});
/*-----------------------------------------------------
Send a text message contained in the text field to the server for broadcast.
Typically only called when user presses the "Send" button or return key.
-----------------------------------------------------*/
function onSend() {
	if (iConStage < 3) //Don't send to server unless fully authorized
		return;
	sTextMessage = document.getElementById("idText").value;
	//log(sTextMessage);
	document.getElementById("idText").value = '';//Clear the message text box
	tools.sendTextMessage(hSocket, sTextMessage, sUserName, "black");
}