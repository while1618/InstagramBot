import { Meteor } from "meteor/meteor";
import { Posts } from "../posts";
import {check} from "meteor/check";

Meteor.publish('posts', function (profileId) {
    check(profileId, String);
    let query = {profile: profileId};
    if (!Roles.userIsInRole(this.userId, 'admin')) {
        Object.assign(query, {owner: this.userId});
    }
    return Posts.find(query, {
        fields: {
            'profile': 1,
            'postType': 1,
            'whenToPost': 1,
            'fileIds': 1,
            'additionalPostData': 1
        }
    });
});

Meteor.startup(function() {
    Posts._ensureIndex({'_id': 1, 'profile': 1, 'owner': 1});
});

