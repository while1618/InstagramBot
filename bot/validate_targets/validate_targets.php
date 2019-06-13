<?php

require_once __DIR__ . '/../../general-php-scripts/header/header.php';

$beginningTime = microtime(true);
$profileData = json_decode($argv[1], true);

Utils::logEvent("[date of start]", "[" . date("d-m-Y H:i:m") . "]");

$targetsToValidate = ValidateTargetsUtils::getTargetsToValidate($profileData['_id']);
if (empty($targetsToValidate)) {
    Utils::logEvent('info', 'No targets to validate');
    Utils::stopProgram();
}

$instagramAPI = Utils::initializeInstagramAPI();
Utils::login($instagramAPI, $profileData['instagramData']['instagramUsername'], $profileData['instagramData']['instagramPassword'], $profileData['instagramData']['proxy']);
(new ValidateTargets($instagramAPI, $profileData['_id'], $profileData['instagramData']['instagramUsername'], $targetsToValidate))->validate();

$endingTime = microtime(true);
Utils::timeSpend($beginningTime, $endingTime);
Utils::logEvent("info", "END\n\n");