<?php

abstract class Unfollow {
    protected $instagramAPI;
    protected $profileId;
    protected $profilesToUnfollow;
    protected $targetsCollection;
    protected $profilesCollection;
    protected $config;

    /**
     * Unfollow constructor.
     * @param $instagramAPI \InstagramAPI\Instagram
     * @param $profileId
     * @param $config
     */
    public function __construct($instagramAPI, $profileId, $config) {
        $this->instagramAPI = $instagramAPI;
        $this->profileId = $profileId;
        $this->config = $config;
        $this->targetsCollection = (new DataBase())->getCollection('targets');
        $this->profilesCollection = (new DataBase())->getCollection('profiles');
    }

    protected abstract function getProfilesToUnfollow();

    public function start() {
        $this->changeUnfollowingState(true);
        foreach ($this->profilesToUnfollow as $profileToUnfollow) {
            try {
                $this->instagramAPI->people->unfollow($profileToUnfollow['instagramId']);
                $this->targetsCollection->updateMany(
                    ['profile' => $this->profileId, 'profiles.instagramId' => $profileToUnfollow['instagramId']],
                    ['$set' => ['profiles.$.active' => false]]
                );
                Utils::logEvent("info", "Account " . $profileToUnfollow['username'] . " unfollowed.");
                Utils::makePause($this->config['unfollow']['pauseBetweenUnfollow']);
            } catch (Exception $e) {
                Utils::logEvent("Error", $e->getMessage());
            }
        }
        $this->changeUnfollowingState(false);
    }

    private function changeUnfollowingState($state) {
        $this->profilesCollection->updateOne(
            ['_id' => $this->profileId],
            ['$set' => ['config.getFollowers.unfollowing' => $state]]
        );
    }
}