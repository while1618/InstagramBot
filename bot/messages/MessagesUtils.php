<?php

class MessagesUtils {

    public static function getMessagesToSend($profileId) {
        $messagesCollection = (new DataBase())->getCollection('messages');
        return $messagesCollection->find(
            ['profile' => $profileId, 'whenToSendMessage' => ['$lt' => new MongoDB\BSON\UTCDateTime()]]
        )->toArray();
    }

    public static function checkForNumberOfDailyMessages($profileId) {
        $profilesCollection = (new DataBase())->getCollection('profiles');
        $profile = iterator_to_array($profilesCollection->findOne(
            ['_id' => $profileId, 'config.message.numberOfDailyMessages' => ['$gt' => 0]]
        ));
        if (empty($profile))
            return false;
        return true;
    }

    public static function reduceNumberOfDailyMessages($profileId) {
        $profilesCollection = (new DataBase())->getCollection('profiles');
        $profilesCollection->updateOne(
            ['_id' => $profileId],
            ['$inc' => ['config.message.numberOfDailyMessages' => -1]]
        );
    }

}