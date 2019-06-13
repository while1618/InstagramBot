<?php

require_once __DIR__ . '/../general-php-scripts/header/header.php';

$tryToLogin = new TryToLogin();
$tryToLogin->run();
echo $tryToLogin->getJsonRespond();

class TryToLogin {
    private $username;
    private $password;
    private $proxy;
    private $respondObject;
    private $instagramAPI;
    private $verificationMethod;

    private static $numberOfLogin = 0;

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
        $this->verificationMethod = 1;   // 0 = SMS, 1 = Email
    }

    public function run() {
        try {
            self::$numberOfLogin++;
//            $this->instagramAPI->setProxy("https://" . $this->proxy);
            $this->instagramAPI->login($this->username, $this->password);
            $this->respondObject->numberOfFollowers = $this->instagramAPI->people->getSelfInfo()->getUser()->getFollowerCount();
            $this->respondObject->success = "Logged in";
        } catch (Exception $e) {
            if($this->checkForCurlError($e) && self::$numberOfLogin < 10) {
                $this->run();
            }
            if ($this->checkForChallengeRequired($e)) {
                $this->respondObject->error = "Challenge required";
                $this->sendInstagramCodeToValidateLogin($e);
            } else {
                $this->respondObject->error = $e->getMessage();
            }
        }
    }

    private function checkForCurlError($e) {
        if (strpos($e->getMessage(), 'CURL error 7') !== false)
            return true;
        return false;
    }

    private function checkForChallengeRequired($e) {
        if (strpos($e->getMessage(), 'Challenge required') !== false)
            return true;
        return false;
    }

    private function sendInstagramCodeToValidateLogin($e) {
        sleep(3);
        $checkApiPath = substr( $e->getResponse()->getChallenge()->getApiPath(), 1);
        $this->instagramAPI->request($checkApiPath)
            ->setNeedsAuth(false)
            ->addPost('choice', $this->verificationMethod)
            ->addPost('_uuid', $this->instagramAPI->uuid)
            ->addPost('guid', $this->instagramAPI->uuid)
            ->addPost('device_id', $this->instagramAPI->device_id)
            ->addPost('_csrftoken', $this->instagramAPI->client->getToken())
            ->getDecodedResponse();
        $this->respondObject->checkApiPath = $checkApiPath;
    }
}