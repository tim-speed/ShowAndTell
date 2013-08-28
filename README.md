Show and Tell
===========

A GoInstant application showcasing components and some more advanced things.


Instructions:
-------------
Host in the root of a domain - no sub directories!

Use a cool web browser that believes in progress, like Chrome or Firefox


Known issues and solutions:
-------------
For some reason the GoInstant user doesn't seem to always init on the first load, so you may have to refresh after the first load.

If you change your username it won't populate to other browser's user lists until they refresh. Was gonna write a hack to fix this... Maybe I will in the morning.

The typing indicator is more of a focus indicator but I chose to use it as a typing one anyway.


Features and how to use:
-------------

You can share a YouTube video by going to YouTube and grabbing the video id from the url or the share area.
Paste that in the url box near the middle of the Show and Tell interface and hit the enter key or click the submit url button.

The video at the top of the list is the one that will play.
You can bump a video up to the top by clicking the thumbs up button beside it.
The thumbs up button convert to thumbs down, allowing you to remove your bump if you would like to promote another video instead.
The number of bumps from all users is displayed below the bump button beside each video.
You can only have one video shared at a time. If you choose to share another, while yours is playing it will switch.

You can user the chat interface at the bottom of the screen to chat with other users in the session.
If you want it out of the way you can click the chat tab on the right.
When you are "typing" a chat message in the input box it will indicate this to all other users in the system.

You can click on your username in the user list at the top of the screen to change it.
The change is submitted on blur.


Where the magic happens:
-------------

Beyond the supporting libraries all the work is done in the following files:
index.html
js/app.js
css/app.css
