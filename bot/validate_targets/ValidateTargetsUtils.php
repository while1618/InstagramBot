<?php

class ValidateTargetsUtils {
    public static function getTargetsToValidate($profileId) {
        $targetsCollection = (new DataBase())->getCollection('targets');
        return $targetsCollection->find(['profile' => $profileId, 'verifyData.verify' => false])->toArray();
    }
}