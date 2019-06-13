<?php

class Statistics {
    private $instagramAPI;
    private $profileId;
    private $instagramUsername;
    private $statisticsCollection;
    private $followersFromDatabase;
    private $followingFromDatabase;
    private $followersFromInstagram;
    private $followingFromInstagram;
    private $newFollowers;
    private $profilesWhoUnfollowYou;
    private $newFollowing;
    private $profilesWhoYouUnfollow;

    private static $numberOfErrors = 0;

    /**
     * Statistics constructor.
     * @param $instagramAPI \InstagramAPI\Instagram
     * @param $profileId
     * @param $instagramUsername
     */
    public function __construct($instagramAPI, $profileId, $instagramUsername) {
        $this->instagramAPI = $instagramAPI;
        $this->profileId = $profileId;
        $this->instagramUsername = $instagramUsername;
        $this->statisticsCollection = (new DataBase())->getCollection('statistics');
        $this->getFollowersAndFollowingData();
        $this->findDifferences();
    }

    private function getFollowersAndFollowingData() {
        $this->followersFromDatabase = Utils::getFollowersFromDataBase($this->profileId);
        $this->followingFromDatabase = Utils::getFollowingFromDataBase($this->profileId);
        $this->getFollowersFromInstagram();
        $this->getFollowingFromInstagram();
    }

    private function getFollowersFromInstagram() {
        try {
            $followers = Utils::getFollowersFromInstagram($this->instagramAPI, $this->instagramUsername);
            foreach ($followers as $profile) {
                $this->followersFromInstagram [] = ['instagramId' => $profile->getPk(), 'username' => $profile->getUsername()];
            }
        } catch (Exception $e) {
            if ((Utils::checkForCurl18Error($e) || Utils::checkForCurl61Error($e) || Utils::checkForNoResponseFromServerError($e)) && self::$numberOfErrors < 10) {
                self::$numberOfErrors++;
                $this->getFollowersFromInstagram();
            }
            Utils::logEvent("error", $e->getMessage());
            Utils::logEvent("error", self::$numberOfErrors);
            Utils::stopProgram();
        }
    }

    private function getFollowingFromInstagram() {
        try {
            $following = Utils::getFollowingFromInstagram($this->instagramAPI, $this->instagramUsername);
            foreach ($following as $profile) {
                $this->followingFromInstagram [] = ['instagramId' => $profile->getPk(), 'username' => $profile->getUsername()];
            }
        } catch (Exception $e) {
            if ((Utils::checkForCurl18Error($e) || Utils::checkForCurl61Error($e) || Utils::checkForNoResponseFromServerError($e)) && self::$numberOfErrors < 10) {
                self::$numberOfErrors++;
                $this->getFollowingFromInstagram();
            }
            Utils::logEvent("error", $e->getMessage());
            Utils::logEvent("error", self::$numberOfErrors);
            Utils::stopProgram();
        }
    }

    private function findDifferences() {
        $this->newFollowers = array_map('json_decode', array_diff(
                array_map('json_encode', $this->followersFromInstagram),
                array_map('json_encode', $this->followersFromDatabase)
            )
        );
        $this->profilesWhoUnfollowYou = array_map('json_decode', array_diff(
                array_map('json_encode', $this->followersFromDatabase),
                array_map('json_encode', $this->followersFromInstagram)
            )
        );
        $this->newFollowing = array_map('json_decode', array_diff(
                array_map('json_encode', $this->followingFromInstagram),
                array_map('json_encode', $this->followingFromDatabase)
            )
        );
        $this->profilesWhoYouUnfollow = array_map('json_decode', array_diff(
                array_map('json_encode', $this->followingFromDatabase),
                array_map('json_encode', $this->followingFromInstagram)
            )
        );
    }

    public function update() {
        $this->updateFollowers();
        $this->updateFollowing();
        $this->updateStatistics();
        Utils::logEvent("info", "Statistics updated");
    }

    private function updateFollowers() {
        $this->addNewFollowers();
        $this->deleteOneWhoDoesNotFollowYouAnymore();
    }

    private function addNewFollowers() {
        foreach ($this->newFollowers as $profile) {
            $this->statisticsCollection->updateOne(
                ['profile' => $this->profileId],
                ['$addToSet' => ['followers' => ['instagramId' => $profile->instagramId, 'username' => $profile->username]]]
            );
            Utils::logEvent('info', 'Profile ' . $profile->username . ' start following you');
        }
    }

    private function deleteOneWhoDoesNotFollowYouAnymore() {
        foreach ($this->profilesWhoUnfollowYou as $profile) {
            $this->statisticsCollection->updateOne(
                ['profile' => $this->profileId],
                ['$pull' => ['followers' => ['instagramId' => $profile->instagramId, 'username' => $profile->username]]]
            );
            Utils::logEvent('info', 'Profile ' . $profile->username . ' unfollow you');
        }
    }

    private function updateFollowing() {
        $this->addNewFollowing();
        $this->deleteOneWhoYouDoesNotFollowAnymore();
    }

    private function addNewFollowing() {
        foreach ($this->newFollowing as $profile) {
            $this->statisticsCollection->updateOne(
                ['profile' => $this->profileId],
                ['$addToSet' => ['following' => ['instagramId' => $profile->instagramId, 'username' => $profile->username]]]
            );
            Utils::logEvent('info', 'You start following profile ' . $profile->username);
        }
    }

    private function deleteOneWhoYouDoesNotFollowAnymore() {
        foreach ($this->profilesWhoYouUnfollow as $profile) {
            $this->statisticsCollection->updateOne(
                ['profile' => $this->profileId],
                ['$pull' => ['following' => ['instagramId' => $profile->instagramId, 'username' => $profile->username]]]
            );
            Utils::logEvent('info', 'You unfollow profile ' . $profile->username);
        }
    }

    private function updateStatistics() {
        $this->statisticsCollection->updateOne(
            ['profile' => $this->profileId],
            [
                '$push' => [
                    'statistics' => [
                        'numberOfFollowers' => count($this->followersFromInstagram),
                        'numberOfFollowing' => count($this->followingFromInstagram),
                        'follows' => count($this->newFollowers),
                        'unfollows' => count($this->profilesWhoUnfollowYou),
                        'following' => count($this->newFollowing),
                        'unfollowing' => count($this->profilesWhoYouUnfollow),
                        'updatedAt' => new MongoDB\BSON\UTCDateTime()
                    ]
                ]
            ]
        );
    }

    public function getNewFollowers() {
        return $this->newFollowers;
    }
}