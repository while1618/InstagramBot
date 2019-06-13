import {Security} from "../../../startup/server/security";
import {Profiles} from "../../profiles/profiles";
import {check} from "meteor/check";

Meteor.methods({
    'changeWhenFollowedState'(state, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            Security.isBoolean(state);

            Profiles.update({_id: selectedProfile}, {$set: {'config.message.whenFollowed': state}});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'insertWhenFollowedMessage'(message, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.checkMessage(message);
            Profiles.update({_id: selectedProfile}, {
                $push: {
                    'messageData.whenFollowedMessages': {
                        whenFollowedMessageId: new Mongo.ObjectID()._str,
                        message: message,
                        pause: false
                    }
                }
            });
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'pauseWhenFollowedMessage'(messageId, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            check(messageId, String);
            Profiles.update({_id: selectedProfile, 'messageData.whenFollowedMessages.whenFollowedMessageId': messageId},
                {$set: {'messageData.whenFollowedMessages.$.pause': true}});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'unpauseWhenFollowedMessage'(messageId, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            check(messageId, String);
            Profiles.update({_id: selectedProfile, 'messageData.whenFollowedMessages.whenFollowedMessageId': messageId},
                {$set: {'messageData.whenFollowedMessages.$.pause': false}});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'deleteWhenFollowedMessage'(messageId, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            check(messageId, String);
            Profiles.update({_id: selectedProfile}, {$pull: {'messageData.whenFollowedMessages': {whenFollowedMessageId: messageId}}});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
});