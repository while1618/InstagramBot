<?php

class Messages {
    private $instagramAPI;
    private $profileId;
    private $config;
    private $messagesCollection;
    private $filesCollection;
    private $profilesCollection;
    private $messages;
    private $recipients;
    private $file;

    private static $filePath = "/var/InstagramBot/uploads/";

    /**
     * Messages constructor.
     * @param $instagramAPI \InstagramAPI\Instagram
     * @param $profileId
     * @param $config
     * @param $messages
     */
    public function __construct($instagramAPI, $profileId, $config, $messages) {
        $this->instagramAPI = $instagramAPI;
        $this->profileId = $profileId;
        $this->config = $config;
        $this->messages = $messages;
        $this->messagesCollection = (new DataBase())->getCollection('messages');
        $this->filesCollection = (new DataBase())->getCollection('files');
        $this->profilesCollection = (new DataBase())->getCollection('profiles');
    }

    public function send() {
        foreach ($this->messages as $message) {
            $this->recipients = $this->getRecipients($message['sendMessageTo']);
            if ($message['messageType'] === 'fileMessage') {
                $this->file = iterator_to_array($this->filesCollection->findOne(
                    ['_id' => $message['additionalMessageData']['file']]
                ));
                $this->sendMessageToRecipients($message, 'sendFileMessage');
            } else {
                $this->sendMessageToRecipients($message, 'sendTextMessage');
            }
            Utils::logEvent('info', 'Message with id: ' . $message['_id'] . ' finished');
            $this->deleteMessage($message);
        }
    }

    private function sendMessageToRecipients($message, $functionName) {
        foreach ($this->recipients as $recipient) {
            try {
                if (!MessagesUtils::checkForNumberOfDailyMessages($this->profileId)) {
                    throw new Exception('Limit of daily messages reached');
                }
                $this->$functionName(['users' => [$recipient['userId']]], $message);
                MessagesUtils::reduceNumberOfDailyMessages($this->profileId);
                Utils::logEvent('info', 'Messages successfully sent to ' . $recipient['username']);
                Utils::makePause($this->config['message']['pauseBetweenMessages']);
            } catch (Exception $e) {
                Utils::logEvent('Error', $e->getMessage());
                if ($e->getMessage() === 'Limit of daily messages reached')
                    break;
            }
        }
    }

    private function sendTextMessage($recipient, $message) {
        $this->instagramAPI->direct->sendText($recipient, $message['additionalMessageData']['textMessage']);
    }

    private function sendFileMessage($recipient, $message) {
        $path = self::$filePath . $this->file['_id'] . $this->file['extensionWithDot'];
        if ($this->file['isVideo']) {
            $video = new \InstagramAPI\Media\Video\InstagramVideo($path, ['targetFeed' => \InstagramAPI\Constants::FEED_DIRECT, 'operation' => \InstagramAPI\Media\InstagramMedia::EXPAND]);
            $this->instagramAPI->direct->sendVideo($recipient, $video->getFile());
        } else if ($this->file['isImage']) {
            $photo = new \InstagramAPI\Media\Photo\InstagramPhoto($path);
            $this->instagramAPI->direct->sendPhoto($recipient, $photo->getFile());
        }
    }

    private function deleteMessage($message) {
        $this->messagesCollection->deleteOne(
            ['_id' => $message['_id']]
        );
        if ($message['messageType'] === 'fileMessage') {
            shell_exec("rm -rf " . self::$filePath . $this->file['_id'] . $this->file['extensionWithDot']);
            $this->filesCollection->deleteOne(
                ['_id' => $message['additionalMessageData']['file']]
            );
        }
        Utils::logEvent('info', 'Message with id: ' . $message['_id'] . ' deleted');
    }

    private function getRecipients($userGroupId) {
        $recipients = [];
        $userGroup = $this->profilesCollection->aggregate([
            [
                '$match' => [
                    '_id' => $this->profileId
                ]
            ],
            [
                '$group' => ['_id' => null, 'usersGroups' => ['$push' => '$messageData.usersGroups']]
            ],
            [
                '$project' => [
                    '_id' => 0,
                    'usersGroups' => [
                        '$reduce' => [
                            'input' => '$usersGroups',
                            'initialValue' => [],
                            'in' => [
                                '$concatArrays' => [
                                    '$$value', '$$this'
                                ]
                            ]
                        ]
                    ]
                ]
            ],
            [
                '$project' => [
                    'usersGroups' => [
                        '$filter' => [
                            'input' => '$usersGroups',
                            'as' => 'userGroup',
                            'cond' => [
                                ['$eq' => ['$$userGroup.userGroupId', $userGroupId]]
                            ]
                        ]
                    ]
                ]
            ]
        ])->toArray();
        $userGroup = iterator_to_array($userGroup[0]['usersGroups'][0]);
        foreach ($userGroup['userGroupMembers'] as $member)
            $recipients []= ['userId' => $this->instagramAPI->people->getUserIdForName($member), 'username' => $member];
        return $recipients;
    }
}