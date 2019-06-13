<?php

use Mailgun\Mailgun;

class Mailer {
    //TODO:
    const API_KEY = 'your-api-key';
    const DOMAIN = 'your-domain-name';
    private $mailGun;

    public function __construct() {
        $this->mailGun = Mailgun::create(self::API_KEY);
    }

    public function send($from, $to, $subject, $text) {
        try {
            $this->mailGun->messages()->send(self::DOMAIN, [
                'from' => $from,
                'to' => $to,
                'subject' => $subject,
                'text' => $text
            ]);
        } catch (Exception $e) {
            Utils::logEvent('EmailError', $e->getMessage());
        }
    }
}