/***
|TableViewPlugin||
|Version|0.6|
|Author|Ben Gillies|
|Type|plugin|
|Description|view tiddlers in a table suitable for copying into excel|
!Usage
Creates a table view where each row is a configurable list of tiddlers transposed into a single tiddler.

call with:

&lt;&lt;table filter:[filter[here]] heading:heading_name heading:heading_name heading:heading_name>>

filter:[filter[here]] is the filter you want to use to select tiddlers eg - [tag[company]] would use all tiddlers tagged company

heading:heading_name is a table heading. Note this must be the same as the tiddler name being used in that column.

eg:

&lt;&lt;table filter:[tag[company]] heading:title heading:description heading:status>>

Would create a table with all tiddlers tagged company. The first column is the tiddler title.
The second column comes from a separate tiddler of the form TiddlerName_description.
The third column comes from a separate tiddler of the form TiddlerName_status.

Whether separate tiddlers are pulled in or not is dng_name heading:heading_name heading:heading_name>>

filter:[filter[here]] is the filter you want to use to select tiddlers eg - [tag[company]] would use all tiddlers tagged company

heading:heading_name is a table heading. Note this must be the same as the tiddler name being used in that column.

eg:

&lt;&lt;table fi all columns

heading:matchPattern then specifies a name to strip from the end of each line, leaving just the column titles.

For example:

&lt;&lt;table filter:[tag[company]] columnTiddler:CompanyStructure heading:Section>>

would take each line from CompanyStructure, strip the word "Section" from the end, and use that as the column headings.

In this case, title is always used as the default first column.

!Code
***/
//{{{
	if(!version.extensions.TableViewPlugin)
	{ //# ensure that the plugin is only installed once
		version.extensions.TableViewPlugin = { installed: true }
	};

	config.macros.table ={
		handler: function(place, macroName, params, wikifier, paramString, tiddler){ 

			//parse the params into tableHeadings and excludeBags
			params = paramString.parseParams()[0];

			var tiddlers = store.filterTiddlers(params['filter']);
			var headings = params['heading'];
			var extension = params['extension'];
			if (extension) {
				extension = extension[0];
			}
			var taggedHeadings = params['tags'];
			if (taggedHeadings) {
				taggedHeadings = taggedHeadings[0].readBracketedList();
			}
			var imageURL = params['imageURL'];
			if (imageURL) {
				imageURL = imageURL[0];
			}
			var imageHeadings = params['images'];
			if (imageHeadings) {
				imageHeadings = imageHeadings[0].readBracketedList();
			}
			var columnTiddler = false;
			if ('columnTiddler' in params) {
				columnTiddler = store.getTiddler(params['columnTiddler']);
				var pattern = new RegExp(headings + '$');
				headings = columnTiddler.text.split('\n');
				for (var i=0; i<headings.length; i++) {
					headings[i] = headings[i].split(pattern)[0];
				}
			}

			//set up the table
			var table = jQuery('<table class="reportTable" />');
			jQuery('<div class="reportContainer" />').
				append(table).appendTo(place);

			//construct the table heading
			var tableHeading = jQuery('<tr />').appendTo(jQuery('<thead/>').appendTo(table));
			if (columnTiddler) {
				jQuery('<th />').text('title').appendTo(tableHeading);
			}
			for (var i=0; i<headings.length; i++) {
				jQuery('<th />').text(headings[i]).appendTo(tableHeading);
			}

			//construct the table body
			var tableBody = jQuery('<tbody />').appendTo(table);
			for (var i=0; i < tiddlers.length; i++) {
				var tiddler = tiddlers[i];
				var currentRow = jQuery('<tr />').appendTo(tableBody);
				if (columnTiddler) {
					var titlePlace = jQuery('<td />').appendTo(currentRow);
					createTiddlyLink(titlePlace[0], tiddler.title, true);
				}
				for (var j=0; j<headings.length; j++) {
					var heading = headings[j];
					var currentCell = jQuery('<td />').appendTo(currentRow);
					//get the value for this cell from a similarly named tiddler (eg - Foo_fieldName)
					var fetchValue = function() {
						if ((taggedHeadings) && (taggedHeadings.contains(heading))) {
							return (tiddler.tags.contains(heading)) ? "*" : "";
						} else if ((imageHeadings) && (imageHeadings.contains(heading))) {
							return '[img[%0/%1.%2]]'.format(imageURL, tiddler.title, extension);
						}
						var subTiddlerName = tiddler.title + '_' + heading;
						var cellTiddler = store.getTiddler(subTiddlerName);
						if (cellTiddler) {
							return cellTiddler.text;
						} else {
						   return '';
						}
					}
					if (heading === 'title') {
						createTiddlyLink(currentCell[0], tiddler.title, true);
					} else {
						var text = tiddler[heading] ||
							tiddler.fields[heading] ||
							store.getTiddlerSlice(tiddler.title, heading) ||
							store.getTiddlerText(tiddler.title +
								config.textPrimitives.sectionSeparator +
								heading) ||
							fetchValue();
						wikify(text, currentCell[0]);
					}
				}
			}
		}
	}
//}}}

