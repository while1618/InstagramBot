import {Profiles} from "../../../../api/profiles/profiles";
import {Meteor} from "meteor/meteor";

import './config.css';
import './config.html';

Template.ConfigTemplate.onRendered(function () {
    this.$('#datetimepicker').datetimepicker({
        format: 'HH:mm',
        allowInputToggle: true,
        widgetPositioning: { vertical: 'auto' },
        useCurrent: false,
        showTodayButton: true
    });

    let routeName = 'config';
    $('.navigation').find('a').removeClass('active');
    $('.navigation').find(`[href='/${routeName}']`).addClass('active');
});

Template.ConfigTemplate.onCreated(function () {
    this.autorun(() => {
        if (!Session.get('selectedProfile')) {
            return;
        }

        this.subscribe('profiles', Session.get('selectedProfile'));
    });
});

Template.ConfigTemplate.helpers({
    config() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.config;
        }
    },
    botState() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.config.getFollowers.botState;
        }
    },
    likeState() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.config.getFollowers.like;
        }
    },
    allFollowingState() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.config.unfollow.allFollowing;
        }
    },
    whoDoNotFollowYouState() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.config.unfollow.whoDoNotFollowYou;
        }
    },
    parseWhenToStartBotTime(whenToStartBot) {
        return moment.utc(whenToStartBot, 'HH:mm').local().format('HH:mm');
    }
});

Template.ConfigTemplate.events({
    'click #saveWhenToStartBot'() {
        let time = document.getElementById('time').value;
        Meteor.call('changeWhenToStartBot', moment.utc(moment(time, 'HH:mm')).format('HH:mm'), Session.get('selectedProfile'), function (error) {
            if (error) {
                sAlert.error(error.reason);
            } else {
                document.getElementById('time').value = '';
                sAlert.success('When to start bot changed successfully');
            }
        });
    },
    'click #saveNumberOfDays'() {
        let days = document.getElementById('changeNumberOfDays').value;
        Meteor.call('changeNumberOfDays', days, Session.get('selectedProfile'), function (error) {
            if (error) {
                sAlert.error(error.reason);
            } else {
                document.getElementById('changeNumberOfDays').value = '';
                sAlert.success('Subscription extended successfully');
            }
        });
    },
    'click #botState'(event) {
        event.preventDefault();
        let checkboxState = document.getElementById('botState').checked;
        let message = '';
        let title = '';
        if (checkboxState) {
            message = 'Do you really want to start bot? This action will pause unfollow all or unfollow who do not follow you if running.';
            title = 'Start bot';
        } else {
            message = 'Do you really want to pause the bot?';
            title = 'Pause bot';
        }
        confirmModal(message, title, 'changeBotState', checkboxState);
    },
    'click #likeState'(event) {
        event.preventDefault();
        let checkboxState = document.getElementById('likeState').checked;
        let message = '';
        let title = '';
        if (checkboxState) {
            message = 'Do you really want to start liking?';
            title = 'Start liking';
        } else {
            message = 'Do you really want to pause liking?';
            title = 'Pause liking';
        }
        confirmModal(message, title, 'changeLikeState', checkboxState);
    },
    'click #allFollowingState'(event) {
        event.preventDefault();
        let checkboxState = document.getElementById('allFollowingState').checked;
        let message = '';
        let title = '';
        if (checkboxState) {
            message = 'Do you really want to start unfollow all following? This action will pause bot and unfollow who do not follow you if running.';
            title = 'Start unfollow all following';
        } else {
            message = 'Do you really want to pause unfollow all following?';
            title = 'Pause unfollow all following';
        }
        confirmModal(message, title, 'changeAllFollowingState', checkboxState);
    },
    'click #whoDoNotFollowYouState'(event) {
        event.preventDefault();
        let checkboxState = document.getElementById('whoDoNotFollowYouState').checked;
        let message = '';
        let title = '';
        if (checkboxState) {
            message = 'Do you really want to start unfollow who do no follow you? This action will pause bot and unfollow all if running.';
            title = 'Start unfollow who do no follow you';
        } else {
            message = 'Do you really want to pause unfollow who do no follow you?';
            title = 'Pause unfollow who do no follow you';
        }
        confirmModal(message, title, 'changeWhoDoNotFollowYouState', checkboxState);
    }
});

function confirmModal(message, title, meteorMethod, checkboxState) {
    new Confirmation({
        message: message,
        title: title,
        cancelText: 'No',
        okText: 'Yes',
        success: true, // whether the button should be green or red
        focus: 'cancel' // which button to autofocus, 'cancel' (default) or 'ok', or 'none'
    }, (result) => {
        if (result) {
            Meteor.call(meteorMethod, checkboxState, Session.get('selectedProfile'), function(error) {
                if (error)
                    sAlert.error(error.reason);
            });
        }
    });
}