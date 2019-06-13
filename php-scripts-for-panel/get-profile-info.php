<?php

require_once __DIR__ . '/../general-php-scripts/header/header.php';

$profileInfo = new ProfileInfo();
$profileInfo->getProfileInfo();
echo $profileInfo->getJsonRespond();

class ProfileInfo {
    private $username;
    private $password;
    private $proxy;
    private $respondObject;
    private $instagramAPI;

    public function getJsonRespond() {
        return json_encode($this->respondObject);
    }

    public function __construct() {
        global $argv;
        $this->username = $argv[1];
        $this->password = $argv[2];
        $this->proxy = $argv[3];
        $this->respondObject = new \stdClass();
        $this->instagramAPI = new \InstagramAPI\Instagram();
    }

    public function getProfileInfo() {
        try {
            (new LoginInstagram($this->instagramAPI, $this->username, $this->password, $this->proxy, false))->login();
            $this->respondObject->business = $this->getBusiness();
            $this->respondObject->success = 'success';
        } catch (LoginInstagramException $e) {
            $this->respondObject->error = $e->getMessage();
        } catch (Exception $e) {
            $this->respondObject->error = $e->getMessage();
        }
    }

    private function getBusiness() {
        return $this->instagramAPI->people->getSelfInfo()->getUser()->getIsBusiness();
    }
}