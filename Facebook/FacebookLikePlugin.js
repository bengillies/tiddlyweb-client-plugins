/***
|''Name''|FaceBookLikePlugin|
|''Version''|0.1.0|
|''Description''|"Like a tiddler on Facebook|
|''Status''|unstable|
|''Source''||
|''CoreVersion''|2.6.1|
|''Requires''|TiddlyWeb|
!Usage
Call the {{{<<fbLike>>}}} macro without any parameters inside a tiddler
to generate a like button for that tiddler.

Call it outside a tiddler, to generate a like button for that space.

Ideally, add it to your ViewTemplate, or PageTemplate somewhere.
!Code
***/
//{{{
(function($) {
var fb = config.macros.fbLike = {};

var fbIframe = '<iframe src="http://www.facebook.com/widgets/like.php?href=%0"'
	+ 'scrolling="yes" frameborder="0" style="border:none;'
	+ 'width:450px; height:80px"></iframe>';

fb.handler = function(place) {
	var tid = story.findContainingTiddler(place);
	var title = $(tid).attr('tiddler') || '';
	var url = "%0/%1".format([config.defaultCustomFields["server.host"],
		title]);

	$(place).append(fbIframe.format([encodeURIComponent(url)]));
};
})(jQuery);
//}}}
