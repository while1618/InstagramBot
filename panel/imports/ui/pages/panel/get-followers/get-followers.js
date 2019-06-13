import {Targets} from "/imports/api/get-followers/targets";
import {ErrorEnum} from "../../../../startup/both/error-enum";
import {ReactiveDict} from "meteor/reactive-dict";
import {Files} from "../../../../api/file-upload/file-upload";

import './get-followers.css';
import './get-followers.html';

Template.GetFollowersTemplate.onRendered(function () {
    let routeName = 'get-followers';
    $('.navigation').find('a').removeClass('active');
    $('.navigation').find(`[href='/${routeName}']`).addClass('active');
});

Template.GetFollowersTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
    this.autorun(() => {
        if (!Session.get('selectedProfile')) {
            return;
        }

        this.subscribe('targets', Session.get('selectedProfile'));
        this.subscribe('files', Session.get('selectedProfile'));
    });
});

Template.target.helpers({
    getFile() {
        if (Template.instance().subscriptionsReady())
            return Files.findOne({"meta.targetId": this._id});
    }
});

Template.GetFollowersTemplate.helpers({
    targets() {
        if (Template.instance().subscriptionsReady())
            return Targets.find({profile: Session.get('selectedProfile')});
    },
    loading() {
        return Template.instance().reactiveDict.get('loading');
    },
});

Template.GetFollowersTemplate.events({
    'submit #targetsForm'(event, instance) {
        event.preventDefault();
        instance.reactiveDict.set('loading', true);
        let targetUsername = event.target.targetUsername.value;
        let filters = getFilters();
        Meteor.call('addTarget', targetUsername, filters, Session.get('selectedProfile'), function (errors) {
            if (errors) {
                handleErrors(errors);
                instance.reactiveDict.set('loading', false);
            } else {
                event.target.targetUsername.value = '';
                instance.reactiveDict.set('loading', false);
            }
        })
    },
    'click #pause'() {
        Meteor.call('pauseTarget', this._id, Session.get('selectedProfile'), function (error) {
            if (error)
                sAlert.error(error.reason);
        })
    },
    'click #unpause'() {
        Meteor.call('unpauseTarget', this._id, Session.get('selectedProfile'), function (error) {
            if (error)
                sAlert.error(error.reason);
        })
    },
    'click #delete'() {
        new Confirmation({
            message: 'Do you really want to delete target?',
            title: 'Delete Target',
            cancelText: 'No',
            okText: 'Yes',
            success: true, // whether the button should be green or red
            focus: 'cancel' // which button to autofocus, 'cancel' (default) or 'ok', or 'none'
        }, (result) => {
            if (result) {
                Meteor.call('deleteTarget', this._id, Session.get('selectedProfile'), function(error) {
                    if (error)
                        sAlert.error(error.reason);
                });
            }
        });
    },
    'click'(e){
        let activeModal = $('.custom-target-modal.active');

        let inModal;
        inModal = $(e.currentTarget).parents('.custom-target-modal.active').length;

        if ( activeModal.length && !inModal) {
            activeModal.removeClass('active');
        }
    },
    'click #preview'(e) {
        $(e.currentTarget).parents('.target').prev('.custom-target-modal').addClass('active');
    },
    // 'change #businessAccounts'() {
    //     if (!document.getElementById('businessAccounts').checked && !document.getElementById('personalAccounts').checked)
    //         document.getElementById('personalAccounts').checked = true;
    // },
    // 'change #personalAccounts'() {
    //     if (!document.getElementById('businessAccounts').checked && !document.getElementById('personalAccounts').checked)
    //         document.getElementById('businessAccounts').checked = true;
    // },
    'change #privateAccounts'() {
        if (!document.getElementById('privateAccounts').checked && !document.getElementById('publicAccounts').checked)
            document.getElementById('publicAccounts').checked = true;
    },
    'change #publicAccounts'() {
        if (!document.getElementById('privateAccounts').checked && !document.getElementById('publicAccounts').checked)
            document.getElementById('privateAccounts').checked = true;
    }
});

function getFilters() {
    return {
        // 'businessAccounts': document.getElementById('businessAccounts').checked,
        // 'personalAccounts': document.getElementById('personalAccounts').checked,
        'privateAccounts': document.getElementById('privateAccounts').checked,
        'publicAccounts': document.getElementById('publicAccounts').checked,
    };
}

function handleErrors(errors) {
    if (errors.error === ErrorEnum.notLogged.error || errors.error === ErrorEnum.profileNotSelected.error || errors.error === ErrorEnum.validUsernameError.error || errors.error === 'invalidTargetError' || errors.error === 'privateTargetError' || errors.error === ErrorEnum.maxNumberOfTargetError.error || errors.error === ErrorEnum.profileExpired.error) {
        sAlert.error(errors.reason);
    } else {
        sAlert.error('Something went wrong! Try again later or contact admin.');
        console.log(errors);
    }
}
