import {ReactiveDict} from "meteor/reactive-dict";

import './is-this-you.html';

Template.IsThisYouTemplate.onCreated(function() {
    this.reactiveDict = new ReactiveDict();
    this.reactiveDict.set('loading', true);
    Meteor.call('getInstagramBasicData', Session.get('instagramData'), (error, respond) => {
        if (error) {
            console.log(error);
            FlowRouter.go('/');
        } else {
            this.reactiveDict.set('loading', false);
            this.reactiveDict.set('username', respond.username);
            this.reactiveDict.set('profilePic', respond.profilePic);
        }
    });
});

Template.IsThisYouTemplate.helpers({
    loading() {
        return Template.instance().reactiveDict.get('loading');
    },
    username() {
        return Template.instance().reactiveDict.get('username');
    },
    profilePic() {
        return Template.instance().reactiveDict.get('profilePic');
    }
});

Template.IsThisYouTemplate.events({
    'click #no'() {
        Meteor.call('getToken', Session.get('instagramData'), function (error, respond) {
            if (error) {
                console.log(error);
            } else {
                FlowRouter.go('/instagram-login/' + respond);
            }
        });
    },
    'click #yes'(event, instance) {
        instance.reactiveDict.set('loading', true);
        Meteor.call('insertInstagramDataInDB', instance.reactiveDict.get('profilePic'), Session.get('instagramData'), function (error) {
            if (error) {
                instance.reactiveDict.set('loading', false);
                console.log(error);
            } else {
                instance.reactiveDict.set('loading', false);
                Session.clear('instagramData');
                Session.clear('checkApiPath');
                FlowRouter.go('/login');
            }
        });
    }
});
