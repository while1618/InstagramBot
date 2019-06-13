<?php

require_once __DIR__ . '/../../general-php-scripts/header/header.php';

$beginningTime = microtime(true);
$profileData = json_decode($argv[1], true);

Utils::logEvent("date of start", "[" . date("d-m-Y H:i:s" . "]"));

if (GetFollowersUtils::pauseDay($profileData['config']['getFollowers']['pauseDay'], $profileData['_id'])) {
    Utils::logEvent("Info", "Pause day");
    Utils::stopProgram();
}

if (!GetFollowersUtils::checkIfProfileIsReadyToStart($profileData['config']['getFollowers']['whenToStartBot'], $profileData['config']['getFollowers']['currentlyWorking']))
    Utils::stopProgram();

if (!$profileData['config']['getFollowers']['botState']) {
    Utils::logEvent("Info", "Bot is paused");
    Utils::stopProgram();
}

if (!GetFollowersUtils::checkIfProfileHaveTargets($profileData['_id'])) {
    Utils::logEvent("Info", "Profile does not have targets");
    Utils::stopProgram();
}

$instagramAPI = Utils::initializeInstagramAPI();
Utils::login($instagramAPI, $profileData['instagramData']['instagramUsername'], $profileData['instagramData']['instagramPassword'], $profileData['instagramData']['proxy']);
$profilesToFollow = GetFollowersUtils::getProfilesToFollow($profileData['_id'], $profileData['config']['getFollowers']['howMuchFollows'], $profileData['config']['getFollowers']['howMuchFollowsOffset']);
GetFollowersUtils::changeCurrentlyWorkingStatus(true, "Bot started!", $profileData['_id']);
(new GetFollowers($instagramAPI, $profileData['_id'], $profileData['instagramData']['instagramUsername'], $profileData['config'], $profilesToFollow))->start();
GetFollowersUtils::changeCurrentlyWorkingStatus(false, "Bot finished!", $profileData['_id']);

$endingTime = microtime(true);
Utils::timeSpend($beginningTime, $endingTime);
Utils::logEvent("Info", "END\n\n");
