import { Meteor } from "meteor/meteor";
import { Targets } from '../targets.js';
import {check} from "meteor/check";

Meteor.publish('targets', function (profileId) {
    check(profileId, String);
    let query = {profile: profileId};
    if (!Roles.userIsInRole(this.userId, 'admin')) {
        Object.assign(query, {owner: this.userId});
    }
    return Targets.find(query, {
        fields: {
            'profile': 1,
            'verifyData.verify': 1,
            'targetUsername': 1,
            'filters': 1,
            'pause': 1,
            'metric': 1
        }
    });
});

Meteor.startup(function() {
    Targets._ensureIndex({'_id': 1, 'profile': 1, 'owner': 1, 'verifyData.verify': 1});
});