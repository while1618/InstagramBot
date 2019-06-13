<?php

require_once __DIR__ . '/../general-php-scripts/header/header.php';

$validateTarget = new ValidateTarget();
$validateTarget->validate();
echo $validateTarget->getJsonRespond();

class ValidateTarget {
    private $username;
    private $password;
    private $proxy;
    private $targetUsername;
    private $target;
    private $respondObject;
    private $instagramAPI;

    private static $numberOfFollowersLimit = 20000;

    public function getJsonRespond() {
        return json_encode($this->respondObject);
    }

    public function __construct() {
        global $argv;
        $this->targetUsername = $argv[1];
        $this->username = $argv[2];
        $this->password = $argv[3];
        $this->proxy = $argv[4];
        $this->respondObject = new \stdClass();
        $this->instagramAPI = new \InstagramAPI\Instagram();
    }

    public function validate() {
        try {
            (new LoginInstagram($this->instagramAPI, $this->username, $this->password, $this->proxy, false))->login();
            $this->target = $this->instagramAPI->people->getInfoByName($this->targetUsername)->getUser();
            $this->numberOfFollowersLimit();
            $this->isTargetPrivate();
            $this->respondObject->targetPic = $this->target->getProfilePicUrl();
            $this->respondObject->success = 'success';
        } catch (LoginInstagramException $e) {
            $this->respondObject->error = $e->getMessage();
        } catch (Exception $e) {
            if ($this->checkForInvalidTarget($e)) {
                $this->respondObject->invalidTargetError = "Target $this->targetUsername does not exists on instagram";
            } else if ($this->checkForPrivateTarget($e)) {
                $this->respondObject->privateTargetError = "Target $this->targetUsername is private";
            } else if ($this->checkForFollowersLimit($e)) {
                $this->respondObject->followersLimitError = "Target can not have more than ".self::$numberOfFollowersLimit." followers";
            } else {
                $this->respondObject->error = $e->getMessage();
            }
        }
    }

    private function numberOfFollowersLimit() {
        if ($this->target->getFollowerCount() > self::$numberOfFollowersLimit)
            throw new Exception("Followers Limit");
    }

    /**
     * @throws Exception
     */
    private function isTargetPrivate() {
        if ($this->target->getIsPrivate())
            throw new Exception("Private");
    }

    private function checkForInvalidTarget($e) {
        if (strpos($e->getMessage(), 'User not found') !== false)
            return true;
        return false;
    }

    private function checkForFollowersLimit($e) {
        if (strpos($e->getMessage(), 'Followers Limit') !== false)
            return true;
        return false;
    }

    private function checkForPrivateTarget($e) {
        if (strpos($e->getMessage(), 'Private') !== false)
            return true;
        return false;
    }
}