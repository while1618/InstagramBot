<?php

class EndOfDay {
    private $profilesCollection;
    private $usersCollection;

    private static $maxFollows = 390;

    public function __construct() {
        $this->profilesCollection = (new DataBase())->getCollection('profiles');
        $this->usersCollection = (new DataBase())->getCollection('users');
    }

    public function start() {
        $this->resetDailyNumberOfMessages();
        $this->reduceDays();
        $this->sendEmails();
        $this->increaseConfig();
    }

    private function resetDailyNumberOfMessages() {
        $this->profilesCollection->updateMany(
            ['verifyData.verify' => true],
            ['$set' => ['config.message.numberOfDailyMessages' => 150]]
        );
        Utils::logEvent('info', 'Daily number of messages reset');
    }

    private function reduceDays() {
        $this->profilesCollection->updateMany(
            ['verifyData.verify' => true],
            ['$inc' => ['config.profile.numberOfDays' => -1]]
        );
        Utils::logEvent('info', 'Days reduced');
    }

    private function sendEmails() {
        $profiles = $this->getProfilesToSendEmails();
        foreach ($profiles as $profile) {
            $email = $this->getEmail($profile);
            if ($profile['config']['profile']['numberOfDays'] === 5) {
                $this->warningEmail($profile, $email);
            } else {
                $this->expiredEmail($profile, $email);
            }
        }
    }

    private function getProfilesToSendEmails() {
        return $this->profilesCollection->find(
            [
                '$or' => [
                    ['config.profile.numberOfDays' => 5],
                    ['config.profile.numberOfDays' => 0]
                ]
            ],
            [
                'projection' => ['owner' => 1, 'config.profile.numberOfDays' => 1, 'instagramData.instagramUsername' => 1]
            ]
        )->toArray();
    }

    private function getEmail($profile) {
        $user = iterator_to_array($this->usersCollection->findOne([
            '_id' => $profile['owner']
        ]));
        return $user['emails'][0]['address'];
    }

    private function warningEmail($profile, $email) {
        //TODO:
        (new Mailer())->send(
            'no-reply@your-domain.com',
            $email,
            'Profile will expired soon',
            'Your profile ' . $profile['instagramData']['instagramUsername'] . ' will expire soon. You have 5 days left.'
        );
        Utils::logEvent('info', "Warning email sent to $email for profile: ". $profile['instagramData']['instagramUsername']);
    }

    private function expiredEmail($profile, $email) {
        //TODO:
        (new Mailer())->send(
            'no-reply@your-domain.com',
            $email,
            'Profile expired',
            'Your profile ' . $profile['instagramData']['instagramUsername'] . ' expired, and will be deleted in 5 days from InstagramBot.'
        );
        Utils::logEvent('info', "Expired email sent to $email for profile: ". $profile['instagramData']['instagramUsername']);
    }

    private function increaseConfig() {
        $profiles = $this->getProfilesForConfigIncrease();
        if (empty($profiles)) {
            Utils::logEvent('info', 'No configs to increase');
        } else {
            foreach ($profiles as $profile) {
                $this->increaseProfileConfig($profile);
            }
        }
    }

    private function getProfilesForConfigIncrease() {
        return $this->profilesCollection->find(
            [
                'verifyData.verify' => true,
                'config.profile.numberOfDays' => ['$gt' => 0],
                'config.getFollowers.override' => false,
                'config.getFollowers.howMuchFollows' => ['$lt' => self::$maxFollows]
            ],
            [
                'projection' => ['config.getFollowers' => 1, 'instagramData.instagramUsername' => 1]
            ]
        )->toArray();
    }

    private function increaseProfileConfig($profile) {
        $increaseBy = rand(8, 12);
        $follows = (($profile['config']['getFollowers']['howMuchFollows'] + $increaseBy) > self::$maxFollows) ? self::$maxFollows : $profile['config']['getFollowers']['howMuchFollows'] + $increaseBy;
        $this->profilesCollection->updateOne(
            ['_id' => $profile['_id']],
            [
                '$set' => [
                    'config.getFollowers.howMuchFollows' => $follows
                ]
            ]
        );
        Utils::logEvent('info', 'Config increased for profile: ' . $profile['instagramData']['instagramUsername']);
    }
}