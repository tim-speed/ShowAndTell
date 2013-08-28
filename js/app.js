/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
(function(window, $) {
// Initialize a connection to GoInstant
var platform = new goinstant.Platform("https://goinstant.net/tim-speed/goinstant-test"),
	showRoom = window.showRoom = platform.room('show'),
	chatChannel = showRoom.channel('chat'),
	shareListKey = showRoom.key('list'),
	shareListObj = {},
	myColor,
	user,
	userKey,
	userColors;

platform.connect(function(err, platform) {
	showRoom.join(function(errorObject, roomObject) {
		showRoom.user(function(err, userObj, key) {
			if (err) {
				// TODO: Handle error
				return;
			}
			user = userObj;
			userKey = key;
			
			goinstant.components.load('goinstant/v1/typing-indicators', function(err, TypingIndiciators) {
				var typingIndicators = new TypingIndiciators({
					room: showRoom
				});

				typingIndicators.initialize(function(err) {
					typingIndicators.bindInputs('#chatmessage', function(err) {

					});
				});
			});
			goinstant.components.load('goinstant/v1/user-list', function(err, UserList) {
				var userList = new UserList({
					room: showRoom,
					position: 'left',
					collapsed: false,
					maxLength: 15/*,
					container: $('#bottompane')[0]*/
				});
				userList.initialize(function(err) {
					// TODO: Handle error
					
					// Hijack the user list
					function HijackUserList() {
						// Find the element for this user and change it to have an editiable user name
						var $userNameSpan = $('div.goinstant-userlist li.goinstant-user[data-goinstant-id="' + user.id + '"] > div.goinstant-name > span');
						// Rebind Click Handler
						$userNameSpan.off('click').click(function() {
							var $input = $('<input type="text" value="' + $userNameSpan.text() + '" />');
							// On blur we commit the name and switch back
							$input.blur(function() {
								var displayName = $input.val();
								// Set the name
								userKey.key('displayName').set(displayName);
								$userNameSpan.text(displayName);
								// Switch back the elements
								$input.replaceWith($userNameSpan);
							});
							// Replace the span with the name insert
							$userNameSpan.replaceWith($input);
							// Give it focues
							$input.focus();
						});
					}
					// Do the initial hijack
					HijackUserList();
					// On list modified, hijack it again if needed
					$('div.goinstant-userlist')[0].addEventListener('DOMSubtreeModified', HijackUserList, false);
				});
			});
			goinstant.components.load('goinstant/v1/user-colors', function(err, UserColors) {
				userColors = new UserColors({
					room: showRoom
				});

				userColors.get(undefined, function(err, color) {
					if (err) {
						// TODO: Handle error on initial color fetch
						return;
					}
					myColor = color;

					// Listen for chat messages
					chatChannel.on('message', function(msg, context) {
						console.log("Got Message:", msg, context);
						handlechatmessage(msg, context.userId);
					});

					// Listen for changes to the share list
					shareListKey.get(function(error, value, context) {
						if (error) {
							// TODO: Handle error getting inital share list
							return;
						}

						// Handle the share list
						shareListObj = value;
						console.log("Initial Share List: ", shareListObj);
						handlesharelistupdate();

						// Listen for list changes
						shareListKey.on('set', {
							local: true, // listen to local events
							bubble: true, // bubble events fired by all children of '/list', e.g. '/list/bar', '/list/bar/baz', etc.
							listener: function(value, context) {
								// Handle the specific key portion set in the context
								// NOTE: That this does not handle list itself being set - but list itself should never be set!!!
								var keychain = context.key.substr(1).split("/"),
									objRef = shareListObj,
									i = 1,
									lastKey = keychain.length - 1,
									t;
								// Loop through our local structure to look for the last branch while building out the object as needed
								for (; i < lastKey; i++) {
									t = keychain[i];
									if (!objRef[t])
										objRef = objRef[t] = {};
									else
										objRef = objRef[t];
								}
								// Finally set the value that was updated
								objRef[keychain[lastKey]] = value;
								handlesharelistupdate();
							}
						});
						
						// Listen for key removals --- currently only used for bumps
						shareListKey.on('remove', {
							local: true, // listen to local events
							bubble: true, // bubble events fired by all children of '/list', e.g. '/list/bar', '/list/bar/baz', etc.
							listener: function(value, context) {
								// Handle the specific key portion set in the context
								// NOTE: That this does not handle list itself being set - but list itself should never be set!!!
								var keychain = context.key.substr(1).split("/"),
									objRef = shareListObj,
									i = 1,
									lastKey = keychain.length - 1,
									t;
								// Loop through our local structure to look for the last branch while returning early if the parent doesn't exist
								for (; i < lastKey; i++) {
									t = keychain[i];
									if (!objRef[t]) {
										// Return early - because the parent doesn't exist
										return;
									} else
										objRef = objRef[t];
								}
								// Finally delete the key that was removed
								delete objRef[keychain[lastKey]];
								handlesharelistupdate();
							}
						});
					});
				});
			});
		});
	});
});

window.toggleBottomPane = function() {
	var $bottomPane = $('#bottompane'),
		$centerPane = $('#centerpane');
	if ($bottomPane.css('bottom') == '0px') {
		$bottomPane.animate({bottom: "-210px"}, 200);
		$centerPane.animate({bottom: "40px"}, 200);
	} else {
		$bottomPane.animate({bottom: "0px"}, 200);
		$centerPane.animate({bottom: "250px"}, 200);
	}
	return false;
};

function gettimestamp(date) {
    var hours = date.getHours(),
		minutes = date.getMinutes(),
		seconds = date.getSeconds();

	if (hours < 10) {
        hours = "0" + minutes;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours.toString() + ":" + minutes + ":" + seconds + " ";
}

function handlechatmessage(messageobj, userId) {
	userColors.get(userId, function(err, color) {
		if (err) {
			handlechaterror(err, "Error getting chat color");
			return;
		}
		var $messagelog = $('#chatwindow'),
			date = new Date(messageobj.dt || +new Date),
			$lineEl = $('<div />'),
			$msgEl = $('<span class="chattext" />');
		$msgEl.text(gettimestamp(date) + " - " + messageobj.msg);
		$lineEl.prepend('<span class="chatuser" style="background-color: ' + color + ';"></span>');
		$lineEl.append($msgEl);
		$messagelog.append($lineEl);
		$messagelog.scrollTop($messagelog[0].scrollHeight);
	});
}

function handlechaterror(err, words) {
	var $messagelog = $('#chatwindow'),
		date = new Date(),
		$errEl = $('<div class="alert alert-error" />');
	$errEl.text(date.toString() + " - " + (words || "Error sending your message") + ": " + err.toString());
	$messagelog.append($errEl);
	// Go to the bottom of the chat log
	$messagelog.scrollTop($messagelog[0].scrollHeight);
}

function handlesharelistupdate() {
	var $shareList = $('#activesharespane'),
		shareFrame = $('#shareframe')[0],
		url = "http://www.youtube.com/embed/",
		shareListSorted = [], i, tHandler, topObj, shareKey, shareObj, $shareEl;
	
	// Clear the share list
	$shareList.children().remove();
	
	// Sort it
	for (shareKey in shareListObj) {
		shareObj = shareListObj[shareKey];
		// Only add stuff with vids, anything else shouldn't be there
		if (shareObj.vid) {
			// Attach the key temporarily for later lookups
			shareObj.key = shareKey;
			// Attach the bump count temporarily for later comparison
			shareObj.bumpCount = (shareObj.bumps && Object.keys(shareObj.bumps).length) || 0;
			// Push the object to be sorted
			shareListSorted.push(shareObj);
		}
	}
	shareListSorted.sort(function(a, b) {
		// Count the bumps each share object has, the one with the highest moves towards the top
		return a.bumpCount - b.bumpCount;
	});
	
	// Rebuild it
	i = shareListSorted.length;
	if (i)
		topObj = shareListSorted[i - 1];
	while (i--) {
		shareObj = shareListSorted[i];
		// Build the share element
		$shareEl = $('<div data-key="' + shareObj.key + '"><img src="http://i1.ytimg.com/vi/' + shareObj.vid + '/mqdefault.jpg" alt="' + shareObj.vid + '" style="border-color: ' + shareObj.color + ';" /><button class="btn"><i class="icon-white" /><span class="badge" style="background-color: ' + shareObj.color + ';"></span></button></div>');
		// Show the bump count
		$shareEl.find('span.badge').text(shareObj.bumpCount);
		// Declare a function in closure to trap the current share object
		tHandler = (function(shareObj) {
			return function() {
				// Toggle the bump based on our button state
				if ($(this).hasClass('btn-success')) {
					// Bump Up
					shareListKey.key(shareObj.key + '/bumps/' + user.id).set(true);
				} else {
					// Bump Down
					shareListKey.key(shareObj.key + '/bumps/' + user.id).remove();
				}
			};
		})(shareObj);
		// Setup the bump button
		if (shareObj.bumpCount > 0 && shareObj.bumps[user.id]) {
			// User has bumped this record
			$shareEl.children('button').addClass('btn-danger').click(tHandler).children('i').addClass('icon-thumbs-down');
		} else {
			// User has not bumped this record
			$shareEl.children('button').addClass('btn-success').click(tHandler).children('i').addClass('icon-thumbs-up');
		}
		// Finally append this to the list
		$shareList.append($shareEl);
	}
	
	// Set the iframe to be the top object if it has changed
	if (topObj) {
		url += topObj.vid + "?autoplay=1";
		(shareFrame.src !== url) && (shareFrame.src = url);
	} else
		shareFrame.src = "about:blank";
}

window.submiturl = function() {
	var $urlbox = $("#shareurl"),
		vid = $urlbox.val();
	if (vid) {
		// Clear the box
		$urlbox.val('');

		// Submit the video id, and set our color
		shareListKey.key(user.id + '/vid').set(vid);
		shareListKey.key(user.id + '/color').set(myColor);
		shareListKey.key(user.id + '/bumps/' + user.id).set(true);
		// TODO: Handle potential set key errors
	}
	return false;
};

window.sendchatmessage = function() {
	var $messagebox = $('#chatmessage'),
		message = $messagebox.val(),
		msgObj;
	//console.log(message);
	if (message) {
		// Clear the box
		$messagebox.val('');
		// Send the message
		msgObj = {
			dt: +new Date,
			msg: message
		};
		// Send the message to the channel
		chatChannel.message(msgObj, function(err) {
			if (err) {
				handlechaterror(err);
			} else {
				// Handle the message locally
				handlechatmessage(msgObj);
			}
		});
	}
	return false;
};

$(document).ready(function() {
	$('#chatmessage').keyup(function(e) {
		if (e.keyCode == 13){
			sendchatmessage();
			return false;
		}
	});
	$('#shareurl').keyup(function(e) {
		if (e.keyCode == 13){
			submiturl();
			return false;
		}
	});
});

})(window, jQuery);