<?php

require_once __DIR__ . '/../../general-php-scripts/header/header.php';

$username = '';
$profiles = [];
$profilesCollection = (new DataBase())->getCollection('profiles');
$data = iterator_to_array($profilesCollection->findOne(
    ['instagramData.instagramUsername' => $username],
    ['projection' => [
        '_id' => 0,
        'instagramData' => 1
    ]]
));

$api = Utils::initializeInstagramAPI(true, false);
Utils::login($api, $data['instagramData']['instagramUsername'], $data['instagramData']['instagramPassword'], $data['instagramData']['proxy']);
foreach ($profiles as $profile) {
    try {
        $id = $api->people->getUserIdForName($profile);
        $api->people->follow($id);
    } catch (Exception $e) {
        echo $e->getMessage();
    }
}