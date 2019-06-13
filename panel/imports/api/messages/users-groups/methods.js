import {Security} from "../../../startup/server/security";
import {ServerUtilities} from "../../../startup/server/server-utilities";
import {Profiles} from "../../profiles/profiles";
import {check} from "meteor/check";
import {ErrorEnum} from "../../../startup/both/error-enum";

Meteor.methods({
    'checkUsername'(username, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            Security.checkUsername(username);
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'addUserGroup'(userGroupMembers, userGroupName, selectedProfile) {
        if (!ServerUtilities.isArray(userGroupMembers) || ServerUtilities.isArrayEmpty(userGroupMembers))
            throw new Meteor.Error('error', 'You did not add users to group');
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.checkUserGroupName(userGroupName, selectedProfile);
            for (let i = 0; i < userGroupMembers.length; i++) {
                Security.checkUsername(userGroupMembers[i]);
            }
            if (ServerUtilities.arrayHasDuplicates(userGroupMembers))
                throw ErrorEnum.userGroupMemberExists;
            if (userGroupMembers.length > 20)
                throw ErrorEnum.reachMaxUserGroupMembers;
            updateUserGroup(selectedProfile, userGroupName, userGroupMembers);
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'deleteUserGroup'(userGroupId, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            check(userGroupId, String);
            Profiles.update({_id: selectedProfile}, {$pull: {'messageData.usersGroups': {userGroupId: userGroupId}}});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    }
});

function updateUserGroup(selectedProfile, userGroupName, userGroupMembers) {
    Profiles.update(
        {_id: selectedProfile},
        {
            $push: {
                'messageData.usersGroups': {
                    userGroupId: new Mongo.ObjectID()._str,
                    userGroupName: userGroupName,
                    userGroupMembers: userGroupMembers
                }
            }
        }
    );
}