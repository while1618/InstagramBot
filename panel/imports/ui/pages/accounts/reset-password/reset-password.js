import ClientErrorHandling from "/imports/startup/client/client-error-handling";
import {ReactiveDict} from "meteor/reactive-dict";

import './reset-password.html';

Template.ResetPasswordTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
});

Template.ResetPasswordTemplate.helpers({
    resetPasswordForm() {
        return Session.get('resetPasswordForm');
    },
    errors() {
        return Template.instance().reactiveDict.get('errors');
    }
});

Template.ResetPasswordTemplate.events({
    'submit #resetPasswordForm'(events, instance) {
        events.preventDefault();
        let password = events.target.password.value;
        let repeatPassword = events.target.repeatPassword.value;
        Meteor.call('checkResetPasswords', password, repeatPassword, function (errors) {
            if (errors) {
                new ClientErrorHandling(errors, instance).handle();
            } else {
                resetPassword(password);
            }
        })
    }
});

function resetPassword(password) {
    Accounts.resetPassword(FlowRouter.getParam('token'), password, function (error) {
        if (error)
            console.log(error);
        else
            FlowRouter.go('/login');
    });
}