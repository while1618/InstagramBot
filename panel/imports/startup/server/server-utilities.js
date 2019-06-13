import {Security} from "./security";

export const ServerUtilities = class {

    static isObjectEmpty(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    static isArrayEmpty(array) {
        return !(typeof array !== 'undefined' && array.length > 0);
    }

    static isNull(variable) {
        return variable === null;
    }

    static isUndefined(variable) {
        return variable === undefined;
    }

    static isEmptyString(variable) {
        return variable === '';
    }

    static invalidValueFacade(variable) {
        return this.isNull(variable) || this.isUndefined(variable) || this.isEmptyString(variable);
    }

    static checkIfEmailExistsInCollection(email) {
        try {
            Security.checkEmail(email);
        } catch (exception) {
            return false;
        }
        let user = Accounts.findUserByEmail(email);
        return !ServerUtilities.isUndefined(user);
    }

    static checkIfUsernameExistsInCollection(username) {
        try {
            Security.checkUsername(username);
        } catch (exception) {
            return false;
        }
        let user = Accounts.findUserByUsername(username);
        return !ServerUtilities.isUndefined(user);
    }

    static sendVerificationEmailAndUpdateCollection(userId) {
        Accounts.sendVerificationEmail(userId);
        Meteor.users.update(userId, {
            $inc: {"profile.numberOfValidationEmailsSent": 1}
        });
    }

    static randomToken() {
        return Math.random().toString(36).substr(2);
    }

    static generateToken() {
        return this.randomToken() + this.randomToken() + this.randomToken() + this.randomToken();
    }

    static isAdmin() {
        return Roles.userIsInRole(Meteor.userId(), 'admin');
    }

    static escapeShellArg(arg) {
        let ret = arg.replace(/[^\\]'/g, function (m, i, s) {
            return m.slice(0, 1) + '\\\''
        });

        return "'" + ret + "'"
    }

    static isStringExistsInArray(array, string) {
        return array.indexOf(string) !== -1;
    }

    static isString(string) {
        return typeof string === 'string' || string instanceof String;
    }

    static isArray(array) {
        return array instanceof Array;
    }

    static arrayHasDuplicates(array) {
        return (new Set(array)).size !== array.length;
    }

};