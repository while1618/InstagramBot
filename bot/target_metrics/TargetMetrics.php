<?php

class TargetMetrics {
    private $profileId;
    private $targetsCollection;
    private $statisticsCollection;
    private $targets;
    private $profileFollowers;
    private $coverage;
    private $unfollowRate;
    private $successRate;

    public function __construct($profileId) {
        $this->profileId = $profileId;
        $this->targetsCollection = (new DataBase())->getCollection('targets');
        $this->statisticsCollection = (new DataBase())->getCollection('statistics');
        $this->targets = $this->getTargets();
        $this->profileFollowers = $this->getProfileFollowers();
    }

    private function getTargets() {
        return $this->targetsCollection->find(
            ['profile' => $this->profileId, 'verifyData.verify' => true]
        )->toArray();
    }

    private function getProfileFollowers() {
        return iterator_to_array($this->statisticsCollection->findOne(
            ['profile' => $this->profileId],
            ['projection' => ['_id' => 0, 'followers' => 1]]
        )['followers']);
    }

    public function update() {
        if (empty($this->targets)) {
            Utils::logEvent('info', 'No targets');
        } else {
            foreach ($this->targets as $target) {
                Utils::logEvent('info', 'Calculating metric for target: ' . $target['targetUsername']);
                $this->coverage = $this->calculateCoverage($target);
                $this->unfollowRate = $this->calculateUnfollowRate($target);
                $this->successRate = $this->calculateSuccessRate($target);
                $this->updateTargetInDB($target);
            }
        }
    }

    private function calculateCoverage($target) {
        $numberOfTargetFollowers = count($target['profiles']);
        $numberOfHandledTargetFollowers = 0;
        foreach ($target['profiles'] as $profile) {
            if (!is_null($profile['unfollowSchedule']) || !$profile['active'])
                $numberOfHandledTargetFollowers++;
        }
        $percent = round(($numberOfHandledTargetFollowers / $numberOfTargetFollowers) * 100, 2);
        return "$numberOfHandledTargetFollowers ($percent%)";
    }

    private function calculateUnfollowRate($target) {
        $numberOfTargetFollowers = count($target['profiles']);
        $numberOfUnfollowedProfiles = 0;
        foreach ($target['profiles'] as $profile) {
            if (!($profile['active']))
                $numberOfUnfollowedProfiles++;
        }
        $percent = round(($numberOfUnfollowedProfiles / $numberOfTargetFollowers) * 100, 2);
        return "$numberOfUnfollowedProfiles ($percent%)";
}

    private function calculateSuccessRate($target) {
        $numberOfHandledProfiles = 0;
        $numberOfProfilesWhoFollowedYou = 0;
        foreach ($target['profiles'] as $profile) {
            if (!is_null($profile['unfollowSchedule']) || !$profile['active']) {
                $numberOfHandledProfiles++;
                if (Utils::isInArrayOfObjects($profile['instagramId'], 'instagramId', $this->profileFollowers))
                    $numberOfProfilesWhoFollowedYou++;
            }
        }
        if ($numberOfHandledProfiles == 0)
            return "0 (0.00%)";
        $percent = round(($numberOfProfilesWhoFollowedYou / $numberOfHandledProfiles) * 100, 2);
        return "$numberOfProfilesWhoFollowedYou ($percent%)";
    }

    private function updateTargetInDB($target) {
        $this->targetsCollection->updateOne(
            ['_id' => $target['_id']],
            [
                '$set' => [
                    'metric.coverage' => $this->coverage,
                    'metric.unfollowRate' => $this->unfollowRate,
                    'metric.successRate' => $this->successRate
                ]
            ]
        );
    }
}