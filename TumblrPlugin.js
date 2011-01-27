/***
|''Name''|TumblrPlugin|
|''Version''|0.1.0|
|''Description''|Post a tiddler to tumblr|
|''Status''|unstable|
|''Source''||
|''CoreVersion''|2.6.1|
|''Requires''|TiddlyWeb|
!Usage
Call {{{<<tumblr email>>}}} inside a tiddler to generate a button to post that tiddler to tumblr.

email is the email address that you use to sign in to tumblr. Leave blank to take the text of the [[SiteEmail]] tiddler as your email address (this is probably the preferred method, as you can then keep your email address private).
!TODO
This plugin is still highly unfinished. Changes to be made include:
*Pull tumblr posts into your space
*Check that your post was successful (I told you it was unstable)
*Send properly wikified text (among the items that don't work are internal tiddly links and tables).
*Oh, also, binary tiddlers won't work either.
*And you can't post tiddlers quoted either
*But if you post a private tiddler t tumblr, it will post it in private (so that's good then!)
!Code
***/
//{{{
(function($) {
var tumblr = config.macros.tumblr = {};

tumblr.locale = {
	btnText: 'Post to tumblr.',
	btnTooltip: 'Post the contents of this tiddler to tumblr.'
};

tumblr.handler = function(place, macroName, params) {
	var tid = story.findContainingTiddler(place);
	var title = $(tid).attr('tiddler');
	var tiddler = store.getTiddler(title);

	createTiddlyButton(place, tumblr.locale.btnText, tumblr.locale.btnTooltip,
		function(e) {
			e.preventDefault();
			e.stopPropagation();
			tumblr.onClick(params, tiddler, this);
		});
};

tumblr.onClick = function(params, tiddler, place) {
	var tumblrParams = tumblr.gatherFields(params, tiddler);
	var $form = tumblr.createForm(tumblrParams);

	tumblr.submitForm($form, place);
};

tumblr.gatherFields = function(params, tiddler) {
	try {
		var email = (params[0]) ? params[0] :
			store.getTiddler('SiteEmail').text;
	} catch(e) {
		throw 'Email address not found';
	}

	var isPrivate = (/_private$/.test(tiddler.fields['server.bag'])) ?
		1 : 0;

	return {
		email: email,
		title: tiddler.title,
		body: wikifyStatic(tiddler.text),
		type: 'regular',
		generator: 'TiddlySpace',
		'private': isPrivate,
		tags: (tiddler.tags.length) ? '"%0"'.format([tiddler.tags.join('","')])
			: '',
		format: 'html',
		slug: tiddler.title,
		state: (tiddler.fields['publish.name']) ? 'draft' : 'published'
	};
};

tumblr.createForm = function(params) {
	var $form = $('<form action="http://www.tumblr.com/api/write"'
		+ 'method="POST" />').appendTo(document.body);

	$.each(params, function(name, content) {
		$('<input type="hidden" name="%0" />'.format([name]))
			.val(content).appendTo($form);
	});

	return $form;
};

tumblr.submitForm = function($form, place) {
	var getPassword = function(e) {
		var pwd = $pwd.find('input').val();
		$form.append($('<input type="hidden" name="password"/>').val(pwd));
		tumblr.prepareIframe($form);
		$form[0].submit();
		Popup.remove();
		return false;
	};
	var $pwd = $('<form class="tumblrPassword" />').
		submit(getPassword).
		append('Please enter your tumblr password: ').
		append('<input type="password" name="password" />');
	$pwd.find('input').bind('onenter', getPassword);

	var popup = Popup.create(place);
	var $popup = $(popup).addClass('tumblrSubmit');
	$popup.append($pwd);
	Popup.show();
	$('input[type=password]', $pwd).focus();
};

tumblr.prepareIframe = function($form) {
	var iframeName = Math.random();
	var $iframe = $('<iframe name="%0" />'.format([iframeName])).
		appendTo(document.body);

	$form.attr('target', iframeName);

	var onLoad = function() {
		tumblr.onIframeLoad.apply(tumblr, [$iframe, $form]);
	};

	$iframe[0].onload = onLoad;
	//IE
	completeReadyStateChanges = 0;
	$iframe[0].onreadystatechange = function() {
		if (++(completeReadyStateChanges) == 3) {
			onLoad();
		}
	};
};

tumblr.onIframeLoad = function($iframe, $form) {
	var title = $form.find('[name=title]:input').attr('name');

	displayMessage('Posted %0 to tumblr.'.format([title]));

	$form.remove();
	$iframe.remove();
};

})(jQuery)
//}}}

