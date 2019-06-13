<?php

class GetFollowersUtils {
    public static function checkIfProfileIsReadyToStart($whenToStartBot, $currentlyWorking) {
        if (self::startBot($currentlyWorking, $whenToStartBot))
            return true;
        self::botCurrentlyWorkingOrFinishForToday($currentlyWorking, $whenToStartBot);
        self::itIsNotTimeYet($currentlyWorking, $whenToStartBot);
        return false;
    }

    private static function startBot($currentlyWorking, $whenToStartBot) {
        if (!$currentlyWorking && time() > strtotime($whenToStartBot) && (time() - 3600) < strtotime($whenToStartBot))
            return true;
        return false;
    }

    private static function botCurrentlyWorkingOrFinishForToday($currentlyWorking, $whenToStartBot) {
        if ($currentlyWorking)
            Utils::logEvent("Info", "Bot currently working");
        if (!$currentlyWorking && time() > strtotime($whenToStartBot) && (time() - 3600) > strtotime($whenToStartBot))
            Utils::logEvent("Info", "Bot is done for today");
    }

    private static function itIsNotTimeYet($currentlyWorking, $whenToStartBot) {
        if (!$currentlyWorking && time() < strtotime($whenToStartBot))
            Utils::logEvent("Info", "It's not time yet.");
    }

    public static function checkIfProfileHaveTargets($profileId) {
        $targetsCollection = (new DataBase())->getCollection('targets');
        $targets = $targetsCollection->find([
            'profile' => $profileId, 'verifyData.verify' => true
        ])->toArray();
        if (empty($targets))
            return false;
        return true;
    }

    public static function getProfilesToFollow($profileId, $howMuchFollows, $howMuchFollowsOffset) {
        $targetsCollection = (new DataBase())->getCollection('targets');
        $profilesToFollow = $targetsCollection->aggregate([
            [
                '$match' => [
                    'profile' => $profileId, 'verifyData.verify' => true, 'pause' => false
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
                                    ['$eq' => ['$$profile.unfollowSchedule', null]]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ])->toArray();
        $profilesToFollow = iterator_to_array($profilesToFollow[0]['profiles']);
        if (empty($profilesToFollow)) {
            Utils::logEvent('info', 'All targets followers are handled, or paused');
            Utils::stopProgram();
        }
        shuffle($profilesToFollow);
        $offset = $howMuchFollows * ($howMuchFollowsOffset / 100);
        $follows = round(rand($howMuchFollows - $offset, $howMuchFollows + $offset));
        return array_slice($profilesToFollow, 0, $follows);
    }

    public static function changeCurrentlyWorkingStatus($state, $message, $profileId) {
        $profilesCollection = (new DataBase())->getCollection('profiles');
        $profilesCollection->updateOne(
            ['_id' => $profileId],
            ['$set' => ['config.getFollowers.currentlyWorking' => $state]]
        );
        Utils::logEvent("INFO", $message);
    }

    public static function getBotStates($profileId) {
        $profilesCollection = (new DataBase())->getCollection('profiles');
        $profile = $profilesCollection->findOne(
            ['_id' => $profileId],
            ['projection' => ['_id' => 0, 'config.getFollowers' => 1]]
        );
        return [
            'botState' => $profile['config']['getFollowers']['botState'],
            'like' => $profile['config']['getFollowers']['like'],
            'targetValidating' => $profile['config']['getFollowers']['targetValidating'],
            'statisticsUpdate' => $profile['config']['getFollowers']['statisticsUpdate'],
            'unfollowing' => $profile['config']['getFollowers']['unfollowing']
        ];
    }

    /**
     * @param $instagramAPI \InstagramAPI\Instagram
     * @param $userID
     * @return array
     *
     * @throws Exception
     */
    public static function getFirstPageOfUserFeed($instagramAPI, $userID) {
        $userFeedIds = [];
        $userFeed = $instagramAPI->timeline->getUserFeed($userID, null);

        foreach ($userFeed->getItems() as $item) {
            $itemId = $item->getPk();
            $userFeedIds [] = $itemId;
        }
        Utils::logEvent("Info", "User feed is extracted for user: " . $userID);

        return $userFeedIds;
    }

    public static function pauseDay($pauseDay, $profileId) {
        if (date('d.m.Y', time()) === $pauseDay) {
            if (date('d.m.Y', strtotime('+45 minutes')) !== $pauseDay) {
                $days = ['monday', 'tuesday', 'wednesday', 'thursday'];
                $profilesCollection = (new DataBase())->getCollection('profiles');
                $profilesCollection->updateOne(
                    ['_id' => $profileId],
                    ['$set' => ['config.getFollowers.pauseDay' => date('d.m.Y', strtotime('next ' . $days[array_rand($days)]))]]
                );
            }
            return true;
        }
        return false;
    }
}