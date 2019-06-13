import { Meteor } from 'meteor/meteor';
import { Files } from '../file-upload.js';
import {check} from 'meteor/check';

Files.denyClient();
Meteor.publish('files', function (profileId = null) {
    let query = {};
    if (profileId) {
        check(profileId, String);
        Object.assign(query, {'meta.profileId': profileId});
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
        Object.assign(query, {'meta.owner': this.userId});
    }
    return Files.find(query).cursor;
});

// Meteor.startup(function() {
//     Files._ensureIndex({'_id': 1, 'meta.profileId': 1, 'meta.owner': 1});
// });