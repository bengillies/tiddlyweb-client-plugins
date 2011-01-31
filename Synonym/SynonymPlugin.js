/***
|''Name''|SynonymPlugin|
|''Version''|0.1.0|
|''Author''|Ben Gillies|
|''Type''|plugin|
|''Description''|Lookup a synonym from a named space|
!Usage
&lt;&lt;lookupSynonym value spacename&gt;&gt;
value is the word to lookup
spacename is the space to lookup synonyms from.
expects tiddlers to be in lowercase with a synonym field

It is expected that the more usual behaviour will be to use the lookup() function directly
!Requires
TiddlySpace
!Code
***/
//{{{
(function($){

var syn = config.macros.lookupSynonym = {};

merge(syn, {
	defaultSpace: 'synonym',
	uri: '/bags/%0_public/tiddlers/%1'
});

syn.handler = function(place, macroName, params) {
	var lookupValue = params[0] || null;
	if (!lookupValue) return;
	var space = params[1] || syn.defaultSpace;
	var $place = $('<span class="synonym" />').appendTo(place);;
	syn.lookup(space, lookupValue.toLowerCase(), function(result) {
		var synonym = result.synonym;
		// there is also a result.changed value...
		$place.text(synonym);
	});
};

syn.lookup = function(space, lookupValue, callback) {
	ajaxReq({
		url: syn.uri.format(space, lookupValue),
		dataType: 'json',
		success: function(tiddler) {
			var synonym = tiddler.fields['synonym'] || tiddler.title;
			var isChanged;
			if ((tiddler.title === 'synonym')
					|| (tiddler.tags.contains('masterSynonym'))) {
				isChanged = false;
			}
			callback({
				synonym: synonym,
				changed: isChanged
			});
		},
		error: function(xhr) {
			callback({
				synonym: lookupValue,
				changed: false
			});
		}
	});
};

})(jQuery);
//}}}
