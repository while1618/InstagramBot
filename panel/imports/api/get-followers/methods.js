import {Profiles} from "../profiles/profiles";
import {Security} from "../../startup/server/security"
import {Targets} from "./targets";
import {check} from "meteor/check";
import {ServerUtilities} from "../../startup/server/server-utilities";
import {Files} from "../file-upload/file-upload";

const {exec} = require('child_process');
let Future = Npm.require("fibers/future");

Meteor.methods({
    'addTarget'(targetUsername, filters, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            Security.checkUsername(targetUsername);
            // Security.isBoolean(filters.businessAccounts);
            // Security.isBoolean(filters.personalAccounts);
            Security.isBoolean(filters.privateAccounts);
            Security.isBoolean(filters.publicAccounts);
            Security.checkNumberOfTargets(selectedProfile);
            let profile = Profiles.findOne({_id: selectedProfile}, {fields : {_id: 0, instagramData: 1}});
            let future = new Future();
            exec('/usr/bin/php7.2 /var/InstagramBot/php-scripts-for-panel/validate-target.php ' + targetUsername + ' ' + profile.instagramData.instagramUsername + ' ' + ServerUtilities.escapeShellArg(Security.decrypt(profile.instagramData.instagramPassword)) + ' ' + profile.instagramData.proxy , function (err, stdout, stderr) {
                future.return(JSON.parse(stdout));
            });
            let respond = future.wait();

            if (respond.error) {
                throw new Meteor.Error('error', respond.error);
            } else if (respond.invalidTargetError) {
                throw new Meteor.Error('invalidTargetError', respond.invalidTargetError);
            } else if (respond.privateTargetError) {
                throw new Meteor.Error('privateTargetError', respond.privateTargetError);
            } else if (respond.followersLimitError) {
                throw new Meteor.Error('privateTargetError', respond.followersLimitError);
            }

            try {
                let targetId = insertTarget(targetUsername, filters, selectedProfile);
                saveTargetPic(respond.targetPic, targetId, selectedProfile);
            } catch (exception) {
                throw new Meteor.Error('error', exception);
            }
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'deleteTarget'(targetId, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            check(targetId, String);
            Targets.remove(targetId);
            Files.remove({"meta.targetId": targetId});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'pauseTarget'(targetId, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            check(targetId, String);
            Targets.update(targetId, {$set: {pause: true}});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    },
    'unpauseTarget'(targetId, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            check(targetId, String);
            Targets.update(targetId, {$set: {pause: false}});
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    }
});

function insertTarget(targetUsername, filters, selectedProfile) {
    let profile = Profiles.findOne({_id: selectedProfile}, {fields : {_id: 0, owner: 1}});
    return Targets.insert({
        owner: profile.owner,
        profile: selectedProfile,
        createdAt: new Date(),
        verifyData: {
            verify: false,
            verifiedAt: null
        },
        targetUsername: targetUsername,
        filters: filters,
        pause: false,
        profiles: [],
        metric: {
            coverage: '0 (0%)',
            successRate: '0 (0%)',
            unfollowRate: '0 (0%)',
            numberOfFollowers: 0,
            numberOfProfilesToFollow: 0,
            numberOfPrivateProfiles: 0,
            numberOfPublicProfiles: 0,
            // numberOfBusinessProfiles: 0,
            // numberOfPersonalProfiles: 0,
            numberOfSkippedProfiles: 0
        }
    });
}

function saveTargetPic(targetPic, targetId, selectedProfile) {
    let profile = Profiles.findOne({_id: selectedProfile}, {fields : {_id: 0, owner: 1}});
    Files.load(targetPic, {
        meta: {
            profileId: selectedProfile,
            targetId: targetId,
            owner: profile.owner
        }
    })
}