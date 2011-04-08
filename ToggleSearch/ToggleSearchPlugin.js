/***
|''Description''|Provides a new search macro that combines the sidebar with serach functionality and can be toggled on and off|
!Code
***/
//{{{
(function($) {
//Create a button to toggle the search dropdown
var toggleSearch = config.macros.toggleSearch = {
	label: 'search',
	prompt: 'Search for a tiddler',
	defaultResults: 25
};


toggleSearch.handler = function(place, macroName, params) {
	var btnText = params[0] || this.label;
	var animate = (params[1] == 'true') ? true : false;
	var hideOnClickOff = (params[2] == 'true') ? true : false;
	var numResults = params[3] || this.defaultResults;
	$('#findTiddlersPane').data('animate', animate);
	//create a search button
	if (hideOnClickOff) {
		createTiddlyButton(place, btnText, this.prompt, this.onClick,
			'button toggleSearchButton');
	}

	//create a search box that appears when the button is clicked
	//only create if one doesn't already exist somewhere else
	var $searchBox = $('.toggleSearch:input');
	if ($searchBox.length == 0) {
		$searchBox = $(place).append($('<input type="text" ' +
			'class="toggleSearch" autocomplete="off" autocorrect="off" ' +
			'autocapitalize="off" />'));
	}
	$searchBox.keypress(function(ev) {
		if (ev.keyCode === 13) {
			toggleSearch.onSearch($(ev.target), true);
		}
	});

	var $searchOptions = $('.searchOptions');
	if ($searchOptions.length === 0) {
		$searchOptions = $('<div class="searchOptions" />').appendTo(place);
	}
	var $searchResults = $('.searchResults');
	if ($searchResults.length === 0) {
		$searchResults = $('<div class="searchResults" />').appendTo(place);
	}
	$searchResults.data('numResults', numResults);

	//create some dropdowns to filter and sort the search results
	//(requires a div with searchOptions class set)
	$searchOptions.html('')
		.append($('<select class="filters" />')
			.append('<option value="All" selected >All</option>')
			.append('<option value="Public">Public</option>')
			.append('<option value="Private">Private</option>')
			.append('<option value="Local">Local</option>')
			.append('<option value="Orphans">Orphans</option>')
			.append('<option value="Shadowed">Shadowed</option>')
			.change(function() {
				//automatically populate the results
				toggleSearch.onSearch($('.toggleSearch:input').first());
			})
		)
		.append($('<select class="sorting" />')
			.append('<option value="Relevant">Relevant</option>')
			.append('<option value="Recent" selected >Most Recent</option>')
			.append('<option value="Alphabetical">Alphabetical</option>')
			.append('<option value="Tags">Tags</option>')
			.append('<option value="Spaces">Spaces</option>')
			.change(function() {
				//automatically populate the results
				toggleSearch.onSearch($('.toggleSearch:input').first());
			})
		)
		.append($('<div class="searchAllContainer" />')
			.append($('<input type="checkbox" class="searchAll" />')
				.change(function() {
					//automatically populate the results
					toggleSearch.onSearch($('.toggleSearch:input').first());
				}))
			.append('<span class="searchAllText">Include all tiddlers</span>')
		);

	//make the search close if you click away from it
	if (hideOnClickOff) {
		$(document).bind('click dblclick', function(ev) {
			var $clicked = $(ev.target);
			var $searchPane = $('#findTiddlersPane');
			if ((($clicked.parents('#findTiddlersPane, .toggleSearchButton')
					.length === 0) &&
					($searchPane.hasClass('findingTiddlers')) &&
					(!$clicked.hasClass('toggleSearchButton')) &&
					(!$clicked.hasClass('toggleSearch'))) ||
					($clicked.hasClass('tiddlyLink'))) {
				toggleSearch.hideSearch($('#findTiddlersPane'));
			}
		});
	}

	//populate results by default if always visible
	if (!hideOnClickOff) {
		toggleSearch.onSearch($('.toggleSearch:input').first());
	}
};

toggleSearch.hideSearch = function($searchPane) {
	$searchPane.toggleClass('findingTiddlers');
	var completeHide = function() {
		$('#sidebarOptions').removeClass('showSearch');
		$('#sidebarShadow').removeClass('searchShadow');
	};
	if ($searchPane.data('animate') == true) {
		$searchPane.slideUp(600, completeHide);
	} else {
		completeHide();
	}
};

//searchText is an optional Override to trigger a search in code
toggleSearch.showSearch = function($searchPane, searchText) {
	//calculate the height (based on window height so can't do in css)
	var height = window.innerHeight - 72;
	$searchPane.height(height);
	var completeShow = function() {
		var $searchBox = $('.toggleSearch:input').first();
		if (searchText) {
			$searchBox.val(searchText);
		}
		$searchBox.focus().select();
		//automatically populate the results
		toggleSearch.onSearch($searchBox);
	};

	$('#sidebarOptions').addClass('showSearch')
		.find('.searchField:input').focus();
	$('#sidebarShadow').addClass('searchShadow');
	$searchPane.toggleClass('findingTiddlers');
	//slide Down
	if ($searchPane.data('animate') == true) {
		$searchPane.slideDown(600, completeShow);
	} else {
		completeShow();
	}
};

toggleSearch.onClick = function() {
	var $searchPane = $('#findTiddlersPane');
	if ($searchPane.hasClass('findingTiddlers')) {
		//slide Up
		toggleSearch.hideSearch($searchPane);
	} else {
		toggleSearch.showSearch($searchPane);
	}
};

toggleSearch.onSearch = function($searchBox, overrideLastSearch) {
	var searchText;
	//pre-populate the search box with the last search if it has been cleared
	if (overrideLastSearch) {
		searchText = $searchBox.val();
	} else {
		searchText = $searchBox.val() || $searchBox.data('lastSearch') || '';
	}
	if (searchText !== $searchBox.data('lastSearch')) {
		//we also want to set some defaults for sorting if its a new search
		var $sorting = $('.searchOptions .sorting');
		if ((searchText == '') && ($sorting.val() == 'Relevant')) {
			//they're search for everything, so change from relevant to recent
			$sorting.val('Recent');
		} else if ((searchText != '') && ($sorting.val() == 'Recent')) {
			$sorting.val('Relevant');
		}
	}
	toggleSearch.doSearch(searchText,
		$('.searchResults').first());
	$searchBox.val(searchText).data('lastSearch', searchText);
};

toggleSearch.doSearch =  function(text, $results) {
	//clear the results list
	$results.html('');
	var useCaseSensitive = config.options.chkCaseSensitiveSearch;
	var useRegExp = config.options.chkRegExpSearch;
	var regExpSearch = new RegExp(useRegExp ? text : text.escapeRegExp(),
		useCaseSensitive ? "mg" : "img");
	var excludeTags = ($('.searchAll:checked').val()) ? '' : 'excludeLists';
	var matches = store.search(regExpSearch, null, excludeTags);
	matches = toggleSearch.filterMatches(text, matches);

	var sortBy = $('.searchOptions .sorting').val() || 'Relevant';
	var sort = toggleSearch.sorting['sort%0'.format(sortBy)](matches);

	if (!sort.grouped) {
		var numResults = $results.data('numResults');
		var template = store.getTiddlerText('SidebarListTemplate');
		var $list = $('<ul class="searchResultsList" />').appendTo($results);
		$.each(sort.tiddlers, function(i, tiddler) {
			var $item = $('<li class="searchResult" />').appendTo($list);
			if (i > numResults) {
				toggleSearch.moreButton($list, $item, numResults,
					sort.tiddlers.slice(i), template, sort.render);
				return false;
			} else {
				sort.render($item[0], template, tiddler);
			}
		});
	} else {
		sort.render($results, sort.tiddlers);
		//add some classes
		$results.find('ul').addClass('searchResultsList')
			.find('li').addClass('searchResult')
			.find('a').addClass('listGroupTitle');
	}
};

toggleSearch.moreButton = function($list, $item, numResults, tiddlers,
		template, render) {
	createTiddlyButton($item[0], 'More', 'Show more results', function(e) {
		e.stopPropagation();
		$item.remove();
		$.each(tiddlers, function(i, tiddler) {
			var $listItem = $('<li class="searchResult" />').appendTo($list);
			if (i > numResults) {
				toggleSearch.moreButton($list, $listItem, numResults,
					tiddlers.slice(i), template, render);
				return false;
			} else {
				render($listItem[0], template, tiddler);
			}
		});
	}, 'moreBtn');
}

toggleSearch.filterMatches = function(text, matches) {
	var $filters = $('.searchOptions .filters');
	var filter = $filters.val() || 'All';

	//wrap the matches in a new TiddlyWiki() object for filtering
	var twMatches = new TiddlyWiki();
	$.each(matches, function(i, match) {
		twMatches.addTiddler(match);
	});

	var filteredTiddlers = toggleSearch.filters['filter%0'.format(filter)]
		(text, twMatches);

	return filteredTiddlers;
};

var endsWith = config.extensions.BinaryTiddlersPlugin.endsWith;
//filters: takes search text and TiddlyWiki object containing matches
//returns a list of tiddlers that match the filter
toggleSearch.filters = {
	filterAll: function(text, twMatches) {
		return twMatches.getTiddlers();
	},
	filterPrivate: function(text, twMatches) {
		var tiddlers = twMatches.getTiddlers();
		var results = [];
		$.each(tiddlers, function(i, tiddler) {
			if (endsWith(tiddler.fields['server.bag'], '_private')) {
				results.pushUnique(tiddler);
			}
		});
		return results;
	},
	filterPublic: function(text, twMatches) {
		var tiddlers = twMatches.getTiddlers();
		var results = [];
		$.each(tiddlers, function(i, tiddler) {
			if (endsWith(tiddler.fields['server.bag'], '_public')) {
				results.pushUnique(tiddler);
			}
		});
		return results;
	},
	filterLocal: function(text, twMatches) {
		var tiddlers = twMatches.getTiddlers();
		var space = config.extensions.tiddlyspace.currentSpace.name;
		var resulrs, function(i, tiddler) {
			var tiddlerSpace = config.exteSpaceName(tiddler.fields['server.bag']);
			if (space == tidd);
			}
		});
		return results;
	},
	filterOrphans: function(t= twMatches;
		var orphans = twMatches.getOrphans();
		var tid [];
		$.each(tiddlers, function(i, tiddler) {
			if (orphans.i== -1) {
				results.pushUnique(tiddler);
			}
		});

		return owed: function(text, twMatches) {
		var results = [];
		//we nell...
		$.each(config.shadowTiddlers, function(title, shadowTextle);
			var tidMatch = twMatches.getTiddler(title);
			if (tidatch);
				return true;
			} else if (!tid) {
				if ((title.seh.sorting = {
	sortRelevant: function(matches) {
		return {
			grouped: false,
			tiddlers: matches,
			render: function(place, template, tiddler) {
				wikify(template, place, null, tiddler);
			}
		};
	},
	sortRecent: function(matches) {
		return {
			grouped: false,
			tiddlers: matches.sort(function(a, b) {
				return (a.modified > b.modified) ? -1 :
					((a.modified == b.modified) ? 0 : 1);
			}),
			render: function(place, template, tiddler) {
				wikify(template, place, null, tiddler);
			}
		};
	},
	sortAlphabetical: function(matches) {
		return {
			grouped: false,
			tiddlers: matches.sort(function(a, b) {
				return (a.title < b.title) ? -1 :
					((a.title == b.title) ? 0 : 1);
			}),
			render: function(place, template, tiddler) {
				wikify(template, place, null, tiddler);
			}
		};
	},
	sortTags: function(matches) {
		var options = {
			field: 'tags',
			dateFormat: 'DD MMM YYYY',
			exclude: []
		};
		return {
			grouped: true,
			tiddlers: matches,
			render: function(place, tiddlers) {
				config.macros.groupBy._refresh(place, tiddlers, options);
			}
		};
	},
	sortSpaces: function(matches) {
		var options = {
			field: 'server.bag',
			dateFormat: 'DD MMM YYYY',
			exclude: []
		};
		return {
			grouped: true,
			tiddlers: matches,
			render: function(place, tiddlers) {
				config.macros.groupBy._refresh(place, tiddlers, options);
			}
		};
	}
};

config.shadowTiddlers.SidebarListTemplate =
	'{{spaceIcon{\n'
	+ '<<tiddlerOrigin label:no spaceLink:yes height:48 width:48 preserveAspectRatio:no>>\n'
	+ '}}}{{modifierIcon{\n'
	+ '<<view modifier SiteIcon spaceLink:yes width:36 height:36 label:no>>\n'
	+ '}}}{{listItemMain{\n'
	+ '{{titleLink{\n'
	+ '<<view title link>>}}}{{modifiedDate{\n'
	+ '<<view modified date>>}}}{{listItemTags{\n'
	+ '<<tags>>}}}}}}{{clearFloat{}}}';

})(jQuery);
//}}}

