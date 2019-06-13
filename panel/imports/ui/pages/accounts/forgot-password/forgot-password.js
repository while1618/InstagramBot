import {ReactiveDict} from "meteor/reactive-dict";
import ClientErrorHandling from "/imports/startup/client/client-error-handling";

import './forgot-password.html';

Template.ForgotPasswordTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
});

Template.ForgotPasswordTemplate.helpers({
    errors() {
        return Template.instance().reactiveDict.get('errors');
    }
});

Template.ForgotPasswordTemplate.events({
    'submit #forgotPasswordForm'(event, instance) {
        event.preventDefault();
        let email = event.target.email.value;
        Meteor.call('checkEmailForForgotPassword', email, function (errors) {
            if (errors) {
                new ClientErrorHandling(errors, instance).handle();
            } else {
                forgotPassword(email);
            }
        });
    }
});

function forgotPassword(email) {
    Accounts.forgotPassword({email}, function (error) {
        if (error)
            console.log(error);
    });
    sAlert.success('Please check your email to reset password');
}

Accounts.onResetPasswordLink(function (token, done) {
    Session.set('resetPasswordForm', true);
    FlowRouter.go('/reset-password/' + token);
});