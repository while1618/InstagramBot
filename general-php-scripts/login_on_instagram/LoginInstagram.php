<?php

use Blocktrail\CryptoJSAES\CryptoJSAES;

class LoginInstagram {
    private $instagramAPI;
    private $username;
    private $password;
    private $proxy;
    private $passphrase;
    private $decrypt;

    private static $numberOfLogin;

    /**
     * LoginInstagram constructor.
     * @param $instagramAPI \InstagramAPI\Instagram
     * @param $username
     * @param $password
     * @param $proxy
     * @param bool $decrypt
     */
    public function __construct($instagramAPI, $username, $password, $proxy, $decrypt = true) {
        self::$numberOfLogin = 0;
        $this->instagramAPI = $instagramAPI;
        $this->username = $username;
        $this->password = $password;
        $this->proxy = $proxy;
        $this->decrypt = $decrypt;
        //TODO:
        $this->passphrase = "your-password-for-AES";
    }

    /**
     * @throws LoginInstagramException
     */
    public function login() {
        try {
            self::$numberOfLogin++;
//            $this->instagramAPI->setProxy("https://" . $this->proxy);
            if ($this->decrypt) {
                $this->password = CryptoJSAES::decrypt($this->password, $this->passphrase);
            }
            $this->instagramAPI->login($this->username, $this->password);
        } catch (\Exception $e) {
            if(($this->checkForCurl7Error($e) || Utils::checkForCurl61Error($e) || Utils::checkForCurl18Error($e) || Utils::checkForNoResponseFromServerError($e)) && self::$numberOfLogin < 10) {
                $this->login();
            }
            throw new LoginInstagramException($e->getMessage());
        }
    }

    private function checkForCurl7Error($e) {
        if (strpos($e->getMessage(), 'CURL error 7') !== false)
            return true;
        return false;
    }
}
