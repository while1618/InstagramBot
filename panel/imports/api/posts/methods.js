import {Posts} from "./posts";
import {Security} from "../../startup/server/security";
import {ServerErrorHandling} from "../../startup/server/server-error-handling";
import {Profiles} from "../profiles/profiles";
import {check} from "meteor/check";
import {Files} from "../file-upload/file-upload";

Meteor.methods({
    'checkTimelinePost'(timelinePostData, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
        } catch (exception) {
            throw new Meteor.Error('sAlertError', exception.reason);
        }
        let checkTimelinePostErrors = {};
        ServerErrorHandling.tryCatchHandler(Security.isDateTime, [timelinePostData.whenToPost], checkTimelinePostErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkCaptionText, [timelinePostData.captionText], checkTimelinePostErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkFileType, [timelinePostData.filesTypes], checkTimelinePostErrors);
        ServerErrorHandling.throwExceptionIfErrorOccurred(checkTimelinePostErrors, 'panelErrors');
    },
    'checkStoryPost'(storyPostData, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
        } catch (exception) {
            throw new Meteor.Error('sAlertError', exception.reason);
        }
        let checkStoryPostErrors = {};
        ServerErrorHandling.tryCatchHandler(Security.isDateTime, [storyPostData.whenToPost], checkStoryPostErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkFileType, [storyPostData.filesTypes], checkStoryPostErrors);
        ServerErrorHandling.throwExceptionIfErrorOccurred(checkStoryPostErrors, 'panelErrors');
    },
    insertTimelinePost(timelinePostData, selectedProfile, fileIds) {
        try {
            let profile = Profiles.findOne({_id: selectedProfile}, {fields: {_id: 0, owner: 1}});
            Posts.insert({
                owner: profile.owner,
                profile: selectedProfile,
                createdAt: new Date(),
                postType: 'timelinePost',
                whenToPost: new Date(moment.utc(timelinePostData.whenToPost, 'DD.MM.YYYY. HH:mm').toISOString()),
                fileIds: fileIds,
                additionalPostData: {
                    captionText: timelinePostData.captionText
                }
            });
        } catch (exception) {
            throw new Meteor.Error('collectionError', exception);
        }
    },
    insertStoryPost(storyPostData, selectedProfile, fileId) {
        try {
            let profile = Profiles.findOne({_id: selectedProfile}, {fields: {_id: 0, owner: 1}});
            Posts.insert({
                owner: profile.owner,
                profile: selectedProfile,
                createdAt: new Date(),
                postType: 'storyPost',
                whenToPost: new Date(moment.utc(storyPostData.whenToPost, 'DD.MM.YYYY. HH:mm').toISOString()),
                fileIds: [fileId],
                additionalPostData: {

                }
            });
        } catch (exception) {
            throw new Meteor.Error('collectionError', exception);
        }
    },
    deletePost(postId, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            check(postId, String);
            let post = Posts.findOne({_id: postId}, {fields: {_id: 0, fileIds: 1}});
            Posts.remove(postId);
            for (let i = 0; i < post.fileIds.length; i++) {
                Files.remove({_id: post.fileIds[i]});
            }
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    }
});
