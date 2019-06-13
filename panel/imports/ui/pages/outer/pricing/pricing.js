import {Meteor} from "meteor/meteor";
import {ReactiveDict} from "meteor/reactive-dict";

import './pricing.css';
import './pricing.html';

Template.PricingTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
});

Template.PricingTemplate.helpers({
    loading() {
        return Template.instance().reactiveDict.get('loading');
    }
});

Template.PricingTemplate.events({
    'click #freeTrail'(event, instance) {
        event.preventDefault();
        instance.reactiveDict.set('loading', true);
        Meteor.call('addNewFreeTrailProfile', function (error) {
            if (error) {
                sAlert.error(error.reason);
                instance.reactiveDict.set('loading', false);
            } else {
                sAlert.success('Profile added. Check your email');
                instance.reactiveDict.set('loading', false);
            }
        });
    },
    'click #logout'(event) {
        event.preventDefault();
        Meteor.logout(function (error) {
            if (error) {
                console.log(error.reason);
            } else {
                FlowRouter.go('/');
                Session.clear();
            }
        })
    },
});
