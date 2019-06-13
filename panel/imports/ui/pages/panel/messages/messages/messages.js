import {Profiles} from "../../../../../api/profiles/profiles";
import {ReactiveDict} from "meteor/reactive-dict";
import ClientErrorHandling from "../../../../../startup/client/client-error-handling";
import {Files} from "../../../../../api/file-upload/file-upload";
import {Messages} from "../../../../../api/messages/messages";
import {Meteor} from "meteor/meteor";

import './messages.html';

Template.MessagesTemplate.onRendered(function () {
    new MeteorEmoji();
    this.$('#datetimepicker').datetimepicker({
        format: 'DD.MM.YYYY. HH:mm',
        allowInputToggle: true,
        useCurrent: false,
        showTodayButton: true
    });
    $('#textMessage').siblings('div').css('width', '260px');

    let routeName = 'messages-menu/when-followed';
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

Template.MessagesTemplate.onCreated(function () {
    this.currentUpload = new ReactiveVar(false);
    this.reactiveDict = new ReactiveDict();
    this.reactiveDict.set('timeFilter', 1);
    this.reactiveDict.set('selectedMessageType', 'textMessageType');
    this.autorun(() => {
        if (!Session.get('selectedProfile')) {
            return;
        }

        this.subscribe('profiles', Session.get('selectedProfile'));
        this.subscribe('files', Session.get('selectedProfile'));
        this.subscribe('messages', Session.get('selectedProfile'));
    });
});

Template.MessagesTemplate.helpers({
    messages() {
        if (Template.instance().subscriptionsReady())
            return Messages.find({profile: Session.get('selectedProfile')}, {sort: {whenToSendMessage: Template.instance().reactiveDict.get('timeFilter')}});
    },
    getUserGroup() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile) {
                let usersGroups = profile.messageData.usersGroups;
                for (let i = 0; i < usersGroups.length; i++) {
                    if (usersGroups[i].userGroupId === this.sendMessageTo)
                        return usersGroups[i];
                }
            }
        }
    },
    getFile() {
        if (Template.instance().subscriptionsReady())
            return Files.findOne({_id: this.additionalMessageData.file});
    },
    selectedMessageType() {
        return Template.instance().reactiveDict.get('selectedMessageType');
    },
    usersGroups() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.messageData.usersGroups;
        }
    },
    errors() {
        return Template.instance().reactiveDict.get('errors');
    },
    currentUpload() {
        return Template.instance().currentUpload.get();
    },
    remainingDailyMessages() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.config.message.numberOfDailyMessages;
        }
    },
    remainingDailyMessagesPercentage() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile) {
                let messageNumber = profile.config.message.numberOfDailyMessages;
                return Math.ceil(messageNumber * 100 / 150);
            }
        }
    },
    parseMessageTime() {
        return moment(this.whenToSendMessage).format('DD.MM.YYYY HH:mm:ss');
    }
});

Template.MessagesTemplate.events({
    'submit #addMessagesForm'(event, instance) {

        let customSelectValue = $('.messages-group-select').find('.custom-select-value');

        if (!customSelectValue.hasClass('active-value')) {
            customSelectValue.addClass('error');
            event.preventDefault();
            return false;
        }

        event.preventDefault();
        let selectedMessageType = document.querySelector('input[name="messageType"]:checked').value;
        if (selectedMessageType === 'textMessageType') {
            textMessage(instance);
        } else if (selectedMessageType === 'fileMessageType'){
            fileMessage(instance);
        } else {
            sAlert.error('Unknown messages type');
        }
    },
    'change .messageType'(event, instance) {
        let selectedMessageType = document.querySelector('input[name="messageType"]:checked').value;
        instance.reactiveDict.set('selectedMessageType', selectedMessageType);
        instance.reactiveDict.set('errors', '');
        if (selectedMessageType === 'textMessageType') {
            document.getElementById('textMessage').parentNode.style = 'position: relative; display: block';
        } else {
            document.getElementById('textMessage').parentNode.style = 'position: relative; display: none';
        }
    },
    'click #delete'() {
        new Confirmation({
            message: 'Do you really want to delete messages?',
            title: 'Delete Messages',
            cancelText: 'No',
            okText: 'Yes',
            success: true, // whether the button should be green or red
            focus: 'cancel' // which button to autofocus, 'cancel' (default) or 'ok', or 'none'
        }, (result) => {
            if (result) {
                Meteor.call('deleteMessage', this._id, Session.get('selectedProfile'), function (error) {
                    if (error)
                        sAlert.error(error.reason);
                });
            }
        });
    },
    'click .custom-select-options'(event, instance) {
        event.preventDefault();
        let timeFilter = document.getElementById('timeFilter').value;
        if (timeFilter === 'firstToSend')
            instance.reactiveDict.set('timeFilter', 1);
        else
            instance.reactiveDict.set('timeFilter', -1);
    },
    'click'(e){
        let activeModal = $('.custom-message-modal.active'),
            $video = activeModal.find('video'),
            video = $video[0];

        let inModal;
        inModal = $(e.currentTarget).parents('.custom-message-modal.active').length;

        if ( activeModal.length && !inModal) {
            activeModal.removeClass('active');
            if ($video.length) {
                video.pause();
                video.currentTime = 0;
            }
        }
    },
    'click #preview'(e) {
        $(e.currentTarget).parents('.message').next('.custom-message-modal').addClass('active');
    },
    'click .close-modal'(e) {
        let $this = $(e.currentTarget),
            $video = $this.parents('.custom-message-modal').find('video'),
            video = $video[0];

        if ($video.length) {
            video.pause();
            video.currentTime = 0;
        }
        $this.parents('.custom-message-modal').removeClass('active');
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
    'click .messages-group-select .custom-select-value'(e) {
        let $this = $(e.currentTarget);

        $this.removeClass('error');
        $this.toggleClass('active');
        $('.messages-group-select .custom-select-options').toggleClass('active');
    },
    'click .messages-group-select .custom-select-options .option'(e) {
        let $this = $(e.currentTarget),
            value = $this.data('value'),
            name = $this.text(),
            customSelectValue = $('.messages-group-select .custom-select-value');

        $('.messages-group-select select').val(value);

        customSelectValue.addClass('active-value').find('.value').text(name);
        customSelectValue.trigger('click');
    },
    'click .messages-filter-select .custom-select-value'(e) {
        let $this = $(e.currentTarget);

        $this.removeClass('error');
        $this.toggleClass('active');
        $('.messages-filter-select .custom-select-options').toggleClass('active');
    },
    'click .messages-filter-select .custom-select-options .option'(e) {
        let $this = $(e.currentTarget),
            value = $this.data('value'),
            name = $this.text(),
            customSelectValue = $('.messages-filter-select .custom-select-value');

        $('.messages-filter-select select').val(value);

        customSelectValue.addClass('active-value').find('.value').text(name);
        customSelectValue.trigger('click');
    }
});

function textMessage(instance) {
    let textMessageData = {};
    getTextMessageData(textMessageData);
    Meteor.call('insertTextMessage', textMessageData, Session.get('selectedProfile'), function (errors) {
        if (errors) {
            handleErrors(errors, instance);
        } else {
            successTextMessage(instance);
        }
    });
}

function getTextMessageData(textMessageData) {
    let usersGroups = document.getElementById('usersGroups');
    let selectedIndex = usersGroups.options[usersGroups.selectedIndex];
    if (selectedIndex)
        textMessageData.userGroup = selectedIndex.value;
    let whenToSendMessage = document.getElementById('whenToSendMessage').value;
    textMessageData.whenToSendMessage = moment.utc(moment(whenToSendMessage, 'DD.MM.YYYY. HH:mm')).format('DD.MM.YYYY. HH:mm');
    textMessageData.textMessage = document.getElementById('textMessage').value;
}

function handleErrors(errors, instance) {
    if (errors.error === 'panelErrors') {
        new ClientErrorHandling(errors, instance).handle();
    } else if (errors.error === 'sAlertError') {
        sAlert.error(error.reason);
    } else {
        console.log(errors);
    }
}

function successTextMessage(instance) {
    sAlert.success('Messages added');
    instance.reactiveDict.set('errors', '');
    document.getElementById('whenToSendMessage').value = '';
    document.getElementById('textMessage').value = '';
}

function fileMessage(instance) {
    let fileMessageData = {};
    getFileMessageData(fileMessageData);
    Meteor.call('checkFileMessage', fileMessageData, Session.get('selectedProfile'), function (errors) {
        if (errors) {
            handleErrors(errors, instance);
        } else {
            uploadFileMessage(fileMessageData, instance);
        }
    });
}

function getFileMessageData(fileMessageData) {
    let usersGroups = document.getElementById('usersGroups');
    let selectedIndex = usersGroups.options[usersGroups.selectedIndex];
    if (selectedIndex)
        fileMessageData.userGroup = selectedIndex.value;
    let whenToSendMessage = document.getElementById('whenToSendMessage').value;
    fileMessageData.whenToSendMessage = moment.utc(moment(whenToSendMessage, 'DD.MM.YYYY. HH:mm')).format('DD.MM.YYYY. HH:mm');
    fileMessageData.files = {};
    fileMessageData.filesTypes = {};
    let file = document.getElementById('fileInput').files[0];
    if (file) {
        fileMessageData.files[0] = file;
        fileMessageData.filesTypes[0] = file['type'];
    }
}

function uploadFileMessage(fileMessageData, instance) {
    const upload = Files.insert({
        file: fileMessageData.files[0],
        streams: 'dynamic',
        chunkSize: 'dynamic',
        meta: {
            profileId: Session.get('selectedProfile'),
            owner: Meteor.userId(),
        }
    }, false);

    upload.on('start', function () {
        instance.currentUpload.set(this);
    });

    upload.on('end', function (error, fileObj) {
        if (error) {
            sAlert.error(error.reason);
        } else {
            Meteor.call('insertFileMessage', fileMessageData, Session.get('selectedProfile'), fileObj._id, function (error) {
                if (error)
                    console.log(error);
                else
                    successFileMessage(instance);
            })
        }
        instance.currentUpload.set(false);
    });

    upload.start();
}

function successFileMessage(instance) {
    sAlert.success('Messages added');
    instance.reactiveDict.set('errors', '');
    document.getElementById('whenToSendMessage').value = '';
    document.getElementById('fileInput').value = '';
    $('#file-name').text('No file chosen');
}