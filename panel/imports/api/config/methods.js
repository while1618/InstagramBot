import {Security} from "../../startup/server/security";
import {Profiles} from "../profiles/profiles";

Meteor.methods({
    'changeWhenToStartBot'(time, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            Security.isTime(time);

            Profiles.update({_id: selectedProfile}, {$set: {'config.getFollowers.whenToStartBot': time}});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'changeNumberOfDays'(days, selectedProfile) {
        try {
            Security.isLogged();
            Security.isAdmin();
            Security.checkSelectedProfile(selectedProfile);
            Security.checkNumber(days);

            Profiles.update({_id: selectedProfile}, {$set: {'config.profile.numberOfDays': parseInt(days)}});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'changeBotState'(state, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            Security.isBoolean(state);
            let setObject;
            if (state) {
                setObject = {
                    $set: {
                        "config.getFollowers.botState": state,
                        "config.unfollow.allFollowing": false,
                        "config.unfollow.whoDoNotFollowYou": false
                    }
                }
            } else {
                setObject = {$set: {"config.getFollowers.botState": state}}
            }
            Profiles.update(
                {
                    _id: selectedProfile
                },
                setObject
            );
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'changeLikeState'(state, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            Security.isBoolean(state);

            Profiles.update(
                {
                    _id: selectedProfile
                },
                {
                    $set: {
                        "config.getFollowers.like": state,
                    }
                }
            );
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'changeAllFollowingState'(state, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            Security.isBoolean(state);
            let setObject;
            if (state) {
                setObject = {
                    $set: {
                        "config.getFollowers.botState": false,
                        "config.unfollow.allFollowing": state,
                        "config.unfollow.whoDoNotFollowYou": false
                    }
                }
            } else {
                setObject = {$set: {"config.unfollow.allFollowing": state}}
            }
            Profiles.update(
                {
                    _id: selectedProfile
                },
                setObject
            );
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'changeWhoDoNotFollowYouState'(state, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            Security.isBoolean(state);
            let setObject;
            if (state) {
                setObject = {
                    $set: {
                        "config.getFollowers.botState": false,
                        "config.unfollow.allFollowing": false,
                        "config.unfollow.whoDoNotFollowYou": state
                    }
                }
            } else {
                setObject = {$set: {"config.unfollow.whoDoNotFollowYou": state}}
            }
            Profiles.update(
                {
                    _id: selectedProfile
                },
                setObject
            );
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    }
});
