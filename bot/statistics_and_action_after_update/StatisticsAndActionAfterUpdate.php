<?php

class StatisticsAndActionAfterUpdate {
    private $instagramAPI;
    private $profileId;
    private $profilesCollection;
    private $instagramUsername;
    private $config;
    private $newFollowers;

    public function __construct($instagramAPI, $profileId, $instagramUsername, $config) {
        $this->instagramAPI = $instagramAPI;
        $this->profileId = $profileId;
        $this->instagramUsername = $instagramUsername;
        $this->config = $config;
        $this->profilesCollection = (new DataBase())->getCollection('profiles');
        $this->changeStatisticsUpdateState(true);
    }

    private function changeStatisticsUpdateState($state) {
        $this->profilesCollection->updateOne(
            ['_id' => $this->profileId],
            ['$set' => ['config.getFollowers.statisticsUpdate' => $state]]
        );
    }

    public function start() {
        $this->updateStatistics();
        if ($this->checkNumberOfDays()) {
            $this->updateTargetsMetrics();
            $this->whenFollowed();
            $this->unfollow();
        } else {
            Utils::logEvent('info', 'Profile expired');
        }
        $this->changeStatisticsUpdateState(false);
    }

    private function updateStatistics() {
        $statistics = new Statistics($this->instagramAPI, $this->profileId, $this->instagramUsername);
        $statistics->update();
        $this->newFollowers = $statistics->getNewFollowers();
    }

    private function checkNumberOfDays() {
        if ($this->config['profile']['numberOfDays'] > 0)
            return true;
        return false;
    }

    private function updateTargetsMetrics() {
        (new TargetMetrics($this->profileId))->update();
    }

    private function whenFollowed() {
        if ($this->config['message']['whenFollowed']) {
            (new WhenFollowed($this->instagramAPI, $this->profileId, $this->config, $this->newFollowers))->send();
        } else {
            Utils::logEvent('info', 'When followed is not enabled');
        }
    }

    private function unfollow() {
        if (!$this->config['getFollowers']['botState']) {
            if ($this->config['unfollow']['allFollowing']) {
                Utils::logEvent("Info", "Unfollow all following");
                (new UnfollowAll($this->instagramAPI, $this->profileId, $this->config))->start();
            } else if ($this->config['unfollow']['whoDoNotFollowYou']) {
                Utils::logEvent("Info", "Unfollow these who do not follow you");
                (new UnfollowWhoDoNotFollowYou($this->instagramAPI, $this->profileId, $this->config))->start();
            } else {
                Utils::logEvent("Info", "Unfollow is not set");
            }
        } else {
            Utils::logEvent('info', 'Unfollow is not possible, bot is not paused');
        }
    }
}