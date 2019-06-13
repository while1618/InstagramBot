<?php

require_once __DIR__ . '/../general-php-scripts/header/header.php';

$isThisYou = new IsThisYou();
$isThisYou->getInfo();
echo $isThisYou->getJsonRespond();

class IsThisYou {
    private $username;
    private $respondObject;
    private $instagramAPI;
    private $password;
    private $proxy;

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

    public function getInfo() {
        try {
            (new LoginInstagram($this->instagramAPI, $this->username, $this->password, $this->proxy, false))->login();
            $user = $this->instagramAPI->people->getSelfInfo()->getUser();
            $this->respondObject->profilePic = $user->getProfilePicUrl();
            $this->respondObject->username = $this->username;
            $this->respondObject->success = 'Data taken';
        } catch (LoginInstagramException $e) {
            $this->respondObject->error = $e->getMessage();
        } catch (Exception $e) {
            $this->respondObject->error = $e->getMessage();
        }
    }
}
