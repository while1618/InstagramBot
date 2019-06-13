import {ServerErrorHandling} from "../../startup/server/server-error-handling";
import {Security} from "../../startup/server/security";
import {Profiles, TempProfiles} from "../profiles/profiles";
import {ServerUtilities} from "../../startup/server/server-utilities";
import {Files} from "../file-upload/file-upload";
import {ErrorEnum} from "../../startup/both/error-enum";
import {Proxies} from "../proxy/proxy";
import {Email} from "meteor/email";

const {exec} = require('child_process');
let Future = Npm.require("fibers/future");

Meteor.methods({
    'checkAndCryptInstagramLoginParameters'(instagramLoginParameters) {
        let instagramLoginParametersErrors = {};
        let allowedDropdownValues = ['lessThanMonth', 'betweenOneAndThree', 'moreThenThree'];
        ServerErrorHandling.tryCatchHandler(Security.checkUsername, [instagramLoginParameters.username], instagramLoginParametersErrors);
        ServerErrorHandling.tryCatchHandler(Security.instagramProfileAlreadyExists, [instagramLoginParameters.username], instagramLoginParametersErrors);
        ServerErrorHandling.tryCatchHandler(Security.freeTrailUsed, [instagramLoginParameters.username], instagramLoginParametersErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkPassword, [instagramLoginParameters.password], instagramLoginParametersErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkInstagramLoginToken, [instagramLoginParameters.token], instagramLoginParametersErrors);
        ServerErrorHandling.tryCatchHandler(Security.checkDropdownValues,[allowedDropdownValues, instagramLoginParameters.howLongProfileExists], instagramLoginParametersErrors);
        let proxyObject = Proxies.findOne({numberOfUses: {$lt: 5}});
        if (!proxyObject) {
            instagramLoginParametersErrors.proxyError = ErrorEnum.proxyError.reason;
            sendEmailToAdmin();
        } else {
            instagramLoginParameters.proxy = proxyObject.proxy;
        }

        ServerErrorHandling.throwExceptionIfErrorOccurred(instagramLoginParametersErrors, 'instagramLoginParametersErrors');

        let instagramData = {
            username: instagramLoginParameters.username,
            password: instagramLoginParameters.password,
            token: instagramLoginParameters.token,
            proxy: instagramLoginParameters.proxy,
            howLongProfileExists: instagramLoginParameters.howLongProfileExists
        };
        return Security.encrypt(JSON.stringify(instagramData));
    },
    'loginInstagram'(instagramData) {
        if (!instagramData)
            throw new Meteor.Error('error', 'Sessions not set');

        instagramData = JSON.parse(Security.decrypt(instagramData));
        checkInstagramData(instagramData);
        let future = new Future();
        exec('/usr/bin/php7.2 /var/InstagramBot/php-scripts-for-panel/login-to-instagram.php ' + instagramData.username + ' ' + ServerUtilities.escapeShellArg(instagramData.password) + ' ' + instagramData.proxy, function (err, stdout, stderr) {
            future.return(JSON.parse(stdout));
        });
        let respond = future.wait();

        if (respond.success) {
            if (respond.numberOfFollowers > 25000) {
                throw new Meteor.Error(ErrorEnum.numberOfFollowersError.error, ErrorEnum.numberOfFollowersError.reason);
            } else {
                return {success: 'Logged in'};
            }
        } else if (respond.phoneError) {
            throw new Meteor.Error('phoneError', respond.phoneError);
        } else if (respond.checkApiPath) {
            return {challengeRequired: Security.encrypt(respond.checkApiPath)};
        } else {
            throw new Meteor.Error('error', respond.error);
        }
    },
    'challengeRequired'(code, instagramData, checkApiPath) {
        if (!instagramData || !checkApiPath)
            throw new Meteor.Error('error', 'Sessions not set');

        instagramData = JSON.parse(Security.decrypt(instagramData));
        checkInstagramData(instagramData);
        checkApiPath = Security.decrypt(checkApiPath);
        validCheckApiPath(checkApiPath);

        try {
            Security.checkNumber(code);
        } catch (exception) {
            throw new Meteor.Error('numberError', exception);
        }

        let future = new Future();
        exec('/usr/bin/php7.2 /var/InstagramBot/php-scripts-for-panel/challenge-required.php ' + code + ' ' + checkApiPath + ' ' + instagramData.username + ' ' + ServerUtilities.escapeShellArg(instagramData.password) + ' 2>&1 | tee -a /var/log/InstagramBot/challenge_required/challenge_required.log', function (err, stdout, stderr) {
            future.return(JSON.parse(stdout));
        });
        let respond = future.wait();

        if (respond.success) {
            return 'success';
        } else {
            throw new Meteor.Error('error', respond);
        }
    },
    'getToken'(instagramData) {
        if (!instagramData)
            throw new Meteor.Error('error', 'Sessions not set');

        instagramData = JSON.parse(Security.decrypt(instagramData));
        checkInstagramData(instagramData);

        return instagramData.token;
    },
    'getInstagramBasicData'(instagramData) {
        if (!instagramData)
            throw new Meteor.Error('error', 'Sessions not set');

        instagramData = JSON.parse(Security.decrypt(instagramData));
        checkInstagramData(instagramData);
        let future = new Future();
        exec('/usr/bin/php7.2 /var/InstagramBot/php-scripts-for-panel/is-this-you.php ' + instagramData.username + ' ' + ServerUtilities.escapeShellArg(instagramData.password) + ' ' + instagramData.proxy, function (err, stdout, stderr) {
            future.return(JSON.parse(stdout));
        });
        let respond = future.wait();

        if (respond.error) {
            throw new Meteor.Error(respond.error);
        } else {
            return respond;
        }
    },
    'insertInstagramDataInDB'(profilePic, instagramData) {
        if (!instagramData)
            throw new Meteor.Error('error', 'Sessions not set');

        try {
            Security.checkIfPicPathIsFromInstagram(profilePic);
        } catch (exception) {
            throw new Meteor.Error('picError', exception);
        }
        instagramData = JSON.parse(Security.decrypt(instagramData));
        checkInstagramData(instagramData);

        let respond = getProfileInfo(instagramData);
        if (respond.success) {
            try {
                updateProfilesAndProxiesCollections(instagramData, respond.business);
                saveProfilePic(profilePic, instagramData.token);
                createStatisticsDocument(instagramData);
                addProfileToTempCollection(instagramData);
            } catch (exception) {
                throw new Meteor.Error('error', exception);
            }
        } else {
            throw new Meteor.Error('error', respond);
        }
    }
});

function updateProfilesAndProxiesCollections(instagramData, business) {
    let getFollowers = pickConfig(instagramData.howLongProfileExists);
    Profiles.update(
        {'tokenData.token': instagramData.token},
        {
            $set: {
                'tokenData.valid': false,
                'verifyData.verifiedAt': new Date(),
                'verifyData.verify': true,
                'instagramData.instagramUsername': instagramData.username,
                'instagramData.instagramPassword': Security.encrypt(instagramData.password),
                'instagramData.proxy': instagramData.proxy,
                'instagramData.business': business,
                'instagramData.initStatistics': false,
                'config.getFollowers': getFollowers
            }
        }
    );
    Proxies.update({proxy: instagramData.proxy}, {$inc: {numberOfUses: 1}});
}

function createStatisticsDocument(instagramData) {
    exec('/usr/bin/php7.2 /var/InstagramBot/php-scripts-for-panel/create-statistics.php ' + instagramData.username + ' ' + ServerUtilities.escapeShellArg(instagramData.password) + ' ' + instagramData.proxy + ' 2>&1 | tee -a /var/log/InstagramBot/init_statistics/init_statistics.log');
}

function addProfileToTempCollection(instagramData) {
    TempProfiles.insert({
        insertedAt: new Date(),
        username: instagramData.username
    });
}

function saveProfilePic(profilePic, token) {
    let profile = Profiles.findOne({'tokenData.token': token}, {fields: {_id: 1, owner: 1}});
    Files.load(profilePic, {
        meta: {
            profileId: profile._id,
            owner: profile.owner
        }
    })
}

function getProfileInfo(instagramData) {
    let future = new Future();
    exec('/usr/bin/php7.2 /var/InstagramBot/php-scripts-for-panel/get-profile-info.php ' + instagramData.username + ' ' + ServerUtilities.escapeShellArg(instagramData.password) + ' ' + instagramData.proxy, function (err, stdout, stderr) {
        future.return(JSON.parse(stdout));
    });
    return future.wait();
}

function checkInstagramData(instagramData) {
    let instagramDataErrors = {};
    let allowedDropdownValues = ['lessThanMonth', 'betweenOneAndThree', 'moreThenThree'];
    ServerErrorHandling.tryCatchHandler(Security.checkUsername, [instagramData.username], instagramDataErrors);
    ServerErrorHandling.tryCatchHandler(Security.checkPassword, [instagramData.password], instagramDataErrors);
    ServerErrorHandling.tryCatchHandler(Security.checkInstagramLoginToken, [instagramData.token], instagramDataErrors);
    ServerErrorHandling.tryCatchHandler(Security.checkDropdownValues,[allowedDropdownValues, instagramData.howLongProfileExists], instagramDataErrors);
    ServerErrorHandling.throwExceptionIfErrorOccurred(instagramDataErrors, 'instagramDataErrors');
}

function validCheckApiPath(checkApiPath) {
    if (!ServerUtilities.isString(checkApiPath))
        throw new Meteor.Error('notValidCheckApiPath', 'Check api path is not valid');
}

function pickConfig(howLongProfileExists) {
    switch (howLongProfileExists) {
        case 'lessThanMonth':
            return lessThanMonth();
        case 'betweenOneAndThree':
            return betweenOneAndThreeMonth();
        case 'moreThenThree':
            return moreThanThreeMonth();
    }
}

function lessThanMonth() {
    return {
        whenToStartBot: moment.utc().add('1', 'hour').startOf('hour').format('HH:mm'),
        pauseBetweenProfiles: 90,
        pauseBetweenActions: 5,
        afterHowManyDaysToUnfollow: 1,
        howMuchFollows: 100,
        howMuchFollowsOffset: 5,
        numberOfLikesPerProfile: 1,
        pauseDay: moment.utc().day((Math.floor(Math.random() * 4) + 1) + 7).format('DD.MM.YYYY'),  //random date in next week between Monday and Thursday
        currentlyWorking: false,
        botState: true,
        like: true,
        override: false,
        targetValidating: false,
        statisticsUpdate: false,
        unfollowing: false
    }
}

function betweenOneAndThreeMonth() {
    return {
        whenToStartBot: moment.utc().add('1', 'hour').startOf('hour').format('HH:mm'),
        pauseBetweenProfiles: 90,
        pauseBetweenActions: 5,
        afterHowManyDaysToUnfollow: 1,
        howMuchFollows: 300,
        howMuchFollowsOffset: 5,
        numberOfLikesPerProfile: 1,
        pauseDay: moment.utc().day((Math.floor(Math.random() * 4) + 1) + 7).format('DD.MM.YYYY'),  //random date in next week between Monday and Thursday,
        currentlyWorking: false,
        botState: true,
        like: true,
        override: false,
        targetValidating: false,
        statisticsUpdate: false,
        unfollowing: false
    }
}

function moreThanThreeMonth() {
    return {
        whenToStartBot: moment.utc().add('1', 'hour').startOf('hour').format('HH:mm'),
        pauseBetweenProfiles: 90,
        pauseBetweenActions: 5,
        afterHowManyDaysToUnfollow: 1,
        howMuchFollows: 390,
        howMuchFollowsOffset: 5,
        numberOfLikesPerProfile: 1,
        pauseDay: moment.utc().day((Math.floor(Math.random() * 4) + 1) + 7).format('DD.MM.YYYY'),  //random date in next week between Monday and Thursday,
        currentlyWorking: false,
        botState: true,
        like: true,
        override: false,
        targetValidating: false,
        statisticsUpdate: false,
        unfollowing: false
    }
}

function sendEmailToAdmin() {
    let message = '<!doctype html>' +
        '<html lang="en">' +
        '<head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">' +
        '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
        '<title>Document</title>' +
        '</head>' +
        '<body>' +
        'We are out of prexies. User ' + Meteor.user().username + ' tries to login.<br>Email: ' + Meteor.user().emails[0].address + '<br>Phone Number: ' + Meteor.user().profile.phoneNumber +
        '</body>' +
        '</html>';
    //TODO:
    Email.send({to: 'office@your-site.com', from: 'no-reply@your-domain.com', subject: 'No proxies', html: message});
}