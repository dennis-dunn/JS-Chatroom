/*=====================================================
Contains information about a single client
=====================================================*/
class CClient{
	/*-----------------------------------------------------
	Construct with closed connection
	-----------------------------------------------------*/
	constructor(pSocket = null) {
		this.remove('', pSocket, 0);
	}
	/*-----------------------------------------------------
	Remove, set to closed connection
	-----------------------------------------------------*/
	remove(sName = '', pSocket = null, iStage = 0) {
		this.m_sName   = sName;   //User name
		this.m_pSocket = pSocket; //Connection socket
		this.m_iStage  = iStage;  //The connection/authentication stage
	}
}

var vClients = [];//Resizeable array containing instances of CClient

console.log("Checking dependancies...");
var WebSocketServer = require("websocket").server;
var http = require("http");
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
	var m_iIndex = vClients.push(new CClient(m_hConnection)) - 1;
	console.log("Client has connected for authentication...");
	tools.sendAuthentication(vClients[m_iIndex].m_pSocket, "Waiting for authentication...", "Admin",) // concat into a single string
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
					if (!authenticate(vClients[m_iIndex].m_pSocket, 'TODO')) {
						//TODO reject client
						return;
					}
					tools.sendCode(vClients[m_iIndex].m_pSocket, 'setCon', 3)
					broadcastString(vClients, 'text', "New user '" + hUser.author + "' has joined")
				}
				else
					console.log("ERROR: Unauthorized utf8 message:", hJSON);
			}
		}
	});
	/*-----------------------------------------------------
	Callback for client that closed the connection. Deletes the CClient socket from the array.
	connection: The connection object that closed.
	-----------------------------------------------------*/
	m_hConnection.on("close", function(connection) {
		vClients[m_iIndex].m_iStage = 0;
		broadcastString(vClients, 'text', vClients[m_iIndex].m_sName + " left the server.")
		delete vClients[m_iIndex];//delete the pointer, but keeps empty entry in array, don't want to alter the indices!
	});
});

/*-----------------------------------------------------
Display a text message package add it to the list ctrl.
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
Broadcast a message to all connected clients:
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
				tools.sendTextMessage(vClients[i].m_pSocket, sOut, "Admin")
			}
			else //'asis' Broadcast a buffer as-is
				vClients[i].m_pSocket.send(sOut)
	}
};
/*-----------------------------------------------------
Find a client index in the array by its socket connection.
UNUSED
returns 0-based integer index.
-----------------------------------------------------*/
function getClientIndex(connection) {
	for (var i = 0; i < vClients.length; i++) {
		if (vClients[i].m_pSocket == connection) {//Find the client by its connection
			console.log("getClientIndex found:" + i);
			return i;
		}
		else if (vClients[i].m_pSocket == null) //Can't be!
			console.log("ERROR: Client:" + i + ' null connection!');
	}
	console.log("ERROR: Unknown Client:", connection);
	return -1; //NOT found
}

/*-----------------------------------------------------
TODO: Perform any authentication steps here with the client data.
data: Data received from the client requesting authorization.
-----------------------------------------------------*/
function authenticate(hSocket, data) {
	console.log('Checking user authentication...');
	return true;//Success
}