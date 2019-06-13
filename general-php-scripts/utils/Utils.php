<?php

class Utils {

    /**
     * @param bool $debug
     * @param bool $truncatedDebug
     * @return \InstagramAPI\Instagram
     */
    public static function initializeInstagramAPI($debug = false, $truncatedDebug = false) {
        $instagramAPI = new \InstagramAPI\Instagram($debug, $truncatedDebug);
        Utils::logEvent("Info", "Instagram API is initialized.");

        return $instagramAPI;
    }

    /**
     * @param \InstagramAPI\Instagram $instagramAPI
     * @param $username
     * @param $password
     * @param $proxy
     */
    public static function login($instagramAPI, $username, $password, $proxy) {
        try {
            (new LoginInstagram($instagramAPI, $username, $password, $proxy))->login();
        } catch (LoginInstagramException $e) {
            Utils::logEvent("Error", $e->getMessage());
            Utils::stopProgram();
        }
    }

    public static function generateRankToken() {
        $rankToken = \InstagramAPI\Signatures::generateUUID();
        Utils::logEvent("Info", "Rank Token is generated.");

        return $rankToken;
    }

    public static function logEvent($level, $message) {
        echo strtoupper($level) . ": " . $message . PHP_EOL;
    }

    public static function stopProgram() {
        Utils::logEvent("Info", "Program stopped successfully.\n\n");
        exit(0);
    }

    public static function makePause($pause) {
        $sleepTime = round(rand($pause - ($pause * 0.2), $pause + ($pause * 0.2)));
        Utils::logEvent("INFO", "Sleeping for " . $sleepTime . " seconds");
        sleep($sleepTime);
    }

    public static function isInArrayOfObjects($value, $index, $array) {
        foreach ($array as $item) {
            if ($item[$index] === $value)
                return true;
        }
        return false;
    }

    public static function timeSpend($beginningTime, $endingTime) {
        $timeSpend = $endingTime - $beginningTime;
        Utils::logEvent('Info', 'Total Execution Time: ' . $timeSpend);
    }

    /**
     * @param \InstagramAPI\Instagram $instagramAPI
     * @param $username
     * @param int $pageLimit
     * @return \InstagramAPI\Response\Model\User[] array
     */
    public static function getFollowingFromInstagram($instagramAPI, $username, $pageLimit = 0) {
        Utils::logEvent('info', "Getting following from instagram");
        $userFollowing = [];
        $maxId = null;
        $pageCount = 0;
        $rankToken = Utils::generateRankToken();
        $userId = $instagramAPI->people->getUserIdForName($username);
        do {
            $followings = $instagramAPI->people->getFollowing($userId, $rankToken, null, $maxId);
            foreach ($followings->getUsers() as $following) {
                $userFollowing []= $following;
            }
            if ($pageLimit > 0 && $pageCount == $pageLimit)
                break;
            $maxId = $followings->getNextMaxId();
            $pageCount++;
            self::logEvent('info', 'Next page');
            self::makePause(4);
        } while ($maxId !== null);
        return $userFollowing;
    }

    /**
     * @param \InstagramAPI\Instagram $instagramAPI
     * @param $username
     * @param int $pageLimit
     * @return \InstagramAPI\Response\Model\User[] array
     */
    public static function getFollowersFromInstagram($instagramAPI, $username, $pageLimit = 0) {
        Utils::logEvent('info', "Getting followers from instagram");
        $userFollowers = [];
        $maxId = null;
        $pageCount = 0;
        $rankToken = Utils::generateRankToken();
        $userId = $instagramAPI->people->getUserIdForName($username);
        do {
            $followers = $instagramAPI->people->getFollowers($userId, $rankToken, null, $maxId);
            foreach ($followers->getUsers() as $follower) {
                $userFollowers []= $follower;
            }
            if ($pageLimit > 0 && $pageCount == $pageLimit)
                break;
            $maxId = $followers->getNextMaxId();
            $pageCount++;
            self::logEvent('info', 'Next page');
            self::makePause(4);
        } while ($maxId !== null);
        return $userFollowers;
    }

    public static function getFollowingFromDataBase($profileId) {
        Utils::logEvent('info', "Getting following from database");
        $statisticsCollection = (new DataBase())->getCollection('statistics');
        return iterator_to_array($statisticsCollection->findOne(
            ['profile' => $profileId],
            ['projection' => ['_id' => 0, 'following' => 1]]
        )['following']);
    }

    public static function getFollowersFromDataBase($profileId) {
        Utils::logEvent('info', "Getting followers from database");
        $statisticsCollection = (new DataBase())->getCollection('statistics');
        return iterator_to_array($statisticsCollection->findOne(
            ['profile' => $profileId],
            ['projection' => ['_id' => 0, 'followers' => 1]]
        )['followers']);
    }

    public static function checkForCurl18Error($e) {
        if (strpos($e->getMessage(), 'CURL error 18') !== false)
            return true;
        return false;
    }

    public static function checkForNoResponseFromServerError($e) {
        if (strpos($e->getMessage(), 'No response from server') !== false)
            return true;
        return false;
    }

    public static function checkForCurl61Error($e) {
        if (strpos($e->getMessage(), 'CURL error 61') !== false)
            return true;
        return false;
    }

    public static function checkForRequestedResourceDoesNotExist($e) {
        if (strpos($e->getMessage(), 'Requested resource does not exist') !== false)
            return true;
        return false;
    }

    public static function checkForSpam($e) {
        if (strpos($e->getMessage(), 'Feedback required') !== false)
            return true;
        return false;
    }
}