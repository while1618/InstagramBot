<?php

require_once __DIR__ . '/../general-php-scripts/header/header.php';

$beginningTime = microtime(true);
Utils::logEvent("date of start", "[" . date("d-m-Y H:i:s" . "]"));
$createStatistics = new CreateStatistics();
$createStatistics->create();
$endingTime = microtime(true);
Utils::timeSpend($beginningTime, $endingTime);
Utils::logEvent("Info", "END\n\n");

class CreateStatistics {
    private $username;
    private $password;
    private $proxy;
    private $instagramAPI;
    private $profilesCollection;
    private $statisticsCollection;

    private static $numberOfErrors = 0;

    public function __construct() {
        global $argv;
        $this->username = $argv[1];
        $this->password = $argv[2];
        $this->proxy = $argv[3];
        $this->instagramAPI = new \InstagramAPI\Instagram();
        $this->profilesCollection = (new DataBaseInsideDocker())->getCollection('profiles');
        $this->statisticsCollection = (new DataBaseInsideDocker())->getCollection('statistics');
    }

    public function create() {
        try {
            (new LoginInstagram($this->instagramAPI, $this->username, $this->password, $this->proxy, false))->login();
            $followers = $this->getFollowers();
            $following = $this->getFollowing();
            $profile = $this->profilesCollection->findOne(['instagramData.instagramUsername' => $this->username]);
            $this->statisticsCollection->insertOne([
                'owner' => $profile['owner'],
                'profile' => $profile['_id'],
                'createdAt' => new MongoDB\BSON\UTCDateTime(),
                'statistics' => [],
                'followers' => $followers,
                'following' => $following
            ]);
            $this->profilesCollection->updateOne(
                [
                    'instagramData.instagramUsername' => $this->username
                ],
                [
                    '$set' => ['instagramData.initStatistics' => true]
                ]
            );
            Utils::logEvent('info', 'Statistics for ' . $this->username . ' created');
        } catch (Exception $e) {
            if ((Utils::checkForCurl18Error($e) || Utils::checkForNoResponseFromServerError($e) || Utils::checkForCurl61Error($e)) && self::$numberOfErrors < 10) {
                self::$numberOfErrors++;
                $this->create();
            }
            Utils::logEvent('error', $e->getMessage());
            Utils::logEvent("error", self::$numberOfErrors);
            Utils::stopProgram();
        }
    }

    private function getFollowers($pageLimit = 0) {
        Utils::logEvent('info', "Getting followers from instagram");
        $selfFollowers = [];
        $maxId = null;
        $pageCount = 0;
        $rankToken = Utils::generateRankToken();
        do {
            $followers = $this->instagramAPI->people->getSelfFollowers($rankToken, null, $maxId);
            foreach ($followers->getUsers() as $follower)
                $selfFollowers []= ['instagramId' => $follower->getPk(), 'username' => $follower->getUsername()];
            if ($pageLimit > 0 && $pageCount == $pageLimit)
                break;
            $maxId = $followers->getNextMaxId();
            $pageCount++;
            Utils::logEvent('info', 'Next page');
            Utils::makePause(4);
        } while ($maxId !== null);
        return $selfFollowers;
    }

    private function getFollowing($pageLimit = 0) {
        Utils::logEvent('info', "Getting following from instagram");
        $selfFollowing = [];
        $maxId = null;
        $pageCount = 0;
        $rankToken = \InstagramAPI\Signatures::generateUUID();
        do {
            $followings = $this->instagramAPI->people->getSelfFollowing($rankToken, null, $maxId);
            foreach ($followings->getUsers() as $following)
                $selfFollowing []= ['instagramId' => $following->getPk(), 'username' => $following->getUsername()];
            if ($pageLimit > 0 && $pageCount == $pageLimit)
                break;
            $maxId = $followings->getNextMaxId();
            $pageCount++;
            Utils::logEvent('info', 'Next page');
            Utils::makePause(4);
        } while ($maxId !== null);
        return $selfFollowing;
    }
}