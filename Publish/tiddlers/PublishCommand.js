/***
|Name|PublishCommand|
|Version|0.2|
|Author|BenGillies|
|Description|Publish a tiddler by moving or copying it from one bag to another|
!Usage
Add {{{publishtiddler}}} to your ToolbarCommands tiddler.

You can override the default bag to publish to, and the default publishing mechanism in the PublishConfig shadow tiddler.

You can also override the defaults by setting the appropriate fields on the tiddler. These are the same as the options in PublishConfig.

Options for publishlevel are:
*copy
*move
!Requires
TiddlyWeb - http://tiddlyweb.com
chrjs - http://github.com/tiddlyweb/chrjs/raw/master/main.js
***/
//{{{
config.shadowTiddlers['PublishConfig'] = '|publishtobag|common|\n|publishlevel|copy|';

config.commands.publishtiddler = {
    text: "publish",
    tooltip: "publish this so everyone can see it",
    confirmMsg: "Are you sure you want to publish this?",
    saveFirstMsg: "Please save this first!",
    handler: function(event,src,title) {
        var t = store.getTiddler(title);
        if(!t){
            alert(this.saveFirstMsg);
        }
        if (!confirm(this.confirmMsg)) {
            return false;
        }
        function getPublishInfo(fieldName) {
            return (t.fields[fieldName]) ? t.fields[fieldName] : store.getTiddlerSlice('PublishConfig', fieldName);
        };
        var publishToBag = getPublishInfo('publishtobag');
        var publishLevel = getPublishInfo('publishlevel');

        if(publishLevel) {
            try {
                this.publish(t, publishLevel, publishToBag, function(successMessage) {
                    displayMessage(successMessage);
                }, function(errorMessage) {
                    displayMessage(errorMessage);
                });
            } catch(e) {
                displayMessage(e);
            }
        } else {
            alert("no publish level set!");
        }
    },
    publish: function(tid, publishLevel, publishToBag, callback, errBack) {
        var newTiddler = new tiddlyweb.Tiddler(tid.title, new tiddlyweb.Bag(publishToBag, config.defaultCustomFields['server.host']));
        newTiddler.tags = tid.tags;
        newTiddler.modified = tid.modified.convertToYYYYMMDDHHMM() + '00';
        newTiddler.created = tid.created.convertToYYYYMMDDHHMM() + '00';
        newTiddler.modifier = tid.modifier;
        newTiddler.fields = merge({}, tid.fields);
        newTiddler.text = tid.text;

        newTiddler.put(function() {
            if (publishLevel === 'copy') {
                callback(newTiddler.title + ' successfully copied to ' + newTiddler.bag.name + '.');
                return;
            } else if (publishLevel === 'move') {
                //delete the original tiddler
                if (tid.fields['server.bag']) {
                    newTiddler.bag = new tiddlyweb.Bag(tid.fields['server.bag'], config.defaultCustomFields['server.host']);
                } else {
                    var container = tid.fields['server.workspace'].split('/');
                    if (container === 'recipes') {
                        newTiddler.bag = null;
                        newTiddler.recipe = new tiddlyweb.Recipe(container[1], config.defaultCustomFields['server.host']);
                    } else {
                        newTiddler.bag = new tiddlyweb.Bag(container[1], config.defaultCustomFields['server.host']);
                    }
                }

                newTiddler['delete'](function() {
                    var containerName = newTiddler['bag'] ? newTiddler.bag.name : newTiddler.recipe.name;
                    callback(newTiddler.title + ' successfully moved to ' + publishToBag +  '.');
                    
                    newTiddler.bag = new tiddlyweb.Bag(publishToBag, config.defaultCustomFields['server.host']);
                    newTiddler.get(function(data) {
                        var newRevision = data.revision;
                        var newWorkspace = 'bags/' + publishToBag;
                        var newT = store.getTiddler(newTiddler.title);
                        var newFields = merge({}, newT.fields);

                        newFields['server.page.revision'] = newRevision;
                        newFields['server.workspace'] = newWorkspace;
                        newFields['server.bag'] = publishToBag;
                        delete newFields['server.recipe'];
                        newT.fields = merge({}, newFields);
                        var dirty = store.isDirty();

                        store.saveTiddler(newT.title, newT.title, newT.text, newT.modifier, newT.modified, newT.tags, newT.fields, true, newT.created, newT.creator);
                        story.setDirty(newT.title);
                        if (!dirty) store.setDirty(false);
                    });
                }, function() {
                    errBack('Error removing ' + newTiddler.title + ' from ' + containerName + '. It was successfully copied to ' + publishToBag + '.');
                });
            } else {
                errBack('Incorrect publish level set.');
            }
        }, function() {
            errBack('Error publishing ' + newTiddler.title + '.');
        });
    }
};
//}}}
