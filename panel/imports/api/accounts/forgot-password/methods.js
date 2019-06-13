import {ServerUtilities} from "/imports/startup/server/server-utilities";
import {ServerErrorHandling} from "/imports/startup/server/server-error-handling";
import {ErrorEnum} from "../../../startup/both/error-enum";

Meteor.methods({
    'checkEmailForForgotPassword'(email) {
        let forgotPasswordErrors = {};
        if (!ServerUtilities.checkIfEmailExistsInCollection(email))
            forgotPasswordErrors.emailError = ErrorEnum.notExistsEmailError.reason;

        ServerErrorHandling.throwExceptionIfErrorOccurred(forgotPasswordErrors, 'forgotPasswordErrors');
    },
});



