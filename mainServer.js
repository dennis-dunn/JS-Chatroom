/*=====================================================
Contains information about a single client
=====================================================*/
class CClient{
	/*-----------------------------------------------------
	Construct with closed connection and default values.
	-----------------------------------------------------*/
	constructor(sName = '', hSocket = null, iStage = 0) {
		this.reset(sName, hSocket, iStage);
	}
	/*-----------------------------------------------------
	Reset to closed connection with default inputs, or specify the values manually.
	sName:   
	hSocket: The socket handle
	iStage:  Integer connection stage
	-----------------------------------------------------*/
	reset(sName, hSocket, iStage) {
		this.m_sName   = sName;   //User name
		this.m_hSocket = hSocket; //Connection socket
		this.m_iStage  = iStage;  //The connection/authentication stage
	}
}

var vClients = [];//Resizeable array containing instances of CClient

console.log("Checking dependancies...");
const WebSocketServer = require("websocket").server;
const http = require("http");
const tools = require("./tools");
console.log("Setting up server...");
var server = http.createServer(function(request, response) {
	// process any applicable HTTP request
});
console.log("Listening...");
server.listen(8080, function() { }); //Open a port for listening
wsServer = new WebSocketServer({httpServer: server}); //create the server, needs the listen-port

/*-----------------------------------------------------
Set the callback function for WebSocket server connection accepted:
request: The server request object.
-----------------------------------------------------*/
wsServer.on("request", function(request) {
	var m_hConnection = request.accept(null, request.origin);
	//Need to know client index to remove them on 'close' event:
	var m_iIndex = getClientIndex(null);//Find first empty slot in array
	vClients[m_iIndex] = new CClient('', m_hConnection, 1);
	console.log("Client has connected for authentication...");
	tools.sendAuthentication(vClients[m_iIndex].m_hSocket, "Waiting for authentication...", "Admin",) // concat into a single string
	/*-----------------------------------------------------
	Callback: Receive any message data from clients
	-----------------------------------------------------*/
	m_hConnection.on("message", function(hMessage) {
		//console.log("on-message: ", hMessage); //[type *data]
		if (hMessage.type === 'utf8') { // accept only text
			var hJSON = tools.parseJSON(hMessage.utf8Data);//splice string into a JSON object
			//console.log("utf8MSG parsed: ", hJSON);
			if (vClients[m_iIndex].m_iStage > 2) {//Place all authorized actions here:
				if (hJSON.type === "text") { //was "utf8"Process a text message
					broadcastString(vClients, 'asis', hMessage.utf8Data);//Send it back to everyone as-is
				}
				else
					console.log("ERROR: Unhandled utf8 message:", hJSON);
			}
			else {
				//All remaining unauthorized actions can be here:
				if (hJSON.type === "auth") { //authentication
					var hUser = hJSON.data;
					vClients[m_iIndex].m_sName = hUser.author;//Remove from list
					vClients[m_iIndex].m_iStage = 3;//Fully connected/authorized
					if (!authenticate(vClients[m_iIndex].m_hSocket, 'TODO')) {
						//TODO reject client
						return;
					}
					tools.sendCode(vClients[m_iIndex].m_hSocket, 'setCon', 3)
					broadcastString(vClients, 'text', "New user '" + hUser.author + "' has joined")
				}
				else
					console.log("ERROR: Unauthorized utf8 message:", hJSON);
			}
		}
	});
	/*-----------------------------------------------------
	Callback for client that closed the connection. Deletes the CClient socket from the array.
	hConnection: The connection object that closed.
	-----------------------------------------------------*/
	m_hConnection.on("close", function(hConnection) {
		vClients[m_iIndex].m_iStage = 0;
		broadcastString(vClients, 'text', vClients[m_iIndex].m_sName + " left the server.")
		vClients[m_iIndex].reset('NONE',null,0);
	});
});
/*-----------------------------------------------------
Display a text message package by adding it to the console output.
hJSON: An ojbect containing {time, text, color, author}.
-----------------------------------------------------*/
function displayTextMessage(hJSON) {
	if (hJSON.type == 'text' || hJSON.type == 'asis') {
		var hMessagePacket = hJSON.data;
		console.log('[' + tools.stringifyTime(hMessagePacket.time) + '] (' + hMessagePacket.author + '): ' + hMessagePacket.text);
	}
	else {
		console.log('Unrecognized text package: ', hJSON);
	}
}
/*-----------------------------------------------------
Broadcast a message to all connected clients.
vClients: Array of current CClient instances.
sType:    The type of string, usually 'text' or 'asis'.
sOut:     The data to send.
-----------------------------------------------------*/
function broadcastString(vClients, sType, sOut){
	if (sType == 'text') {
		time = (new Date()).getTime();
		console.log('[' + tools.stringifyTime(time) + '] (Admin): ' + sOut);
	}
	else { //as-is
		//console.log(sOut);
		var hJSON = tools.parseJSON(sOut);
		displayTextMessage(hJSON);//Show for admin
	}
	for (var i=0; i < vClients.length; i++) { //Cycle through all active clients and send the data to them.
		if (vClients[i] != null && vClients[i].m_iStage > 1)
			if (sType == 'text') {
				tools.sendTextMessage(vClients[i].m_hSocket, sOut, "Admin")
			}
			else //'asis' Broadcast a buffer as-is
				vClients[i].m_hSocket.send(sOut)
	}
};
/*-----------------------------------------------------
Find a client's index in the server's array by its socket connection handle.
returns: 0-based integer index. If NOT found, returns the length of the array.
-----------------------------------------------------*/
function getClientIndex(connection) {
	for (var i = 0; i < vClients.length; i++) {
		if (vClients[i].m_hSocket == connection) {//Find the client by its connection
			console.log("getClientIndex found:" + i);
			return i;
		}
		else if (vClients[i].m_hSocket == null) //Can't be!
			console.log("ERROR: Client[" + i + '] is null!');
	}
	return vClients.length; //NOT found
}
/*-----------------------------------------------------
TODO: Perform any authentication steps here with the client data.
data: Data received from the client requesting authorization.
-----------------------------------------------------*/
function authenticate(hSocket, data) {
	console.log('Checking user authentication...');
	return true;//Success
}
/*-----------------------------------------------------
Run a test to check that getClientIndex() works for the last array entry.
return: true/false for success/fail.
-----------------------------------------------------*/
function testIndex() {
	var i = vClients.length - 1;
	return (getClientIndex(vClients[i]) == i);
}