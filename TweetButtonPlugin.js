/***
|''Name''|TweetButtonPlugin|
|''Version''|0.1.0|
|''Description''|Tweet a tiddler to Twitter|
|''Status''|unstable|
|''Source''||
|''CoreVersion''|2.6.1|
|''Requires''|TiddlyWeb|
!Usage
Call the {{{<<tweetButton>>}}} macro without any parameters inside a tiddler
to generate a tweet button for that tiddler.

Call it outside a tiddler (or as {{{<<tweetButton space>>}}}, to generate a tweet button for that space.

Ideally, add it to your ViewTemplate, or PageTemplate somewhere.

<<tweetButton>>
!Code
***/
//{{{
(function($) {
var tweet = config.macros.tweetButton = {};

var tweetButton = '<a href="http://twitter.com/share"'
	+ 'class="twitter-share-button" data-url="%0" data-text="%1"'
	+ 'data-count="horizontal">Tweet</a><script type="text/javascript"'
	+ 'src="http://platform.twitter.com/widgets.js"></script>';

tweet.locale = {
	tweetTiddler: "%0 in %1 space #tiddlyspace",
	tweetSpace: "%0 space in #tiddlyspace"
};

tweet.handler = function(place, macroName, params) {
	var space = config.extensions.tiddlyspace.currentSpace.name;
	var tid = story.findContainingTiddler(place);
	var title = (params[0] === 'space') ? '' : $(tid).attr('tiddler') || '';
	var tweetContents = '';
	if (title) {
		tweetContents = tweet.locale.tweetTiddler.format([title, space]);
		title = "#" + encodeURIComponent(String.encodeTiddlyLink(title));
	} else {
		tweetContents = tweet.locale.tweetSpace.format([space]);
	}
	var url = "%0/%1".format([config.defaultCustomFields["server.host"],
		title]);

	$(place).append(tweetButton.format([url, tweetContents]));
};
})(jQuery);
//}}}

