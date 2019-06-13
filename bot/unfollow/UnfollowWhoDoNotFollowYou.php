<?php

class UnfollowWhoDoNotFollowYou extends Unfollow {
    public function __construct($instagramAPI, $profileId, $config) {
        parent::__construct($instagramAPI, $profileId, $config);
        $json = json_encode($this->getProfilesToUnfollow());
        $this->profilesToUnfollow = json_decode($json, true);
    }

    protected function getProfilesToUnfollow() {
        $following = Utils::getFollowingFromDataBase($this->profileId);
        $followers = Utils::getFollowersFromDataBase($this->profileId);
        $profilesToUnfollow = array_diff(array_map('json_encode', $following), array_map('json_encode', $followers));
        $offset = $this->config['unfollow']['numberOfUnfollowPerHour'] * ($this->config['unfollow']['numberOfUnfollowPerHourOffset'] / 100);
        $unfollows = round(rand($this->config['unfollow']['numberOfUnfollowPerHour'] - $offset, $this->config['unfollow']['numberOfUnfollowPerHour'] + $offset));
        return array_slice(array_map('json_decode', $profilesToUnfollow), 0, $unfollows);
    }
}