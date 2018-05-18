(function(exports){ //Thanks to https://caolan.org/posts/writing_for_node_and_the_browser.html
//Creates an export that can be used in node.js and client side!
	
	/*-----------------------------------------------------
	Packages a code with a value
	-----------------------------------------------------*/
	exports.sendCode = function (hSocket, strCode, strValue) {
		var hPacket = {
			code: strCode,
			value: strValue,
		};
		// concat into a single string
		var strJSON = JSON.stringify({ type:'code', data: hPacket});
		hSocket.send(strJSON);
	};
	
	/*-----------------------------------------------------
	Packages a text string message into a text package and sends it.
	-----------------------------------------------------*/
	exports.sendTextMessage = function (hSocket, strText, userName, strColor="black") {
		var hPacket = {
			time: (new Date()).getTime(),
			text: strText,
			author: userName,
			color: strColor
		};
		// concat into a single string
		var strJSON = JSON.stringify({ type:'text', data: hPacket });
		hSocket.send(strJSON);
	};
	/*-----------------------------------------------------
	Packages authentication data into a package and sends it to client at socket.
	-----------------------------------------------------*/
	exports.sendAuthentication = function (hSocket, strData, userName) {
		var hPacket = {
			time: (new Date()).getTime(),
			data: strData,
			author: userName,
		};
		// concat into a single string
		var strJSON = JSON.stringify({type:'auth', data: hPacket });
		hSocket.send(strJSON);
	};
	/*-----------------------------------------------------
	Attempts to parse a string into an object JSON structure.
	Returns the JSON object
	-----------------------------------------------------*/
	exports.parseJSON = function (strPack) {
		var hJSON;
		try {
			hJSON = JSON.parse(strPack);
		} catch (e) {
			hJSON = 'Invalid JSON: ' + strPack;
		}
		return hJSON;
	}
	/*-----------------------------------------------------
	time in milliseconds since 1970
	-----------------------------------------------------*/
	exports.stringifyTime = function (time) {
		var date = new Date(time);
		return (date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
	}
})(typeof exports === 'undefined'? this['tools']={}: exports);