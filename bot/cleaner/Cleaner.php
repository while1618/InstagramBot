<?php

class Cleaner {
    private $tempProfilesCollection;
    private $profilesCollection;
    private $targetsCollection;
    private $postsCollection;
    private $messagesCollection;
    private $filesCollection;
    private $proxiesCollection;
    private $statisticsCollection;
    private $usersCollection;

    private static $filePath = "/var/InstagramBot/uploads/";

    public function __construct() {
        $this->tempProfilesCollection = (new DataBase())->getCollection('tempProfiles');
        $this->profilesCollection = (new DataBase())->getCollection('profiles');
    }

    public function clean() {
        $this->deleteNullProfiles();
        $this->deleteTempProfiles();
        $this->deleteExpiredProfiles();
    }

    private function deleteNullProfiles() {
        $result = $this->profilesCollection->deleteMany([
            'instagramData.instagramUsername' => null,
            'createdAt' => ['$lt' => new MongoDB\BSON\UTCDateTime(strtotime('-5 days') * 1000)]
        ]);
        if ($result->getDeletedCount() > 0) {
            Utils::logEvent('info', "Null profiles deleted");
        } else {
            Utils::logEvent('info', "No null profiles to delete");
        }
    }

    private function deleteTempProfiles() {
        $result = $this->tempProfilesCollection->deleteMany([
            'insertedAt' => ['$lt' => new MongoDB\BSON\UTCDateTime(strtotime('-1 month') * 1000)]
        ]);
        if ($result->getDeletedCount() > 0) {
            Utils::logEvent('info', "Temp profiles deleted");
        } else {
            Utils::logEvent('info', "No temp profiles to delete");
        }
    }

    private function deleteExpiredProfiles() {
        $profilesForDeleting = $this->getProfilesForDeleting();
        if (!empty($profilesForDeleting)) {
            $this->initCollections();
            foreach ($profilesForDeleting as $profileForDeleting) {
                $this->deleteFromCollections($profileForDeleting);
                $this->deleteFiles($profileForDeleting);
                $this->freeProxy($profileForDeleting);
                $this->sendEmail($profileForDeleting);
            }
        } else {
            Utils::logEvent('info', "No expired profiles to delete");
        }
    }

    private function getProfilesForDeleting() {
        return $this->profilesCollection->find(
            [
                'config.profile.numberOfDays' => ['$lte' => -5]
            ],
            [
                'projection' => [
                    '_id' => 1,
                    'instagramData.proxy' => 1,
                    'instagramData.instagramUsername' => 1,
                    'owner' => 1
                ]
            ]
        )->toArray();
    }

    private function initCollections() {
        $this->targetsCollection = (new DataBase())->getCollection('targets');
        $this->postsCollection = (new DataBase())->getCollection('posts');
        $this->messagesCollection = (new DataBase())->getCollection('messages');
        $this->filesCollection = (new DataBase())->getCollection('files');
        $this->proxiesCollection = (new DataBase())->getCollection('proxies');
        $this->statisticsCollection = (new DataBase())->getCollection('statistics');
        $this->usersCollection = (new DataBase())->getCollection('users');
    }

    private function deleteFromCollections($profileForDeleting) {
        $this->profilesCollection->deleteMany([
            'config.profile.numberOfDays' => ['$lte' => -5]
        ]);
        $this->targetsCollection->deleteMany([
            'profile' => $profileForDeleting['_id']
        ]);
        $this->postsCollection->deleteMany([
            'profile' => $profileForDeleting['_id']
        ]);
        $this->messagesCollection->deleteMany([
            'profile' => $profileForDeleting['_id']
        ]);
        $this->statisticsCollection->deleteMany([
            'profile' => $profileForDeleting['_id']
        ]);
        Utils::logEvent('info', 'All data for profile: ' .$profileForDeleting['instagramData']['instagramUsername']. ' deleted');
    }

    private function deleteFiles($profileForDeleting) {
        $files = $this->filesCollection->find([
            'meta.profileId' => $profileForDeleting['_id']
        ])->toArray();
        $this->filesCollection->deleteMany([
            'meta.profileId' => $profileForDeleting['_id']
        ]);
        foreach ($files as $file) {
            shell_exec("rm -rf " . self::$filePath . $file['_id'] . $file['extensionWithDot']);
        }
    }

    private function freeProxy($profileForDeleting) {
        $this->proxiesCollection->updateMany(
            ['proxy' => $profileForDeleting['instagramData']['proxy']],
            ['$inc' => ['numberOfUses' => -1]]
        );
    }

    private function sendEmail($profileForDeleting) {
        $user = iterator_to_array($this->usersCollection->findOne([
            '_id' => $profileForDeleting['owner']
        ]));
        //TODO:
        (new Mailer())->send(
        'no-reply@your-domain.com',
        $user['emails'][0]['address'],
        'Profile deleted',
        'Your profile ' . $profileForDeleting['instagramData']['instagramUsername'] . ' is deleted from InstagramBot.'
        );
    }
}