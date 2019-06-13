import {ReactiveDict} from "meteor/reactive-dict";
import ClientErrorHandling from "../../../../../startup/client/client-error-handling";
import {Files} from "../../../../../api/file-upload/file-upload";
import {Posts} from "../../../../../api/posts/posts";
import {Meteor} from "meteor/meteor";

import './story.html';

Template.StoryTemplate.onRendered(function () {
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

Template.StoryTemplate.onCreated(function () {
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

Template.StoryTemplate.helpers({
    posts() {
        if (Template.instance().subscriptionsReady())
            return Posts.find({profile: Session.get('selectedProfile'), postType: 'storyPost'}, {sort: {whenToPost: Template.instance().reactiveDict.get('timeFilter')}});
    },
    getFile() {
        if (Template.instance().subscriptionsReady())
            return Files.findOne({_id: this.fileIds[0]});
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

Template.StoryTemplate.events({
    'submit #storyForm'(event, instance) {
        event.preventDefault();
        let storyPostData = {};
        getStoryPostData(storyPostData);
        Meteor.call('checkStoryPost', storyPostData, Session.get('selectedProfile'), function (errors) {
            if (errors) {
                handleErrors(errors, instance);
            } else {
                uploadPost(storyPostData, instance);
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
    'click .custom-select-options'(event, instance) {
        event.preventDefault();
        let timeFilter = document.getElementById('timeFilter').value;
        if (timeFilter === 'firstToPost')
            instance.reactiveDict.set('timeFilter', 1);
        else
            instance.reactiveDict.set('timeFilter', -1);
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
    'click .story-filter-select .custom-select-value'(e) {
        let $this = $(e.currentTarget);

        $this.removeClass('error');
        $this.toggleClass('active');
        $('.story-filter-select .custom-select-options').toggleClass('active');
    },
    'click .story-filter-select .custom-select-options .option'(e) {
        let $this = $(e.currentTarget),
            value = $this.data('value'),
            name = $this.text(),
            customSelectValue = $('.story-filter-select .custom-select-value');

        $('.story-filter-select select').val(value);

        customSelectValue.addClass('active-value').find('.value').text(name);
        customSelectValue.trigger('click');
    }
});

function getStoryPostData(storyPostData) {
    let whenToPost = document.getElementById('whenToPost').value;
    storyPostData.whenToPost = moment.utc(moment(whenToPost, 'DD.MM.YYYY. HH:mm')).format('DD.MM.YYYY. HH:mm');
    storyPostData.files = {};
    storyPostData.filesTypes = {};
    let file = document.getElementById('fileInput').files[0];
    if (file) {
        storyPostData.files[0] = file;
        storyPostData.filesTypes[0] = file['type'];
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
    const upload = Files.insert({
        file: postData.files[0],
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
        } else {
            Meteor.call('insertStoryPost', postData, Session.get('selectedProfile'), fileObj._id, function (error) {
                if (error)
                    console.log(error);
                else
                    successStoryPost(instance);
            });
        }
        instance.currentUpload.set(false);
    });

    upload.start();
}

function successStoryPost(instance) {
    sAlert.success('Post added');
    instance.reactiveDict.set('errors', '');
    document.getElementById('whenToPost').value = '';
    document.getElementById('fileInput').value = '';
    $('#file-name').text('No file chosen');
}