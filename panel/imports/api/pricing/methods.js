import {Security} from "../../startup/server/security";
import {ServerUtilities} from "../../startup/server/server-utilities";
import {Profiles} from "../profiles/profiles";
import {Email} from "meteor/email";

Meteor.methods({
    'addNewFreeTrailProfile'() {
        try {
            Security.isLogged();
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }

        try {
            addProfile();
        } catch (exception) {
            throw new Meteor.Error('addProfileError', exception);
        }
    },
    'extendDays'(profileId, period) {
        try {
            Security.isLogged();
            Security.checkPeriod(period);
            Security.checkSelectedProfile(profileId);
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }

        //paypal
    }
});

function addProfile() {
    let token = ServerUtilities.generateToken();
    Profiles.insert({
        owner: Meteor.userId(),
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
                numberOfDays: 3,
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
    sendAddProfileEmail(Meteor.user().emails[0].address, token);
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