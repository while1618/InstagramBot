<?php


require_once __DIR__ . '/../../general-php-scripts/header/header.php';

$beginningTime = microtime(true);
$profileData = json_decode($argv[1], true);

Utils::logEvent("date of start", "[" . date("d-m-Y H:i:s" . "]"));

$messages = MessagesUtils::getMessagesToSend($profileData['_id']);
if (empty($messages)) {
    Utils::logEvent('info', 'No messages to send');
    Utils::stopProgram();
}

$instagramAPI = Utils::initializeInstagramAPI();
Utils::login($instagramAPI, $profileData['instagramData']['instagramUsername'], $profileData['instagramData']['instagramPassword'], $profileData['instagramData']['proxy']);
(new Messages($instagramAPI, $profileData['_id'], $profileData['config'], $messages))->send();

$endingTime = microtime(true);
Utils::timeSpend($beginningTime, $endingTime);
Utils::logEvent("Info", "END\n\n");