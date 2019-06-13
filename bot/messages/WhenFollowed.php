<?php

class WhenFollowed {
    private $instagramAPI;
    private $profileId;
    private $sendMessagesTo;
    private $message;
    private $profilesCollection;
    private $config;

    /**
     * WhenFollowed constructor.
     * @param $instagramAPI \InstagramAPI\Instagram
     * @param $profileId
     * @param $config
     * @param $sendMessagesTo
     */
    public function __construct($instagramAPI, $profileId, $config, $sendMessagesTo) {
        $this->instagramAPI = $instagramAPI;
        $this->profileId = $profileId;
        $this->config = $config;
        $this->sendMessagesTo = $sendMessagesTo;
        $this->profilesCollection = (new DataBase())->getCollection('profiles');
        $this->message = $this->getWhenFollowedMessage();
    }

    private function getWhenFollowedMessage() {
        $whenFollowedMessages = $this->profilesCollection->aggregate([
            [
                '$match' => ['_id' => $this->profileId]
            ],
            [
                '$group' => ['_id' => null, 'whenFollowedMessages' => ['$push'=> '$messageData.whenFollowedMessages']]
            ],
            [
                '$project' => [
                    '_id' => 0,
                    'whenFollowedMessages' => [
                        '$reduce' => [
                            'input' => '$whenFollowedMessages',
                            'initialValue' => [],
                            'in' => ['$concatArrays' => [
                                '$$value', '$$this']
                            ]
                        ]
                    ]
                ]
            ],
            [
                '$project' => [
                    'whenFollowedMessages' => [
                        '$filter' => [
                            'input' => '$whenFollowedMessages',
                            'as' => 'whenFollowedMessage',
                            'cond' => [
                                '$eq' => ['$$whenFollowedMessage.pause', false]
                            ]
                        ]
                    ]
                ]
            ]
        ])->toArray();
        $whenFollowedMessage = iterator_to_array($whenFollowedMessages[0]['whenFollowedMessages']);
        if (empty($whenFollowedMessage)) {

            return null;
        }
        return $whenFollowedMessage[rand(0, count($whenFollowedMessage) - 1)]['message'];
    }

    public function send() {
        if (empty($this->sendMessagesTo)) {
            Utils::logEvent('info', 'No new followers to send message');
        } else if (is_null($this->message)) {
            Utils::logEvent('error', 'When followed message is not set');
        } else {
            foreach ($this->sendMessagesTo as $profile) {
                try {
                    if (!MessagesUtils::checkForNumberOfDailyMessages($this->profileId)) {
                        throw new Exception('Limit of daily messages reached');
                    }
                    $this->instagramAPI->direct->sendText(['users' => [$profile->instagramId]], $this->message);
                    MessagesUtils::reduceNumberOfDailyMessages($this->profileId);
                    Utils::logEvent('info', 'Messages successfully sent to ' . $profile->username);
                    Utils::makePause($this->config['message']['pauseBetweenMessages']);
                } catch (Exception $e) {
                    Utils::logEvent('Error', $e->getMessage());
                    if ($e->getMessage() === 'Limit of daily messages reached') {
                        break;
                    }
                }
            }
        }
    }
}