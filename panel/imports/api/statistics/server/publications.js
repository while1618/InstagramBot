import { Meteor } from "meteor/meteor";
import { Statistics } from '../statistics.js';
import {check} from "meteor/check";

Meteor.publish('statistics', function (profileId = null) {
    let query = {};
    if (profileId) {
        check(profileId, String);
        Object.assign(query, {'profile': profileId});
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
        Object.assign(query, {owner: this.userId});
    }
    return Statistics.find(query, {
        fields: {
            'statistics': 1
        }
    });
});

Meteor.startup(function() {
    Statistics._ensureIndex({'profile': 1, 'owner': 1, 'statistics.updatedAt': 1});
});
