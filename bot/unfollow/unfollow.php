<?php

require_once __DIR__ . '/../../general-php-scripts/header/header.php';

$beginningTime = microtime(true);
$profileData = json_decode($argv[1], true);

Utils::logEvent("date of start", "[" . date("d-m-Y H:i:s" . "]"));

$instagramAPI = Utils::initializeInstagramAPI();

if ($profileData['config']['getFollowers']['botState']) {
    Utils::login($instagramAPI, $profileData['instagramData']['instagramUsername'], $profileData['instagramData']['instagramPassword'], $profileData['instagramData']['proxy']);
    (new RegularUnfollow($instagramAPI, $profileData['_id'], $profileData['config']))->start();
} else {
    Utils::logEvent('info', 'Bot is paused');
}

$endingTime = microtime(true);
Utils::timeSpend($beginningTime, $endingTime);
Utils::logEvent("Info", "END\n\n");

