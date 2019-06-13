<?php

require_once __DIR__ . '/../general-php-scripts/header/header.php';

class ExtendedInstagram extends \InstagramAPI\Instagram {
    public function _construct() {}

    public function changeUser($username, $password) {
        $this->_setUser($username, $password);
    }

    public function finishLogin($response, $appRefreshInterval = 1800) {
        $this->_updateLoginState($response);
        $this->_sendLoginFlow(true, $appRefreshInterval);
    }
}

class ChallengeRequired {
    private $code;
    private $checkApiPath;
    private $username;
    private $password;
    private $respondObject;
    private $instagramAPI;

    private static $numberOfFieldRequired;

    public function getJsonRespond() {
        return json_encode($this->respondObject);
    }

    public function __construct() {
        global $argv;
        $this->code = $argv[1];
        $this->checkApiPath = stripcslashes($argv[2]);
        $this->username = $argv[3];
        $this->password = $argv[4];
        $this->respondObject = new \stdClass();
        $this->instagramAPI = new ExtendedInstagram();
        self::$numberOfFieldRequired = 0;
    }

    public function run() {
        try {
            $this->instagramAPI->changeUser($this->username, $this->password);
            $response = $this->instagramAPI->request($this->checkApiPath)
                ->setNeedsAuth(false)
                ->addPost('security_code', $this->code)
                ->addPost('_uuid', $this->instagramAPI->uuid)
                ->addPost('guid', $this->instagramAPI->uuid)
                ->addPost('device_id', $this->instagramAPI->device_id)
                ->addPost('_csrftoken', $this->instagramAPI->client->getToken())
                ->getResponse(new InstagramAPI\Response\LoginResponse());
            $this->instagramAPI->finishLogin($response);
            $this->respondObject->success = 'Logged in';
        } catch (Exception $e) {
            $error = $e->getMessage();
            if (is_array($error)) {
                if ($error['Messages'] === 'This field is required.' && self::$numberOfFieldRequired < 3) {
                    self::$numberOfFieldRequired++;
                    if (self::$numberOfFieldRequired > 3) {
                        $this->respondObject->error = $error;
                    } else {
                        $this->run();
                    }
                } else {
                    $this->respondObject->error = $error;
                }
            } else {
                $this->respondObject->error = $error;
            }
        }
    }
}

$challengeRequired = new ChallengeRequired();
$challengeRequired->run();
echo $challengeRequired->getJsonRespond();