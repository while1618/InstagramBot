import {ServerErrorHandling} from "../../startup/server/server-error-handling";
import {Security} from "../../startup/server/security";
import {Profiles} from "./profiles";
import {ServerUtilities} from "../../startup/server/server-utilities";
import {Email} from 'meteor/email';
import {ErrorEnum} from "../../startup/both/error-enum";

Meteor.methods({
    'addProfile'(addProfileParameters) {
        try {
            Security.isLogged();
            Security.isAdmin();
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }

        let addProfileErrors = {};
        ServerErrorHandling.tryCatchHandler(Security.checkUsername, [addProfileParameters.username], addProfileErrors);
        if (!ServerUtilities.checkIfUsernameExistsInCollection(addProfileParameters.username))
            addProfileErrors.usernameError = ErrorEnum.notExistsUsernameError.reason;
        ServerErrorHandling.tryCatchHandler(Security.checkNumber, [addProfileParameters.numberOfDays], addProfileErrors);

        ServerErrorHandling.throwExceptionIfErrorOccurred(addProfileErrors, 'addProfileErrors');

        try {
            addProfile(addProfileParameters);
        } catch (exception) {
            throw new Meteor.Error('addProfileError', exception);
        }
    }
});

function addProfile(addProfileParameters) {
    let token = ServerUtilities.generateToken();
    let user = Accounts.findUserByUsername(addProfileParameters.username);
    Profiles.insert({
        owner: user._id,
        createdAt: new Date(),
        tokenData: {
            token: token,
            valid: true
        },
        verifyData: {
            verify: false,
            verifiedAt: null
        },
        instagramData: {
            instagramUsername: null,
            instagramPassword: null,
            proxy: null,
            business: null
        },
        messageData: {
            whenFollowedMessages: [],
            usersGroups: []
        },
        config: {
            profile: {
                numberOfDays: parseInt(addProfileParameters.numberOfDays),
            },
            getFollowers: null,
            message: {
                whenFollowed: false,
                numberOfDailyMessages: 150,
                pauseBetweenMessages: 15
            },
            unfollow: {
                allFollowing: false,
                whoDoNotFollowYou: false,
                pauseBetweenUnfollow: 5,
                numberOfUnfollowPerHour: 40,
                numberOfUnfollowPerHourOffset: 5
            },
            post: {
                pauseBetweenPost: 120,
            }
        }
    });
    sendAddProfileEmail(user.emails[0].address, token);
}

function sendAddProfileEmail(email, token) {
    //TODO:
    let link = 'https://your-domain.com/instagram-login/' + token;
    let message = '<!doctype html>' +
        '<html lang="en">' +
        '<head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">' +
        '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
        '<title>Document</title>' +
        '</head>' +
        '<body>' +
        'Please login to your instagram account, by clicking this <a href=' + link + '>link</a>. Link will expired after 5 days.' +
        '</body>' +
        '</html>';
    //TODO:
    Email.send({to: email, from: 'office@your-domain.com', subject: 'Instagram Login', html: message});
}