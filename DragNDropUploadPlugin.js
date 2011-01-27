/***
|''Name''|DragNDropUploader|
|''Description''|Upload a file by dragging and dropping|
|''Author''|BenGillies|
|''Version''|0.1|
|''Status''|@@unstable@@|
|''Source''|<...>|
|''License''|[[BSD|http://www.opensource.org/licenses/bsd-license.php]]|
|''CoreVersion''|2.5|
!Notes
Only works with modern browsers. Only tested on Chrome.

With thanks to http://onehub.com/blog/posts/designing-an-html5-drag-drop-file-uploader-using-sinatra-and-jquery-part-1
!Code
***/
//{{{
(function($) {
var ns = config.extensions.tiddlyspace;
var dnd = config.macros.dndUpload = {
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		if (!readOnly) {
			dnd.refresh(place);
		}
	},
	refresh: function(place) {
		//create a div to upload to
		var $place = $(place).
			append('<div class="dndUpload">Drag a file onto me</div>');

		//override the drag events
		var $dragEl = $('.dndUpload', place).
			bind('dragenter', dnd.dragEnter).
			bind('dragover', dnd.dragOver).
			bind('drop', dnd.drop);
	},
	dragEnter: function(e) {
		e.stopPropagation();
		e.preventDefault();

		return false;
	},
	dragOver: function(e) {
		e.stopPropagation();
		e.preventDefault();

		return false;
	},
	drop: function(e) {
		e.stopPropagation();
		e.preventDefault();

		var files = e.originalEvent.dataTransfer.files;
		if (files.length > 0) {
			$.each(files, dnd.uploadFile);
		}

		return false;
	},
	uploadFile: function(index, file) {
		var space = ns.currentSpace.name;
		var host = config.defaultCustomFields["server.host"];
		var name = file.fileName;
		var url = "%0/bags/%1_private/tiddlers/%2".format([host, space, name]);

		var xhr = new XMLHttpRequest();
		var upload = xhr.upload;

		xhr.open("PUT", url, true);
		xhr.setRequestHeader('Content-Type', file.type);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status != 204) {
					errorFunction(xhr, "" + xhr.status, null);
				} else {
					successFunction(xhr.responseText, '204', xhr);
				}
			}
		};
		xhr.send(file);

		var errorFunction = function(xhr, txtStatus, exc) {
			displayMessage("There was an issue: %0".format([txtStatus]));
		};

		var successFunction = function(data, txtStatus, xhr) {
			context = {
				host: host,
				workspace: "bags/%0_private".format([space])
			};
			var adaptor = new config.adaptors.tiddlyweb();

			adaptor.getTiddler(name, context, null, function(context) {
				if (context.status) {
					var tiddler = context.tiddler;
					store.addTiddler(tiddler);
					story.displayTiddler(document.body, tiddler.title);
				} else {
					displayMessage('Image saved successfully, but there was a problem uploading it.');
				}
			});
		};

		upload.onprogress = function(xhrProgress) {
			var percentLoaded = Math.round((xhrProgress.loaded / xhrProgress.totalSize) * 100);
			displayMessage("Uploading %0: %1".format([name, percentLoaded]));
		};
	}
}
})(jQuery);
//}}}
