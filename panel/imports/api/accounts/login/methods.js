import {ServerUtilities} from "/imports/startup/server/server-utilities";
import {Security} from "/imports/startup/server/security";
import {ServerErrorHandling} from "/imports/startup/server/server-error-handling";
import {ErrorEnum} from "../../../startup/both/error-enum";

Meteor.methods({
    'checkLoginData'(loginParameters) {
        let loginErrors = {};
        ServerErrorHandling.tryCatchHandler(Security.checkUsername, [loginParameters.username], loginErrors);
        if (!ServerUtilities.checkIfUsernameExistsInCollection(loginParameters.username))
            loginErrors[ErrorEnum.userNotFound.error] = ErrorEnum.userNotFound.reason;
        ServerErrorHandling.tryCatchHandler(Security.checkPassword, [loginParameters.password], loginErrors);
        ServerErrorHandling.throwExceptionIfErrorOccurred(loginErrors, 'loginErrors');

        ServerErrorHandling.tryCatchHandler(Security.checkIsAccountValidate, [loginParameters.username], loginErrors);
        ServerErrorHandling.throwExceptionIfErrorOccurred(loginErrors, 'loginErrors');
    },
    'resendVerificationEmail'(username) {
        let validationEmailErrors = {};
        ServerErrorHandling.tryCatchHandler(Security.checkUsername, [username], validationEmailErrors);
        ServerErrorHandling.throwExceptionIfErrorOccurred(validationEmailErrors, 'validationEmailErrors');

        let user = Accounts.findUserByUsername(username);
        if (ServerUtilities.isUndefined(user))
            throw new Meteor.Error(ErrorEnum.userNotFound);

        ServerErrorHandling.tryCatchHandler(Security.checkNumberOfValidationEmailSent, [user._id], validationEmailErrors);
        ServerErrorHandling.throwExceptionIfErrorOccurred(validationEmailErrors, 'validationEmailErrors');

        ServerUtilities.sendVerificationEmailAndUpdateCollection(user._id);
    },
});