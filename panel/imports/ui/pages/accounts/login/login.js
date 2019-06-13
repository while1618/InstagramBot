import {ReactiveDict} from "meteor/reactive-dict";
import ClientErrorHandling from "/imports/startup/client/client-error-handling";

import './login.html';
import './login.css';

Template.LoginTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
});

Template.LoginTemplate.helpers({
    errors() {
        return Template.instance().reactiveDict.get('errors');
    }
});

Template.LoginTemplate.events({
    'submit #loginForm'(event, instance) {
        event.preventDefault();
        let loginParameters = {};
        setLoginParameters(loginParameters, event);
        Meteor.call('checkLoginData', loginParameters, function (errors) {
            if (errors) {
                new ClientErrorHandling(errors, instance).handle();
            } else {
                loginUser(loginParameters, instance);
            }
        });
    },
    'click #resendValidationEmail'() {
        let username = document.getElementById('username').value;
        Meteor.call('resendVerificationEmail', username, function (error) {
            if (error)
                console.log(error.reason);
        });
    },
});

function setLoginParameters(loginParameters, event) {
    loginParameters.username = event.target.username.value;
    loginParameters.password = event.target.password.value;
}

function loginUser(loginParameters, instance) {
    Meteor.loginWithPassword(loginParameters.username, loginParameters.password, function (error) {
        if (error)
            instance.reactiveDict.set('errors', {passwordError: error.reason});
        else
            FlowRouter.go('/get-followers');
    });
}