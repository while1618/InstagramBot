import {ReactiveDict} from "meteor/reactive-dict";
import ClientErrorHandling from "../../../../startup/client/client-error-handling";

import './instagram-login.html';
import {ErrorEnum} from "../../../../startup/both/error-enum";

Template.InstagramLoginTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
});

Template.InstagramLoginTemplate.helpers({
    errors() {
        return Template.instance().reactiveDict.get('errors');
    },
    loading() {
        return Template.instance().reactiveDict.get('loading');
    }
});

Template.InstagramLoginTemplate.events({
    'submit #instagramLoginForm'(event, instance) {
        let customSelectValue = $('.sidenav-select').find('.custom-select-value');

        if (!customSelectValue.hasClass('active-value')) {
            customSelectValue.addClass('error');
            event.preventDefault();
            return false;
        }

        event.preventDefault();
        instance.reactiveDict.set('errors', '');
        instance.reactiveDict.set('loading', true);
        let instagramLoginParameters = {};
        setinstagramData(instagramLoginParameters, event);
        Meteor.call('checkAndCryptInstagramLoginParameters', instagramLoginParameters, function (errors, instagramData) {
            if (errors) {
                new ClientErrorHandling(errors, instance).handle();
                instance.reactiveDict.set('loading', false);
            } else {
                Session.set('instagramData', instagramData);
                Meteor.call('loginInstagram', instagramData, function (error, respond) {
                    if (error) {
                        if (error.reason.includes('username')) {
                            sAlert.error('Username does not exists');
                        } else if (error.reason.includes('password')) {
                            sAlert.error('Password is not correct');
                        } else if (error.reason === ErrorEnum.numberOfFollowersError.reason) {
                            sAlert.error(error.reason);
                        } else {
                            console.log(error);
                        }
                        instance.reactiveDict.set('loading', false);
                    } else {
                        instance.reactiveDict.set('loading', false);
                        if (respond.success) {
                            FlowRouter.go('/is-this-you');
                        } else if (respond.challengeRequired) {
                            Session.set('checkApiPath', respond.challengeRequired);
                            FlowRouter.go('/challenge-required');
                        } else {
                            console.log(respond);
                        }
                    }
                });
            }
        });
    },
    'click .sidenav-select .custom-select-value'(e) {
        let $this = $(e.currentTarget);

        $this.removeClass('error');
        $this.toggleClass('active');
        $('.sidenav-select .custom-select-options').toggleClass('active');
    },
    'click .sidenav-select .custom-select-options .option'(e) {
        let $this = $(e.currentTarget),
            value = $this.data('value'),
            name = $this.text(),
            customSelectValue = $('.sidenav-select .custom-select-value');

        $('.sidenav-select select').val(value);

        customSelectValue.addClass('active-value').find('.value').text(name);
        customSelectValue.trigger('click');
    },
});

function setinstagramData(instagramLoginParameters, event) {
    instagramLoginParameters.username = event.target.username.value;
    instagramLoginParameters.password = event.target.password.value;
    let howLongProfileExists = event.target.howLongProfileExists;
    instagramLoginParameters.howLongProfileExists = howLongProfileExists.options[howLongProfileExists.selectedIndex].value;
    instagramLoginParameters.token = FlowRouter.getParam('token');
}