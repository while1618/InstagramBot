import {ReactiveDict} from "meteor/reactive-dict";

import './challenge-required.html';

Template.ChallengeRequiredTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
});

Template.ChallengeRequiredTemplate.helpers({
    loading() {
        return Template.instance().reactiveDict.get('loading');
    }
});

Template.ChallengeRequiredTemplate.events({
    'submit #challengeRequiredForm'(event, instance) {
        event.preventDefault();
        instance.reactiveDict.set('loading', true);
        let code = event.target.instagramVerificationCode.value;
        Meteor.call('challengeRequired', code, Session.get('instagramData'), Session.get('checkApiPath'), function (error) {
            if (error) {
                console.log(error);
                instance.reactiveDict.set('loading', false);
            } else {
                FlowRouter.go('/is-this-you');
                instance.reactiveDict.set('loading', false);
            }
        })
    }
});