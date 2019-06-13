import {ReactiveDict} from "meteor/reactive-dict";
import {Profiles} from "../../../api/profiles/profiles";
import ClientErrorHandling from "../../../startup/client/client-error-handling";
import {Files} from "../../../api/file-upload/file-upload";

import './side-nav.html';
import './side-nav.css';
import {Meteor} from "meteor/meteor";

Template.SideNavTemplate.onRendered(function () {
    $(document).ready(function(){
        $("#search").on("keyup", function() {
            let value = $(this).val().toLowerCase();
            $(".profiles .profile").filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
            });
        });
    });
});

Template.SideNavTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
    this.autorun(() => {
        this.subscribe('profiles', function () {
            if (!Profiles.findOne({'verifyData.verify': true})) {
                sAlert.error('You have no profiles', {onClose: function() {FlowRouter.go('/pricing');}});
            } else {
                if (!Session.get('selectedProfile')) {
                    let profile = Profiles.findOne({'verifyData.verify': true});
                    Session.setAuth('selectedProfile', profile._id);
                }
            }
        });
        this.subscribe('files');
    });
});

Template.profile.helpers({
    daysColor(numberOfDays) {
        return numberOfDays >= 20 ? '#0B9D58' : (numberOfDays > 10 ? '#F3B41B' : '#DB5856');
    },
    isProfileSelected() {
        return this._id === Session.get('selectedProfile');
    },
    getFile() {
        if (Template.instance().subscriptionsReady())
            return Files.findOne({"meta.profileId": this._id});
    }
});

Template.SideNavTemplate.helpers({
    errors() {
        return Template.instance().reactiveDict.get('errors');
    },
    loading() {
        return Template.instance().reactiveDict.get('loading');
    },
    profiles() {
        if (Template.instance().subscriptionsReady())
            return Profiles.find({"verifyData.verify": true}, {sort: {createdAt: 1}});
    },
    extendDaysProfile() {
        if (Template.instance().subscriptionsReady())
            return Profiles.findOne({'_id': Session.get('extendDaysProfileId')});
    },
    extendDaysProfilePic() {
        if (Template.instance().subscriptionsReady())
            return Files.findOne({"meta.profileId": Session.get('extendDaysProfileId')});
    }
});

Template.SideNavTemplate.events({
    'submit #addProfileForm'(event, instance) {
        event.preventDefault();
        instance.reactiveDict.set('loading', true);
        if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
            adminNewProfile(event, instance);
        } else {
            clientNewProfile(instance);
        }
    },
    'click .profile'() {
        Session.setAuth('selectedProfile', this._id);
        FlowRouter.go('/get-followers');
    },
    'click #extendDays'(e) {
        e.stopPropagation();
        Session.set('extendDaysProfileId', this._id);
        $('.payment-modal').addClass('active');
    },
    'click .pay'(e) {
        let $this = $(e.target),
            packageChosen = parseInt($this.attr('data-package-time'));

        extendDays(packageChosen);
        $('.payment-modal').removeClass('active');
    },
    'click #close-payment-modal'() {
        $('.payment-modal').removeClass('active');
    },
    'click'(e) {
        let clickedElement = $(e.target);

        if (clickedElement.hasClass('payment-modal')) {
            $('.payment-modal').removeClass('active');
        }
    }
});

function adminNewProfile(event, instance) {
    let addProfileParameters = {};
    setAddProfileData(addProfileParameters, event);
    Meteor.call('addProfile', addProfileParameters, function (errors) {
        if (errors) {
            console.log(errors);
            new ClientErrorHandling(errors, instance).handle();
            instance.reactiveDict.set('loading', false);
        } else {
            instance.reactiveDict.set('errors', '');
            instance.reactiveDict.set('loading', false);
            removeInputs(event);
            sAlert.success('Profile added');
        }
    })
}

function setAddProfileData(addProfileParameters, event) {
    addProfileParameters.username = event.target.username.value;
    addProfileParameters.numberOfDays = event.target.numberOfDays.value;
}

function removeInputs(event) {
    event.target.username.value = '';
    event.target.numberOfDays.value = '';
}

function clientNewProfile(instance) {
    Meteor.call('addNewFreeTrailProfile', function (error) {
        if (error) {
            sAlert.error(error.reason);
            instance.reactiveDict.set('loading', false);
        } else {
            sAlert.success('Profile added. Check your email');
            instance.reactiveDict.set('loading', false);
        }
    });
}

function extendDays(numberOfDays) {
    Meteor.call('extendDays', Session.get('extendDaysProfileId'), numberOfDays, function (error) {
        if (error) {
            sAlert.error(error.reason);
        } else {
            sAlert.success('paypal');
        }
    });
}