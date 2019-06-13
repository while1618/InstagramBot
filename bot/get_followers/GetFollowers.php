<?php

class GetFollowers {
    private $instagramAPI;
    private $profileId;
    private $instagramUsername;
    private $config;
    private $profilesToFollow;
    private $profilesCollection;
    private $targetsCollection;
    private $botStates;

    /**
     * GetFollowers constructor.
     * @param $instagramAPI \InstagramAPI\Instagram
     * @param $profileId
     * @param $instagramUsername
     * @param $config
     * @param $profilesToFollow
     */
    public function __construct($instagramAPI, $profileId, $instagramUsername, $config, $profilesToFollow) {
        $this->instagramAPI = $instagramAPI;
        $this->profileId = $profileId;
        $this->instagramUsername = $instagramUsername;
        $this->config = $config;
        $this->profilesToFollow = $profilesToFollow;
        $this->profilesCollection = (new DataBase())->getCollection('profiles');
        $this->targetsCollection = (new DataBase())->getCollection('targets');
    }

    public function start() {
        foreach ($this->profilesToFollow as $profileToFollow) {
            $this->botStates = GetFollowersUtils::getBotStates($this->profileId);
            $this->checkBotState();
            if (!$this->botStates['botState'])
                break;
            $this->followAccount($profileToFollow['instagramId'], $profileToFollow['username']);
            if ($this->botStates['like'] && !$profileToFollow['private']) {
                try {
                    $userFeedIds = GetFollowersUtils::getFirstPageOfUserFeed($this->instagramAPI, $profileToFollow['instagramId']);
                    $this->likePosts($userFeedIds);
                } catch (Exception $e) {
                    Utils::logEvent('Warning', $e->getMessage());
                }
            }
            Utils::makePause($this->config['getFollowers']['pauseBetweenProfiles']);
        }
    }

    private function checkBotState() {
        while (true) {
            if ($this->botStates['targetValidating'] || $this->botStates['statisticsUpdate'] || $this->botStates['unfollowing']) {
                Utils::logEvent('info', 'Waiting for other instagram jobs to finish');
                sleep(180);
                $this->botStates = GetFollowersUtils::getBotStates($this->profileId);
            } else {
                break;
            }
        }
    }

    private function followAccount($instagramId, $username) {
        try {
            $this->instagramAPI->people->follow($instagramId);
            Utils::logEvent("FOLLOW", "Account " . $username . " followed.");
            $this->createUnfollowScheduleAndUpdateDB($instagramId, $username);
            Utils::makePause($this->config['getFollowers']['pauseBetweenActions']);
        } catch (Exception $e) {
            Utils::logEvent("Error", $e->getMessage());
            $this->checkForFollowSpamError($e);
            $this->checkForRequestedResourceDoesNotExistError($e, $instagramId);
        }
    }

    private function createUnfollowScheduleAndUpdateDB($instagramId, $username) {
        $timeInMilliseconds = strtotime("+" . $this->config['getFollowers']['afterHowManyDaysToUnfollow'] . " days", time()) * 1000;
        $unfollowSchedule = new MongoDB\BSON\UTCDateTime($timeInMilliseconds);
        $this->targetsCollection->updateMany(
            ['profile' => $this->profileId, 'profiles.instagramId' => $instagramId],
            ['$set' => ['profiles.$.unfollowSchedule' => $unfollowSchedule]]
        );
        Utils::logEvent("INFO", "Account " . $username . " will be unfollowed at: " . date("d-m-Y H:i:s", $timeInMilliseconds / 1000));
    }

    private function likePosts($userFeedIds) {
        for ($i = 0; $i < $this->config['getFollowers']['numberOfLikesPerProfile']; $i++) {
            if (isset($userFeedIds[$i])) {
                try {
                    $this->instagramAPI->media->like($userFeedIds[$i]);
                    Utils::logEvent("LIKE", "Post " . $userFeedIds[$i] . " liked");
                    Utils::makePause($this->config['getFollowers']['pauseBetweenActions']);
                } catch (Exception $e) {
                    Utils::logEvent("Error", $e->getMessage());
                    $this->checkForLikeSpamError($e);
                }
            } else {
                Utils::logEvent("Warning", "No post to like");
                break;
            }
        }
    }

    private function checkForLikeSpamError($error) {
        if (Utils::checkForSpam($error)) {
            $this->config['getFollowers']['like'] = false;
            $this->profilesCollection->updateOne(
                ['_id' => $this->profileId],
                ['$set' => ['config.getFollowers.like' => false]]
            );
            //TODO:
            (new Mailer())->send(
                'no-reply@your-domain.com',
                'bjelobaba60@gmail.com',
                'Feedback requred like',
                'Spam, like is disabled for profile ' . $this->instagramUsername . '. Enable it after 2 days'
            );
            Utils::logEvent("Error", "Spam, like is disabled.");
        }
    }

    private function checkForFollowSpamError($error) {
        if (Utils::checkForSpam($error)) {
            $this->profilesCollection->updateOne(
                ['_id' => $this->profileId],
                ['$set' => ['config.getFollowers.botState' => false]]
            );
            //TODO:
            (new Mailer())->send(
                'no-reply@your-domain.com',
                'bjelobaba60@gmail.com',
                'Feedback requred follow',
                'Spam, bot is disabled for profile ' . $this->instagramUsername . '. Enable it after 1 day'
            );
            Utils::logEvent("Error", "Spam, bot is disabled.");
        }
    }

    private function checkForRequestedResourceDoesNotExistError($error, $instagramId) {
        if (Utils::checkForNoResponseFromServerError($error)) {
            $this->targetsCollection->updateMany(
                ['profile' => $this->profileId, 'profiles.instagramId' => $instagramId],
                ['$set' => ['profiles.$.active' => false]]
            );
        }
    }
}