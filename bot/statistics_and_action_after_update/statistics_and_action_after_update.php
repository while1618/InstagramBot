<?php

require_once __DIR__ . '/../../general-php-scripts/header/header.php';

$beginningTime = microtime(true);
$profileData = json_decode($argv[1], true);

Utils::logEvent("date of start", "[" . date("d-m-Y H:i:s" . "]"));

$instagramAPI = Utils::initializeInstagramAPI();
Utils::login($instagramAPI, $profileData['instagramData']['instagramUsername'], $profileData['instagramData']['instagramPassword'], $profileData['instagramData']['proxy']);
(new StatisticsAndActionAfterUpdate($instagramAPI, $profileData['_id'], $profileData['instagramData']['instagramUsername'], $profileData['config']))->start();

$endingTime = microtime(true);
Utils::timeSpend($beginningTime, $endingTime);
Utils::logEvent("Info", "END\n\n");
