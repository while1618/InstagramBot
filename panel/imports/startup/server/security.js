import {check} from "meteor/check";
import {ServerUtilities} from "./server-utilities";
import {Profiles, TempProfiles} from "../../api/profiles/profiles";
import {ErrorEnum} from "../both/error-enum";
import {Targets} from "../../api/get-followers/targets";

export const Security = class {

    static cryptPassPhrase() {
        //TODO:
        return "your-password-for-AES";
    }

    static checkFirstName(firstName) {
        if (ServerUtilities.invalidValueFacade(firstName) || !/^[a-zA-Z]+$/.test(firstName))
            throw ErrorEnum.firstNameError;
        check(firstName, String);
    }

    static checkLastName(lastName) {
        if (ServerUtilities.invalidValueFacade(lastName) || !/^[a-zA-Z]+$/.test(lastName))
            throw ErrorEnum.lastNameError;
        check(lastName, String);
    }

    static checkUsername(username) {
        if (ServerUtilities.invalidValueFacade(username) || !/^[0-9a-zA-Z._@]+$/.test(username))
            throw ErrorEnum.validUsernameError;
        check(username, String);
    }

    static checkEmail(email) {
        if (ServerUtilities.invalidValueFacade(email) || !/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/.test(email))
            throw ErrorEnum.validEmailError;
        check(email, ValidEmail);
    }

    static checkPhoneNumber(phoneNumber) {
        if (ServerUtilities.invalidValueFacade(phoneNumber) || !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phoneNumber))
            throw ErrorEnum.phoneNumberError;
        check(phoneNumber, String);
    }

    static checkPasswords(password, repeatPassword) {
        if (ServerUtilities.invalidValueFacade(password) || ServerUtilities.invalidValueFacade(repeatPassword))
            throw ErrorEnum.validPassword;
        if (password !== repeatPassword)
            throw ErrorEnum.passwordMatch;
        check(password, String);
        check(repeatPassword, String);
    }

    static checkPassword(password) {
        if (ServerUtilities.invalidValueFacade(password))
            throw ErrorEnum.validPassword;
        check(password, String);
    }

    static checkUserId(userId) {
        check(userId, String);
        if (!Meteor.users.findOne({_id: userId}))
            throw ErrorEnum.userId;
    }

    static checkIsAccountValidate(username) {
        let user = Accounts.findUserByUsername(username);
        if (!user)
            throw ErrorEnum.userNotFound;
        if (!user.emails[0].verified)
            throw ErrorEnum.userNotValidatedError;
    }

    static checkNumberOfValidationEmailSent(userId) {
        let user = Meteor.users.findOne({_id: userId});
        if (user.profile.numberOfValidationEmailsSent > 3)
            throw ErrorEnum.numberOfValidationEmailSentError;
    }

    static checkNumber(number) {
        if (ServerUtilities.invalidValueFacade(number) || isNaN(number))
            throw ErrorEnum.numberError;
        check(parseFloat(number), Number);
    }

    static checkInstagramLoginToken(token) {
        let profile = Profiles.findOne({"tokenData.token": token});
        if (!profile)
            throw ErrorEnum.validInstagramTokenError;
        if (!profile.tokenData.valid)
            throw ErrorEnum.expiredInstagramTokenError;
    }

    static isLogged() {
        if (!Meteor.userId())
            throw ErrorEnum.notLogged;
    }

    static checkSelectedProfile(selectedProfile) {
        if (ServerUtilities.invalidValueFacade(selectedProfile))
            throw ErrorEnum.profileNotSelected;
        check(selectedProfile, String);
        this.isValidProfile(selectedProfile);
        this.isSelectedProfileBelongToLoggedUser(selectedProfile);
    }

    static isValidProfile(selectedProfile) {
        let profile = Profiles.findOne({_id: selectedProfile});
        if (!profile)
            throw ErrorEnum.notValidProfile;
    }

    static isSelectedProfileBelongToLoggedUser(selectedProfile) {
        if (!ServerUtilities.isAdmin()) {
            let profile = Profiles.findOne({_id: selectedProfile, owner: Meteor.userId()});
            if (!profile)
                throw ErrorEnum.notAuthorized;
        }
    }

    static instagramProfileAlreadyExists(username) {
        let profile = Profiles.findOne({'instagramData.instagramUsername': username});
        if (profile)
            throw ErrorEnum.instagramProfileAlreadyExistsError;
    }

    static freeTrailUsed(username) {
        let profile = TempProfiles.findOne({'username': username});
        if (profile)
            throw ErrorEnum.freeTrailError;
    }

    static checkDropdownValues(allowedDropdownValues, selectedValue) {
        if (!ServerUtilities.isStringExistsInArray(allowedDropdownValues, selectedValue))
            throw ErrorEnum.dropdownError;
    }

    static isAdmin() {
        if (!Roles.userIsInRole(Meteor.userId(), 'admin'))
            throw ErrorEnum.notAuthorized;
    }

    static isTime(time) {
        if (!moment(time, 'HH:mm').isValid())
            throw ErrorEnum.timeError;
    }

    static isBoolean(variable) {
        if (typeof variable !== "boolean")
            throw ErrorEnum.boolError;
        check(variable, Boolean);
    }

    static encrypt(data) {
        return CryptoJS.AES.encrypt(data, this.cryptPassPhrase()).toString();
    }

    static decrypt(data) {
        return CryptoJS.AES.decrypt(data, this.cryptPassPhrase()).toString(CryptoJS.enc.Utf8);
    }

    static checkIfPicPathIsFromInstagram(path) {
        if (!ServerUtilities.isString(path))
            throw ErrorEnum.instagramProfilePicError;
        check(path, String);
    }

    static checkUserGroupName(userGroupName, selectedProfile) {
        if (ServerUtilities.invalidValueFacade(userGroupName) || !/^[0-9a-zA-Z._@]+$/.test(userGroupName))
            throw ErrorEnum.userGroupNameError;
        check(userGroupName, String);
        let usersGroups = Profiles.findOne({_id: selectedProfile}).messageData.usersGroups;
        for (let i = 0; i < usersGroups.length; i++) {
            if (usersGroups[i].userGroupName === userGroupName)
                throw ErrorEnum.userGroupExists;
        }
    }

    static checkMessage(message) {
        if (ServerUtilities.invalidValueFacade(message) || !ServerUtilities.isString(message))
            throw ErrorEnum.messageError;
        if (message.length > 500)
            throw ErrorEnum.messageLenghtError;
        check(message, String);
    }

    static checkUserGroupId(userGroupId) {
        if (ServerUtilities.invalidValueFacade(userGroupId) || !ServerUtilities.isString(userGroupId))
            throw ErrorEnum.userGroupError;
        check(userGroupId, String);
        let profile = Profiles.findOne({'messageData.usersGroups.userGroupId': userGroupId});
        if (!profile)
            throw ErrorEnum.userGroupError;
    }

    static isDateTime(dateTime) {
        if (!moment(dateTime, 'DD.MM.YYYY. HH:mm').isValid())
            throw ErrorEnum.dateTimeError;
    }

    static isDate(date) {
        if (!moment(date, 'DD.MM.YYYY.').isValid())
            throw ErrorEnum.dateError;
    }

    static checkStatisticsType(selectedStatisticsType) {
        if (selectedStatisticsType !== 'day' && selectedStatisticsType !== 'week' && selectedStatisticsType !== 'month' && selectedStatisticsType !== 'year')
            throw ErrorEnum.selectedStatisticsTypeError;
    }

    static checkTimeZone(timeZone) {
        try {
            Intl.DateTimeFormat(undefined, {timeZone: timeZone});
        }  catch (ex) {
            throw ErrorEnum.timeZoneError;
        }
    }

    static checkCaptionText(captionText) {
        if (ServerUtilities.isEmptyString(captionText))
            return;
        if (ServerUtilities.invalidValueFacade(captionText) || !ServerUtilities.isString(captionText))
            throw ErrorEnum.captionTextError;
        if (captionText.length > 2200)
            throw ErrorEnum.captionTextLengthError;
        if ((captionText.split("#").length - 1) > 30)
            throw ErrorEnum.captionTextHashTagError;
        check(captionText, String);
    }

    static checkFileType(filesTypes) {
        if (!filesTypes)
            throw ErrorEnum.notValidFile;
        let validFileTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/avi', 'video/mov', 'video/flv', 'video/wmv'];
        for (let i = 0; i < filesTypes.length; i++) {
            if (!validFileTypes.includes(filesTypes[i]))
                throw ErrorEnum.notValidFile;
        }
    }

    static checkNumberOfTargets(profileId) {
        let numberOfTargets = Targets.find({profile: profileId}).count();
        if (numberOfTargets >= 20)
            throw ErrorEnum.maxNumberOfTargetError;
    }

    static isProfileExpired(profileId) {
        let profile = Profiles.findOne({_id: profileId, 'config.profile.numberOfDays': {$gt: 0}});
        if (!profile)
            throw ErrorEnum.profileExpired;
    }

    static checkPeriod(period) {
        if (period !== 30 && period !== 90 && period !== 180)
            throw ErrorEnum.periodError;
    }
};
