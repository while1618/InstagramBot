import {Meteor} from "meteor/meteor";
import {Profiles} from "../../../../../api/profiles/profiles";

import './when-followed-message.html';

Template.WhenFollowedTemplate.onRendered(function () {
    new MeteorEmoji();
    $('#message').siblings('div').css('width', '260px');

    let routeName = 'messages-menu/when-followed';
    $('.navigation').find('a').removeClass('active');
    $('.navigation').find(`[href='/${routeName}']`).addClass('active');

    $('.svg-icon, textarea img').each(function() {
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

Template.WhenFollowedTemplate.onCreated(function () {
    this.autorun(() => {
        if (!Session.get('selectedProfile')) {
            return;
        }

        this.subscribe('profiles', Session.get('selectedProfile'));
    });
});

Template.WhenFollowedTemplate.helpers({
    whenFollowedState() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.config.message.whenFollowed;
        }
    },
    whenFollowedMessages() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.messageData.whenFollowedMessages;
        }
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
    }
});

Template.WhenFollowedTemplate.events({
    'submit #whenFollowedMessageForm'(event) {
        event.preventDefault();
        let message = event.target.message.value;
        Meteor.call('insertWhenFollowedMessage', message, Session.get('selectedProfile'), function (error) {
            if (error) {
                sAlert.error(error.reason);
            } else {
                sAlert.success('Messages added');
                event.target.message.value = '';
            }
        })
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
                Meteor.call('deleteWhenFollowedMessage', this.whenFollowedMessageId, Session.get('selectedProfile'), function (error) {
                    if (error)
                        sAlert.error(error.reason);
                });
            }
        });
    },
    'click #whenFollowed'() {
        let checkboxState = document.getElementById('whenFollowed').checked;
        Meteor.call('changeWhenFollowedState', checkboxState, Session.get('selectedProfile'), function (error) {
            if (error) {
                console.log(error);
            } else {
                (checkboxState) ? sAlert.success('When followed enabled') : sAlert.error('When followed disabled');
            }
        });
    },
    'click #pause'() {
        Meteor.call('pauseWhenFollowedMessage', this.whenFollowedMessageId, Session.get('selectedProfile'), function (error) {
            if (error)
                sAlert.error(error.reason);
        })
    },
    'click #unpause'() {
        Meteor.call('unpauseWhenFollowedMessage', this.whenFollowedMessageId, Session.get('selectedProfile'), function (error) {
            if (error)
                sAlert.error(error.reason);
        })
    },
    'click'(e){
        let activeModal = $('.custom-when-followed-modal.active');

        let inModal;
        inModal = $(e.currentTarget).parents('.custom-when-followed-modal.active').length;

        if ( activeModal.length && !inModal) {
            activeModal.removeClass('active');
        }
    },
    'click #preview'(e) {
        $(e.currentTarget).parents('.message').next('.custom-when-followed-modal').addClass('active');
    },
    'click .close-modal'(e) {
        $(e.currentTarget).parents('.custom-when-followed-modal').removeClass('active');
    }
});