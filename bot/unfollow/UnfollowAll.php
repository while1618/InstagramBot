<?php

class UnfollowAll extends Unfollow {
    public function __construct($instagramAPI, $profileId, $config) {
        parent::__construct($instagramAPI, $profileId, $config);
        $json = json_encode($this->getProfilesToUnfollow());
        $this->profilesToUnfollow = json_decode($json, true);
    }

    protected function getProfilesToUnfollow() {
        $profilesToUnfollow = Utils::getFollowingFromDataBase($this->profileId);
        $offset = $this->config['unfollow']['numberOfUnfollowPerHour'] * ($this->config['unfollow']['numberOfUnfollowPerHourOffset'] / 100);
        $unfollows = round(rand($this->config['unfollow']['numberOfUnfollowPerHour'] - $offset, $this->config['unfollow']['numberOfUnfollowPerHour'] + $offset));
        return array_slice($profilesToUnfollow, 0, $unfollows);
    }
}