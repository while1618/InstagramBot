import { Meteor } from "meteor/meteor";
import { Messages } from '../messages.js';
import {check} from "meteor/check";

Meteor.publish('messages', function (profileId) {
    check(profileId, String);
    let query = {profile: profileId};
    if (!Roles.userIsInRole(this.userId, 'admin')) {
        Object.assign(query, {owner: this.userId});
    }
    return Messages.find(query, {
        fields: {
            'profile': 1,
            'messageType': 1,
            'sendMessageTo': 1,
            'whenToSendMessage': 1,
            'additionalMessageData': 1
        }
    });
});

Meteor.startup(function() {
    Messages._ensureIndex({'_id': 1, 'profile': 1, 'owner': 1});
});

