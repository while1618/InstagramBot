import {Security} from "../../../startup/server/security";
import {Profiles} from "../../profiles/profiles";
import {ServerErrorHandling} from "../../../startup/server/server-error-handling";
import {Messages} from "../messages";
import {check} from "meteor/check";
import {Files} from "../../file-upload/file-upload";

Meteor.methods({
    'insertTextMessage'(textMessageData, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
        } catch (exception) {
            throw new Meteor.Error('sAlertError', exception.reason);
        }
        let insertTextMessageError = {};
        ServerErrorHandling.tryCatchHandler(Security.isDateTime, [textMessageData.whenToSendMessage], insertTextMessageError);
        ServerErrorHandling.tryCatchHandler(Security.checkMessage, [textMessageData.textMessage], insertTextMessageError);
        ServerErrorHandling.tryCatchHandler(Security.checkUserGroupId, [textMessageData.userGroup], insertTextMessageError);
        ServerErrorHandling.throwExceptionIfErrorOccurred(insertTextMessageError, 'panelErrors');

        try {
            insertTextMessage(textMessageData, selectedProfile);
        } catch (exception) {
            throw new Meteor.Error('collectionError', exception);
        }
    },
    'checkFileMessage'(fileMessageData, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
        } catch (exception) {
            throw new Meteor.Error('sAlertError', exception.reason);
        }
        let insertFileMessageError = {};
        ServerErrorHandling.tryCatchHandler(Security.isDateTime, [fileMessageData.whenToSendMessage], insertFileMessageError);
        ServerErrorHandling.tryCatchHandler(Security.checkFileType, [fileMessageData.filesTypes], insertFileMessageError);
        ServerErrorHandling.tryCatchHandler(Security.checkUserGroupId, [fileMessageData.userGroup], insertFileMessageError);
        ServerErrorHandling.throwExceptionIfErrorOccurred(insertFileMessageError, 'panelErrors');
    },
    insertFileMessage(fileMessageData, selectedProfile, fileId) {
        let profile = Profiles.findOne({_id: selectedProfile}, {fields: {_id: 0, owner: 1}});
        Messages.insert({
            owner: profile.owner,
            profile: selectedProfile,
            createdAt: new Date(),
            messageType: 'fileMessage',
            sendMessageTo: fileMessageData.userGroup,
            whenToSendMessage: new Date(moment.utc(fileMessageData.whenToSendMessage, 'DD.MM.YYYY. HH:mm').toISOString()),
            additionalMessageData: {
                file: fileId
            }
        });
    },
    deleteMessage(messageId, selectedProfile) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            check(messageId, String);
            let message = Messages.findOne({_id: messageId});
            if (message.messageType === 'fileMessage')
                Files.remove({_id: message.additionalMessageData.file});
            Messages.remove(messageId);
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    }
});

function insertTextMessage(textMessageData, selectedProfile) {
    try {
        let profile = Profiles.findOne({_id: selectedProfile}, {fields: {_id: 0, owner: 1}});
        Messages.insert({
            owner: profile.owner,
            profile: selectedProfile,
            createdAt: new Date(),
            messageType: 'textMessage',
            sendMessageTo: textMessageData.userGroup,
            whenToSendMessage: new Date(moment.utc(textMessageData.whenToSendMessage, 'DD.MM.YYYY. HH:mm').toISOString()),
            additionalMessageData: {
                textMessage: textMessageData.textMessage
            }
        });
    } catch (exception) {
        throw new Meteor.Error('collectionError', exception);
    }
}