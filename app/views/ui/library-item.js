/**
 * Project Touch
 *
 * @date: 6/18/13
 */

/*global define, window, document, $, requirejs, require  */

define(['backbone', 'underscore', "app/filters"], function (Backbone, _, Filter) {

    'use strict';

    return Backbone.View.extend({

        tagName: 'li',
        className: 'library-item',
        template: _.template('\
	            <h3><%= filename %></h3>\
	            <button class="play">Play</button>\
	            <button class="add">Add</button>\
	            <button class="edit">Edit</button>\
	      '),

        events: {
            'click .add': 'add',
            'click .play': 'play',
            'click .edit': 'edit'
        },

        initialize: function () {
            _.bindAll(this, 'addThumb');
            
            log('new library item:',this.options.model.get('file').name);
            
            this.options.model.on('change:thumb', this.addThumb, this);
        },

        render: function () {
            var templateResult = this.template({
                    filename: this.options.model.get('file')
                });

            this.$el.attr('data-id', this.options.model.cid);
            this.$el.html(templateResult);

            return this;
        },

        add: function () {
            this.options.model.collection.trigger('layer', this.options.model);
            var video = document.createElement('video');
            video.src = this.options.model.get('blob');

            var klass = this;
            $('#hiddenVideo').append(video);
            video.addEventListener('loadedmetadata', function(){
                klass.captureAsCanvas(video, { width: 280, height: 155, time: parseInt(video.duration/2) }, function (canvas) {
                    var src;
                    var ctx = canvas.getContext('2d');
                    var pixels = ctx.getImageData(0, 0, 280, 155);
                    $('#effects img').each(function(index, img){
                        var newPixels = Filter[img.getAttribute('data-effect')](pixels);
                        ctx.putImageData(newPixels, 0, 0);
                        src = canvas.toDataURL();
                        img.src = src;
                    });
                })
            }, false);

        },

        captureAsCanvas: function (video, options, handle) {

            // Create canvas and call handle function
            var callback = function () {
                // Create canvas
                var canvas = document.createElement('canvas');
                canvas.width = options.width;
                canvas.height = options.height;
                // Get context and draw screen on it
                canvas.getContext('2d').drawImage(video, 0, 0, options.width, options.height);
                // Seek video back if we have previous position
                if (prevPos) {
                    // Unbind seeked event - against loop
                    $(video).unbind('seeked');
                    // Seek video to previous position
                    video.currentTime = prevPos;
                }
                // Call handle function (because of event)
                handle.call(this, canvas);
            }

            // If we have time in options
            if (options.time && !isNaN(parseInt(options.time))) {
                // Save previous (current) video position
                var prevPos = video.currentTime;
                // Seek to any other time
                video.currentTime = options.time;
                // Wait for seeked event
                $(video).bind('seeked', callback);
                return;
            }

            // Otherwise callback with video context - just for compatibility with calling in the seeked event
            return callback.apply(video);
        },

        play: function () {
            log('play');
            var video = document.createElement('video');
            video.src = this.options.model.get('blob');

            this.$el.find('img')
                .after(video);

            video.play();
        },
        edit: function () {
            log('edit');
            $('#library').slideUp(500, function(){
                $('#edit').slideDown(500);
            });
        },

        addThumb: function () {
            var img = new Image();
            this.$el.prepend(img);
            img.src = this.options.model.get('thumb');
        }

    });

});
