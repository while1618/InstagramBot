import {ReactiveDict} from "meteor/reactive-dict";
import ClientErrorHandling from "/imports/startup/client/client-error-handling";

import './sign-up.html';

Template.SignUpTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
});

Accounts.onEmailVerificationLink(function (token, done) {
    Accounts.verifyEmail(token, function (error) {
        if (error)
            console.log(error);
        else
            done();
    });
});

Template.SignUpTemplate.helpers({
    errors() {
        return Template.instance().reactiveDict.get('errors');
    }
});

Template.SignUpTemplate.events({
    'submit #signUpForm'(event, instance) {
        event.preventDefault();
        let signUpParameters = {};
        setSignUpParameters(signUpParameters, event);
        Meteor.call('signUp', signUpParameters, function (errors, userId) {
            if (errors) {
                errorHandler(errors, instance)
            } else {
                successfulSignUp(userId, event, instance);
            }
        });
    }
});

function setSignUpParameters(signUpParameters, event) {
    signUpParameters.firstName = event.target.firstName.value;
    signUpParameters.lastName = event.target.lastName.value;
    signUpParameters.username = event.target.username.value;
    signUpParameters.email = event.target.email.value;
    signUpParameters.phoneNumber = event.target.phoneNumber.value;
    signUpParameters.password = event.target.password.value;
    signUpParameters.repeatPassword = event.target.repeatPassword.value;
}

function errorHandler(errors, instance) {
    if (errors.error === 'createUserError') {
        console.log(errors.reason);
    } else {
        new ClientErrorHandling(errors, instance).handle();
    }
}

function successfulSignUp(userId, event, instance) {
    instance.reactiveDict.set('errors', null);
    resetInputs(event);
    sAlert.success('Please check your email to verify your account', {onClose: function() {FlowRouter.go('/login');}});
    Meteor.call('sendVerificationEmail', userId, function (error) {
        if (error)
            console.log(error.reason);
    });
}

function resetInputs(event) {
    event.target.firstName.value = '';
    event.target.lastName.value = '';
    event.target.username.value = '';
    event.target.email.value = '';
    event.target.phoneNumber.value = '';
    event.target.password.value = '';
    event.target.repeatPassword.value = '';
}