<?php

class RegularUnfollow extends Unfollow {
    public function __construct($instagramAPI, $profileId, $config) {
        parent::__construct($instagramAPI, $profileId, $config);
        $this->profilesToUnfollow = $this->getProfilesToUnfollow();
    }

    protected function getProfilesToUnfollow() {
        $profilesToUnfollow = $this->targetsCollection->aggregate([
            [
                '$match' => [
                    'profile' => $this->profileId, 'verifyData.verify' => true
                ]
            ],
            [
                '$group' => ['_id' => null, 'profiles' => ['$push' => '$profiles']]
            ],
            [
                '$project' => [
                    '_id' => 0,
                    'profiles' => [
                        '$reduce' => [
                            'input' => '$profiles',
                            'initialValue' => [],
                            'in' => [
                                '$concatArrays' => [
                                    '$$value', '$$this'
                                ]
                            ]
                        ]
                    ]
                ]
            ],
            [
                '$project' => [
                    'profiles' => [
                        '$filter' => [
                            'input' => '$profiles',
                            'as' => 'profile',
                            'cond' => [
                                '$and' => [
                                    ['$eq' => ['$$profile.active', true]],
                                    ['$ne' => ['$$profile.unfollowSchedule', null]],
                                    ['$lt' => ['$$profile.unfollowSchedule', new MongoDB\BSON\UTCDateTime()]]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ])->toArray();
        if (empty($profilesToUnfollow)) {
            Utils::logEvent('info', 'No targets');
            Utils::stopProgram();
        }
        $profilesToUnfollow = iterator_to_array($profilesToUnfollow[0]['profiles']);
        if (empty($profilesToUnfollow)) {
            Utils::logEvent('info', 'No profiles to unfollow');
            Utils::stopProgram();
        }
        return $profilesToUnfollow;
    }
}