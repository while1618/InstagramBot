import {ServerUtilities} from "/imports/startup/server/server-utilities";
import {Security} from "/imports/startup/server/security";
import {ServerErrorHandling} from "/imports/startup/server/server-error-handling";
import {ErrorEnum} from "../../../startup/both/error-enum";

Meteor.methods({
    'signUp'(signUpParameters) {
        let signUpErrors = {};
        ServerErrorHandling.tryCatchHandler(Security.checkFirstName, [signUpParameters.firstName], signUpErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkLastName, [signUpParameters.lastName], signUpErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkUsername, [signUpParameters.username], signUpErrors);
        if (ServerUtilities.checkIfUsernameExistsInCollection(signUpParameters.username))
            signUpErrors.usernameError = ErrorEnum.existsUsernameError.reason;
        ServerErrorHandling.tryCatchHandler(Security.checkEmail, [signUpParameters.email], signUpErrors);
        if (ServerUtilities.checkIfEmailExistsInCollection(signUpParameters.email))
            signUpErrors.emailError = ErrorEnum.existsEmailError.reason;
        ServerErrorHandling.tryCatchHandler(Security.checkPhoneNumber, [signUpParameters.phoneNumber], signUpErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkPasswords, [signUpParameters.password, signUpParameters.repeatPassword], signUpErrors);

        ServerErrorHandling.throwExceptionIfErrorOccurred(signUpErrors, 'signUpErrors');

        try {
            return createUser(signUpParameters);
        } catch (exception) {
            throw new Meteor.Error('createUserError', exception);
        }
    },
    'sendVerificationEmail'(userId) {
        let validationEmailErrors = {};
        ServerErrorHandling.tryCatchHandler(Security.checkUserId, [userId], validationEmailErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkNumberOfValidationEmailSent, [userId], validationEmailErrors);

        ServerErrorHandling.throwExceptionIfErrorOccurred(validationEmailErrors, 'validationEmailErrors');

        ServerUtilities.sendVerificationEmailAndUpdateCollection(userId);
    },
});

function createUser(signUpParameters) {
    let userId = Accounts.createUser({
        username: signUpParameters.username,
        email: signUpParameters.email,
        password: signUpParameters.password,
        profile: {
            firstName: signUpParameters.firstName,
            lastName: signUpParameters.lastName,
            phoneNumber: signUpParameters.phoneNumber,
            numberOfValidationEmailsSent: 0,
            darkTheme: false
        }
    });
    addRoles(userId);

    return userId;
}

function addRoles(userId) {
    Roles.addUsersToRoles(userId, 'normal-user');
}