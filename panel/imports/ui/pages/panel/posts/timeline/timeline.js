import {ReactiveDict} from "meteor/reactive-dict";
import ClientErrorHandling from "../../../../../startup/client/client-error-handling";
import {Files} from "../../../../../api/file-upload/file-upload";
import {Posts} from "../../../../../api/posts/posts";
import {Meteor} from "meteor/meteor";

import './timeline.html';

Template.TimelineTemplate.onRendered(function () {
    new MeteorEmoji();
    this.$('#datetimepicker').datetimepicker({
        format: 'DD.MM.YYYY. HH:mm',
        allowInputToggle: true,
        useCurrent: false,
        showTodayButton: true
    });
    $('#captionText').siblings('div').css('width', '260px');


    let routeName = 'posts-menu/timeline';
    $('.navigation').find('a').removeClass('active');
    $('.navigation').find(`[href='/${routeName}']`).addClass('active');

    $('.svg-icon').each(function() {
        let $img = jQuery(this);
        let imgID = $img.attr('id');
        let imgClass = $img.attr('class');
        let imgURL = $img.attr('src');

        jQuery.get(imgURL, function(data) {
            // Get the SVG tag, ignore the rest
            let $svg = jQuery(data).find('svg');

            // Add replaced image's ID to the new SVG
            if(typeof imgID !== 'undefined') {
                $svg = $svg.attr('id', imgID);
            }
            // Add replaced image's classes to the new SVG
            if(typeof imgClass !== 'undefined') {
                $svg = $svg.attr('class', imgClass+' replaced-svg');
            }

            // Remove any invalid XML tags as per http://validator.w3.org
            $svg = $svg.removeAttr('xmlns:a');

            // Replace image with new SVG
            $img.replaceWith($svg);

        }, 'xml');
    });
});

Template.TimelineTemplate.onCreated(function () {
    this.currentUpload = new ReactiveVar(false);
    this.reactiveDict = new ReactiveDict();
    this.reactiveDict.set('timeFilter', 1);
    this.autorun(() => {
        if (!Session.get('selectedProfile')) {
            return;
        }

        this.subscribe('profiles', Session.get('selectedProfile'));
        this.subscribe('files', Session.get('selectedProfile'));
        this.subscribe('posts', Session.get('selectedProfile'));
    });
});

Template.TimelineTemplate.helpers({
    posts() {
        if (Template.instance().subscriptionsReady())
            return Posts.find({profile: Session.get('selectedProfile'), postType: 'timelinePost'}, {sort: {whenToPost: Template.instance().reactiveDict.get('timeFilter')}});
    },
    getFile() {
        if (Template.instance().subscriptionsReady()) {
            return Files.findOne({_id: this.fileIds[0]});
        }
    },
    getFileModal() {
        if (Template.instance().subscriptionsReady()) {
            if (this.fileIds)
                return Files.find({_id: {$in: this.fileIds}});
        }
    },
    album() {
        if (Template.instance().subscriptionsReady()) {
            if (this.fileIds.length > 1)
                return true;
            return false;
        }
    },
    errors() {
        return Template.instance().reactiveDict.get('errors');
    },
    currentUpload() {
        return Template.instance().currentUpload.get();
    },
    parsePostDate() {
        return moment(this.whenToPost).format('DD.MM.YYYY');
    },
    parsePostTime() {
        return moment(this.whenToPost).format('HH:mm:ss');
    }
});

Template.TimelineTemplate.events({
    'submit #timelinePostForm'(event, instance) {
        event.preventDefault();
        let timelinePostData = {};
        getTimelinePostData(timelinePostData);
        Meteor.call('checkTimelinePost', timelinePostData, Session.get('selectedProfile'), function (errors) {
            if (errors) {
                handleErrors(errors, instance);
            } else {
                uploadPost(timelinePostData, instance);
            }
        });
    },
    'click #delete'() {
        new Confirmation({
            message: 'Do you really want to delete post?',
            title: 'Delete Post',
            cancelText: 'No',
            okText: 'Yes',
            success: true, // whether the button should be green or red
            focus: 'cancel' // which button to autofocus, 'cancel' (default) or 'ok', or 'none'
        }, (result) => {
            if (result) {
                Meteor.call('deletePost', this._id, Session.get('selectedProfile'), function (error) {
                    if (error)
                        sAlert.error(error.reason);
                });
            }
        });
    },
    'click .custom-select-options'(event, instance) {
        event.preventDefault();
        let timeFilter = document.getElementById('timeFilter').value;
        if (timeFilter === 'firstToPost')
            instance.reactiveDict.set('timeFilter', 1);
        else
            instance.reactiveDict.set('timeFilter', -1);
    },
    'click'(e) {
        let activeModal = $('.custom-post-modal.active'),
            $video = activeModal.find('video'),
            video = $video[0];

        let inModal;
        inModal = $(e.currentTarget).parents('.custom-post-modal.active').length;

        if ( activeModal.length && !inModal) {
            activeModal.removeClass('active');
            if ($video.length) {
                video.pause();
                video.currentTime = 0;
            }
        }
    },
    'click #preview'(e) {
        let button = $(e.currentTarget),
            postText = $('.custom-post-modal.post-text');

        let newPostText = $.trim(postText.text());
        postText.text('');
        postText.text(newPostText);

        button.parents('.post').next('.custom-post-modal').addClass('active');
    },
    'click .close-modal'(e){
        let $this = $(e.currentTarget),
            $video = $this.parents('.custom-post-modal').find('video'),
            video = $video[0];

        if ($video.length) {
            video.pause();
            video.currentTime = 0;
        }
        $this.parents('.custom-post-modal').removeClass('active');
    },
    'input #fileInput'(e) {
        let fullPath = e.target.value;

        if (fullPath.length) {
            let indexOfLastSlash = fullPath.lastIndexOf('\\') + 1;
            let fileName = fullPath.slice(indexOfLastSlash, fullPath.length);

            $('#file-name').text(fileName);
        } else {
            $('#file-name').text('No file chosen');
        }
    },
    'click .timeline-filter-select .custom-select-value'(e) {
        let $this = $(e.currentTarget);

        $this.removeClass('error');
        $this.toggleClass('active');
        $('.timeline-filter-select .custom-select-options').toggleClass('active');
    },
    'click .timeline-filter-select .custom-select-options .option'(e) {
        let $this = $(e.currentTarget),
            value = $this.data('value'),
            name = $this.text(),
            customSelectValue = $('.timeline-filter-select .custom-select-value');

        $('.timeline-filter-select select').val(value);

        customSelectValue.addClass('active-value').find('.value').text(name);
        customSelectValue.trigger('click');
    },
    'click .arrow'(e) {
        let $this = $(e.currentTarget),
            allImages = $('.custom-post-modal.active').find('.images img, .images video'),
            activeImage,
            images = $('.custom-post-modal.active').find('.images');

        if (images.hasClass('looping'))
            activeImage = allImages.filter('.active');
        else {
            activeImage = allImages.first();
            images.addClass('looping');
        }

        let loopConditionRight = $this.hasClass('right');
        
        if ((loopConditionRight ? activeImage.next().length : activeImage.prev().length) && !$this.hasClass('disabled')) {
            activeImage.removeClass('active');
            
            if (loopConditionRight) {
                $this.siblings('.arrow').removeClass('disabled');
                activeImage.next().addClass('active');

                if (!activeImage.next().next().length)
                    $this.addClass('disabled');
                else
                    $this.removeClass('disabled');
            } else {
                $this.siblings('.arrow').removeClass('disabled');
                activeImage.prev().addClass('active');

                if (!activeImage.prev().prev().length)
                    $this.addClass('disabled');
                else
                    $this.removeClass('disabled');
            }
        }
    }
});

function getTimelinePostData(timelinePostData) {
    let whenToPost = document.getElementById('whenToPost').value;
    timelinePostData.whenToPost = moment.utc(moment(whenToPost, 'DD.MM.YYYY. HH:mm')).format('DD.MM.YYYY. HH:mm');
    timelinePostData.captionText = document.getElementById('captionText').value;
    timelinePostData.files = {};
    timelinePostData.filesTypes = {};
    let fileInput = document.getElementById('fileInput').files;
    for (let i = 0; i < fileInput.length; i++) {
        if (fileInput[i]) {
            timelinePostData.files[i] = fileInput[i];
            timelinePostData.filesTypes[i] = fileInput[i]['type'];
        }
    }
}

function handleErrors(errors, instance) {
    if (errors.error === 'panelErrors') {
        new ClientErrorHandling(errors, instance).handle();
    } else if (errors.error === 'sAlertError') {
        sAlert.error(errors.reason);
    } else {
        console.log(errors);
    }
}

function uploadPost(postData, instance) {
    let fileIds = [];
    if (Object.keys(postData.files).length > 10) {
        sAlert.error('You can not upload more than 10 photos in one album');
    } else {
        uploadFiles(postData, instance, fileIds, () => {
            Meteor.call('insertTimelinePost', postData, Session.get('selectedProfile'), fileIds, function (error) {
                if (error)
                    console.log(error);
                else
                    successTimelinePost(instance);
            });
        });
    }
}


function uploadFiles(postData, instance, fileIds, _callback) {
    for (let i = 0; i < Object.keys(postData.files).length; i++) {
        const upload = Files.insert({
            file: postData.files[i],
            streams: 'dynamic',
            chunkSize: 'dynamic',
            meta: {
                profileId: Session.get('selectedProfile'),
                owner: Meteor.userId()
            }
        }, false);

        upload.on('start', function () {
            instance.currentUpload.set(this);
        });

        upload.on('end', function (error, fileObj) {
            if (error) {
                sAlert.error(error.reason);
                return;
            } else {
                fileIds.push(fileObj._id);
                if (fileIds.length === Object.keys(postData.files).length)
                    _callback();
            }
            instance.currentUpload.set(false);
        });

        upload.start();
    }
}

function successTimelinePost(instance) {
    sAlert.success('Post added');
    instance.reactiveDict.set('errors', '');
    document.getElementById('whenToPost').value = '';
    document.getElementById('captionText').value = '';
    document.getElementById('fileInput').value = '';
    $('#file-name').text('No file chosen');
}