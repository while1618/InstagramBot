import {Security} from "/imports/startup/server/security";
import {ServerErrorHandling} from "/imports/startup/server/server-error-handling";

Meteor.methods({
    'checkResetPasswords'(password, repeatPassword) {
        let resetPasswordErrors = {};
        ServerErrorHandling.tryCatchHandler(Security.checkPasswords, [password, repeatPassword], resetPasswordErrors);

        ServerErrorHandling.throwExceptionIfErrorOccurred(resetPasswordErrors, 'resetPasswordErrors');
    },
});