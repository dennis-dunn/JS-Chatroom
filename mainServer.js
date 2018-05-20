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
					tools.sendCode(vClients[m_iIndex].m_pSocket, 'setCon', 3)
					broadcastString(vClients, 'text', "New user '" + hUser.author + "' has joined")
				}
				else
					console.log("ERROR: Unauthorized utf8 message:", hJSON);
			}
		}
	});
	/*-----------------------------------------------------
	Callback for client that closed the connection. Delete the connection
	-----------------------------------------------------*/
	m_hConnection.on("close", function(connection) {
		vClients[m_iIndex].m_iStage = 0;
		broadcastString(vClients, 'text', vClients[m_iIndex].m_sName + " left the server.")
		delete vClients[m_iIndex];//delete the pointer, but keeps empty entry in array, don't want to alter the indices!
	});
});

/*-----------------------------------------------------
Display a text package add line to list ctrl
[time, text, color, author]
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
-----------------------------------------------------*/
function broadcastString(vClients, type, strOut){
	if (type == 'text') {
		time = (new Date()).getTime();
		console.log('[' + tools.stringifyTime(time) + '] (Admin): ' + strOut);
	}
	else { //as-is
		//console.log(strOut);
		var hJSON = tools.parseJSON(strOut);
		displayTextMessage(hJSON);//Show for admin
	}
	for (var i=0; i < vClients.length; i++) {
		if (vClients[i] != null && vClients[i].m_iStage > 1)
			if (type == 'text') {
				tools.sendTextMessage(vClients[i].m_pSocket, strOut, "Admin", strColor="green")
			}
			else //'asis' Broadcast a buffer as-is
				vClients[i].m_pSocket.send(strOut)
	}
};
/*-----------------------------------------------------
Find a client index by its socket connection
[time, text, color, author]
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
Display a text package add line to list ctrl
[time, key, author]
-----------------------------------------------------*/
function authenticate(socket, data) {
	log('Sending authentication...');
}