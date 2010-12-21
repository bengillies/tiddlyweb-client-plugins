/***
|Name|BookmarkletPlugin|
|Version|0.1|
|Author|Ben Gillies|
|Type|plugin|
|Description|Generate a bookmarklet that will pop up your TiddlyWiki inside a different web page|
!Usage
To generate the bookmarklet, use:

&lt;&lt;bookmarklet tiddler&gt;&gt;

where tiddler is the (optional) name of the tiddler you want to view.

It will generate a bookmarklet for you that will pop up whichever tiddler you specify from within whichever bag/recipe you call it from from any website.

It will load everything up using the BookmarkletTheme tiddler which has been designed to work in a small space (the side of your screen).

This plugin comprises 4 tiddlers. All of which should be accessible from the recipe/bag you load the bookmarklet in:
*bookmarklet.css (the CSS for the side bar that loads up when you click the bookmarklet)
*bookmarklet.js
*BookmarkletPlugin (this tiddler)
*BookmarkletTheme

Requires TiddlyWeb
!Code
***/
//{{{
if(!version.extensions.BookmarkletPlugin)
{ //# ensure that the plugin is only installed once
    version.extensions.BookmarkletPlugin = { installed: true }
};

config.macros.bookmarklet = {
    root: {},
	bookmarkletTemplate: '!URL\n{URL}\n\n!Description\n{Description}',
    handler: function(place, macroName, params, wikifier, paramString, tiddler){
        if (!config.defaultCustomFields)
            throw 'defaultCustomFields Not Found. This plugin requires TiddlyWeb to work.';
        var urlBase = config.defaultCustomFields['server.host'];
        urlBase += urlBase[urlBase.length - 1] !== '/' ? '/' : '';
        var path = escape(config.defaultCustomFields['server.workspace']);
        var siteTitle = document.title;
        var escapedSiteTitle = ',%22' + escape(siteTitle) + '%22';

        var tiddler = params.length > 0 ? ',%22' + escape(params[0]) + '%22' : ',null';

        var bookmarklet = 'javascript:(function(){'
            + 'var%20u=%22' + urlBase + '%22;var%20p=%22' + path + '%22;'
            + 'var%20s=document.createElement(%22script%22);'
            + 's.type=%22text/javascript%22;'
            + 's.src=u+p+%22/tiddlers/bookmarklet.js%22;'
            + 'document.body.appendChild(s);'
            + 'var%20lT=setInterval(function(){'
            + 'if(window.openTiddlyWiki){'
            + 'window.openTiddlyWiki(u,p' + tiddler + escapedSiteTitle + ');'
            + 'clearTimeout(lT);'
            + '}},100);})();';

        var link = jQuery('<a/>')
            .attr('href', bookmarklet)
            .text(siteTitle)
            .appendTo(place);
    },
    receiveMessageHandler: function(message) {
        var rootData = config.macros.bookmarklet.root;

        if (/^title:/.test(message.data)) {
            rootData.title = message.data.substr(6);
        } else if (/^desc:/.test(message.data)) {
            rootData.desc = message.data.substr(5);
        } else if (/^url:/.test(message.data)) {
            rootData.url = message.data.substr(4);
        }

        if ((rootData['desc']) && (rootData['title']) && (rootData['url'])) {
            //try and find the tiddler
            //If we got here via query string (aka - a lack of window.postMessage), the page won't have finished loading properly yet.
            //so we have to wait for a bit until we can call story.displayTiddler properly.
            if (!window.postMessage) {
                oldRestart = window.restart;
                window.restart = function() {
                    config.macros.bookmarklet.findTiddler(rootData);
                    oldRestart();
                    window.restart = oldRestart;
                };
            } else {
                config.macros.bookmarklet.findTiddler(rootData);
            }
        }
    },
    findTiddler: function(data) {
        var tiddler = store.getTiddler(data['title']);
        if (tiddler) {
            story.displayTiddler(document.body, tiddler.title, 2);
            return;
        }

        var tiddlers = store.search(data['url'], null, 'excludeSearch');
        if (tiddlers.length > 0) {
            story.search(data['url']);
            return;
        }
        //we haven't found it. So create a new one.
        tiddler = new Tiddler(data['title']);
        tiddler.tags = ['bookmark'];
        tiddler.text = config.macros.bookmarklet.bookmarkletTemplate
            .replace('{URL}', data['url'])
            .replace('{Description}', data['desc']);
        tiddler.fields = merge({}, config.defaultCustomFields);
        store.addTiddler(tiddler);
        story.displayTiddler(document.body, tiddler.title, 2);
    }
};

;

/********************************************/
/****Bookmarklet Theme and switching code****/
/********************************************/
(function() {
    if (window.self !== window.top) {
        config.options.txtTheme = 'BookmarkletTheme';
        var receiveMessage = config.macros.bookmarklet.receiveMessageHandler;
        if (!window.postMessage) {
            //the message will be coming through the query string #ie6 probably
            var queryObj = {};
            var data = (window.location.search[0] === '?') ? window.location.search.substr(1) : window.location.search;
            data = data.split('&');
            for (var i=0; i<data.length; i++) {
                var keyValPair = data[i].split('=');
                queryObj[keyValPair[0]] = decodeURIComponent(keyValPair[1]);
            }
            if (queryObj['bookmarkletParentURL']) {
                var message = {};
                message.data = 'url:' + queryObj['bookmarkletParentURL'];
                receiveMessage(message);
                if (queryObj['bookmarkletParentTitle']) {
                    message.data = 'title:' + queryObj['bookmarkletParentTitle'];
                    receiveMessage(message);
                }
                if (queryObj['bookmarkletParentDesc']) {
                    message.data = 'desc:' + queryObj['bookmarkletParentDesc'];
                    receiveMessage(message);
                }
            }
        } else {
            if (typeof window.addEventListener != 'undefined') {
                window.addEventListener('message', receiveMessage, false);
            } else if (type.attachEvent != 'undefined') {
                window.attachEvent('onmessage', receiveMessage);
            }
        }
    } else if (config.options.txtTheme == 'BookmarkletTheme') {
        config.options.txtTheme = '';
    }
})();
//}}}
