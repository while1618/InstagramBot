<?php

class ValidateTargets {
    private $instagramAPI;
    private $profileId;
    private $profileUsername;
    private $profileFollowers;
    private $profileFollowing;
    private $targetsCollection;
    private $profilesCollection;
    private $targets;
    /**
     * @var $targetFollowers \InstagramAPI\Response\Model\User[] array
     */
    private $targetFollowers;
    private $numberOfFollowers;
    private $numberOfPrivateProfiles;
    private $numberOfPublicProfiles;
//    private $numberOfBusinessProfiles;
//    private $numberOfPersonalProfiles;
    private $numberOfSkippedProfiles;
    private $filters;

    private static $numberOfErrors = 0;

    /**
     * ValidateTargets constructor.
     * @param $instagramAPI \InstagramAPI\Instagram $instagramAPI
     * @param $profileId
     * @param $profileUsername
     * @param $targets
     */
    public function __construct($instagramAPI, $profileId, $profileUsername, $targets) {
        $this->instagramAPI = $instagramAPI;
        $this->profileId = $profileId;
        $this->profileUsername = $profileUsername;
        $this->targets = $targets;
        $this->targetsCollection = (new DataBase())->getCollection('targets');
        $this->profilesCollection = (new DataBase())->getCollection('profiles');
        $this->profileFollowers = Utils::getFollowersFromDataBase($this->profileId);
        $this->profileFollowing = Utils::getFollowingFromDataBase($this->profileId);
        $this->changeTargetValidatingState(true);
    }

    private function changeTargetValidatingState($state) {
        $this->profilesCollection->updateOne(
            ['_id' => $this->profileId],
            ['$set' => ['config.getFollowers.targetValidating' => $state]]
        );
    }

    public function validate() {
        foreach ($this->targets as $target) {
            Utils::logEvent('info', 'Validating target: ' . $target['targetUsername']);
            $this->setDataForTarget($target);
            $this->targetFollowers = $this->filterTargetFollowers();
            $this->insertTargetFollowersInDB($target);
        }
        $this->changeTargetValidatingState(false);
    }

    private function setDataForTarget($target) {
        try {
            $this->targetFollowers = Utils::getFollowersFromInstagram($this->instagramAPI, $target['targetUsername']);
            $this->filters = $target['filters'];
            $this->numberOfFollowers = count($this->targetFollowers);
            $this->numberOfSkippedProfiles = 0;
            $this->numberOfPrivateProfiles = 0;
            $this->numberOfPublicProfiles = 0;
//            $this->numberOfBusinessProfiles = 0;
//            $this->numberOfPersonalProfiles = 0;
        } catch (Exception $e) {
            if ((Utils::checkForCurl18Error($e) || Utils::checkForCurl61Error($e) || Utils::checkForNoResponseFromServerError($e)) && self::$numberOfErrors < 10) {
                self::$numberOfErrors++;
                $this->setDataForTarget($target);
            }
            Utils::logEvent("error", $e->getMessage());
            Utils::logEvent("error", self::$numberOfErrors);
            Utils::stopProgram();
        }
    }

    private function filterTargetFollowers() {
        $followers = [];
        foreach ($this->targetFollowers as $follower) {
            $this->calculateNumbersForFollower($follower);
            if ($this->filter($follower)) {
                $this->validFollower($follower, $followers);
            } else {
                $this->numberOfSkippedProfiles++;
            }
        }
        return $followers;
    }

    /**
     * @param $follower \InstagramAPI\Response\Model\User
     */
    private function calculateNumbersForFollower($follower) {
        if ($follower->getIsPrivate())
            $this->numberOfPrivateProfiles++;
        else
            $this->numberOfPublicProfiles++;

//        if ($follower->getIsBusiness())
//            $this->numberOfBusinessProfiles++;
//        else
//            $this->numberOfPersonalProfiles++;
    }

    /**
     * @param $follower \InstagramAPI\Response\Model\User
     * @return bool
     */
    private function filter($follower) {
        if ($this->profileUsername === $follower->getUsername()) {
            return false;
        }
        if (Utils::isInArrayOfObjects($follower->getUsername(), 'username', $this->profileFollowers)) {
            return false;
        }
        if (Utils::isInArrayOfObjects($follower->getUsername(), 'username', $this->profileFollowing)) {
            return false;
        }
//        if (!$this->filters['businessAccounts']) {
//            if ($follower->getIsBusiness())
//                return false;
//        }
//        if (!$this->filters['personalAccounts']) {
//            if (!$follower->getIsBusiness())
//                return false;
//        }
        if (!$this->filters['privateAccounts']) {
            if ($follower->getIsPrivate())
                return false;
        }
        if (!$this->filters['publicAccounts']) {
            if (!$follower->getIsPrivate())
                return false;
        }
        return true;
    }

    /**
     * @param $follower \InstagramAPI\Response\Model\User
     * @param $followers
     */
    private function validFollower($follower, &$followers) {
        $followers []= [
            'instagramId' => $follower->getPk(),
            'username' => $follower->getUsername(),
            'private' => $follower->getIsPrivate(),
            'unfollowSchedule' => null,
            'active' => true
        ];
    }

    private function insertTargetFollowersInDB($target) {
        $this->targetsCollection->updateOne(
            [
                '_id' => $target['_id']
            ],
            [   '$set' =>
                [
                    'profiles' => $this->targetFollowers,
                    'verifyData.verify' => true,
                    'verifyData.verifiedAt' => new MongoDB\BSON\UTCDateTime(),
                    'metric.numberOfFollowers' => $this->numberOfFollowers,
                    'metric.numberOfProfilesToFollow' => $this->numberOfFollowers - $this->numberOfSkippedProfiles,
                    'metric.numberOfPrivateProfiles' => $this->numberOfPrivateProfiles,
                    'metric.numberOfPublicProfiles' => $this->numberOfPublicProfiles,
//                    'metric.numberOfBusinessProfiles' => $this->numberOfBusinessProfiles,
//                    'metric.numberOfPersonalProfiles' => $this->numberOfPersonalProfiles,
                    'metric.numberOfSkippedProfiles' => $this->numberOfSkippedProfiles
                ]
            ]);
        Utils::logEvent("INFO", "Target followers for ".$target['targetUsername']." successfully added to database.");
    }
}

