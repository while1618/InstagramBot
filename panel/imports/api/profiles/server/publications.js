import { Meteor } from "meteor/meteor";
import { Profiles } from '../profiles.js';
import {check} from "meteor/check";

Meteor.publish('profiles', function (profileId = null) {
    let query = {};
    if (profileId) {
        check(profileId, String);
        Object.assign(query, {_id: profileId});
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
        Object.assign(query, {owner: this.userId});
    }

    return Profiles.find(query, {
        fields: {
            'verifyData.verify': 1,
            'createdAt': 1,
            'instagramData.instagramUsername': 1,
            'instagramData.initStatistics': 1,
            'messageData': 1,
            'config': 1
        }
    });
});

Meteor.startup(function() {
    Profiles._ensureIndex({'_id': 1, 'owner': 1, 'tokenData.token': 1, 'instagramData.instagramUsername': 1});
});
