(function(exports){ //Thanks to https://caolan.org/posts/writing_for_node_and_the_browser.html
//Creates an export that can be used in both server node.js and client side!
	
	/*-----------------------------------------------------
	Packages a code and value pair into a JSON string and sends it.
	hSocket: The socket to send the package to.
	sCode:   Generic code for the command.
	sValue:  Generic value for the command.
	-----------------------------------------------------*/
	exports.sendCode = function (hSocket, sCode, sValue) {
		var hPacket = {
			code: sCode,
			value: sValue,
		};
		// concat into a single string
		var sJSON = JSON.stringify({ type:'code', data: hPacket});
		hSocket.send(sJSON);
	};
	/*-----------------------------------------------------
	Packages a text string message into a text package and sends it.
	hSocket:   The socket to send the package to.
	sText:     The plain text message to broadcast to all users.
	sUserName: Name of the author of the message.
	sColor:    Color to display the text in.
	-----------------------------------------------------*/
	exports.sendTextMessage = function (hSocket, sText, sUserName, sColor="black") {
		var hPacket = {
			time: (new Date()).getTime(),
			text: sText,
			author: sUserName,
			color: sColor
		};
		// concat into a single string
		var sJSON = JSON.stringify({ type:'text', data: hPacket });
		hSocket.send(sJSON);
	};
	/*-----------------------------------------------------
	Packages authentication data into a package and sends it to client at socket.
	hSocket:   The socket to send the package to.
	sData:     Custom data string used for authorizing users.
	sUserName: Name of the user to authenticate
	-----------------------------------------------------*/
	exports.sendAuthentication = function (hSocket, sData, sUserName) {
		var hPacket = {
			time: (new Date()).getTime(),
			data: sData,
			author: sUserName,
		};
		// concat into a single string
		var sJSON = JSON.stringify({type:'auth', data: hPacket });
		hSocket.send(sJSON);
	};
	/*-----------------------------------------------------
	Attempts to parse a string into a JSON object structure.
	sPack:  Custom JSON string to parse into a JSON object.
	returns:
	hJSON:  The resulting object containing the parsed entries
	-----------------------------------------------------*/
	exports.parseJSON = function (sPack) {
		var hJSON;
		try {
			hJSON = JSON.parse(sPack);
		} catch (e) {
			hJSON = 'Invalid JSON: ' + sPack;
		}
		return hJSON;
	}
	/*-----------------------------------------------------
	Convert a time to a text string.
	time: in milliseconds since 1970
	-----------------------------------------------------*/
	exports.stringifyTime = function (time) {
		var date = new Date(time);
		return (date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
	}
})(typeof exports === 'undefined'? this['tools']={}: exports);