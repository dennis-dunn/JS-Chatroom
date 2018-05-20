var bHosting = 0;
var iConStage = 0;
var strText = "";
var hSocket = null;
var socketListen;
var strUserName = "A";

document.getElementById("idSend").disabled = true;
document.getElementById("idText").disabled = true;

//CLIENT SIDE:
//Display text add line to list ctrl
function log(message) {
	var li = document.createElement('li');
	li.innerHTML = message;
	document.getElementById('message-list').appendChild(li);
}
/*Display a text package add line to list ctrl
[time, text, color, author]*/
function displayTextMessage(hJSON) {
	if (hJSON.type == 'text') {
		var hMessagePacket = hJSON.data;
		log('<span style="color:' + hMessagePacket.color + ';">[' + tools.stringifyTime(hMessagePacket.time) + '] (' + hMessagePacket.author + '): ' + hMessagePacket.text + '</span>');
	}
	else {
		log('<span style="color:red;">Unknown package: '+ hJSON + '</span>');
	}
}
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
//Handle some values and controls for various connection stages
function setCon(iStage) {
	//log('setCon ' + iStage)
	iConStage = iStage; //Fully connected now
	document.getElementById("idSend").disabled = (iConStage != 0);

	document.getElementById("idIP").disabled = (iConStage > 0);
	document.getElementById("idUserName").disabled = (iConStage > 0);
	document.getElementById("idSend").disabled = (iConStage < 3); //Can't send until fully authenticated
	document.getElementById("idText").disabled = (iConStage < 3); //Can't send until fully authenticated
	if (iConStage == 0){ //closeCon
		log('<span style="color:black;">Client disconnected</span>');
		document.getElementById("idConnect").innerHTML = "Connect";
	}
	else if (iConStage > 0) {
		document.getElementById("idConnect").innerHTML = "Disconnect";
	}

}
/*-----------------------------------------------------
User needs to authenticate with the server
-----------------------------------------------------*/
function authenticate(hSocket, data) {
	log('Sending authentication...');
	tools.sendAuthentication(hSocket,'OK',strUserName)
}
/*-----------------------------------------------------
Handle codes
-----------------------------------------------------*/
function handleCode(hSocket, data) {
	if (data.code == 'setCon')
		setCon(data.value);
	else
		log('<span style="color:red;">Unknown code received ' + data.value + '</span>');
}
/*-----------------------------------------------------
Create a socket and try to connect to a listener
-----------------------------------------------------*/
function connect() {
	strUserName = document.getElementById("idUserName").value
	_strIP = document.getElementById("idIP").value
	setCon(1);
	log('Client "' + strUserName + '" is connecting...');
	
	// Create a socket instance
	try {
		hSocket = new WebSocket('ws://' + _strIP);//was ws://localhost:8080');
	}
	catch {
		log('<span style="color:red;">Client couldn\'t connect to host ' + _strIP + '</span>');
		return;
	}
	//(socket.readyState == "CONNECTING")
	//(socket.readyState == "OPEN")
	//Once the connection to a server is successful
	hSocket.onopen = function(event) { 
		log('<span style="color:green;">Connection successful!</span>');
		// Send an initial message:
		//tools.sendTextMessage(hSocket,"Hello!", strUserName) //Can't send messages until stage3 clearance
		setCon(2);//Able to send/receive authentication now
		// Listen for messages
		hSocket.onmessage = function(event) { // [type data]
			if (event.type == 'message') {//received a message of some type
				//log('onmessage: ' + event.data); 
				var hJSON = tools.parseJSON(event.data);
				if (hJSON.type == 'text')
					displayTextMessage(hJSON);
				else if (hJSON.type == 'auth')
					authenticate(hSocket, hJSON.data);
				else if (hJSON.type == 'code')
					handleCode(hSocket, hJSON.data);
			}
		}
		
		// Listen for socket closure
		hSocket.onclose = function(event) {
			delete hSocket;
			hSocket = null;
			if (iConStage > 0) { //Was the connection still open? Closed from the server side
				log('<span style="color:red;">Server closed the connection.</span>');
				setCon(0);//update values/controls for closed connection
			}
		};
		/*Any error occurred*/
		hSocket.onerror = function(evt) {
			log(evt.data);
		};
	};
}
/*-----------------------------------------------------
User pressed the send button
-----------------------------------------------------*/
function onSend() {
	if (iConStage < 3)
		return;
	strTextMessage = document.getElementById("idText").value
	//log(strTextMessage)
	document.getElementById("idText").value = '';//Clear the message text box
	tools.sendTextMessage(hSocket, strTextMessage, strUserName, strColor="black")
}
/*-----------------------------------------------------
Event listener for keyboard presses
-----------------------------------------------------*/
document.getElementById("idText").addEventListener("keyup", function(event) {
	event.preventDefault();
	if (event.keyCode === 13) {
		onSend(); //Click the send button
	}
});