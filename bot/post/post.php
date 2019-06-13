<?php

require_once __DIR__ . '/../../general-php-scripts/header/header.php';

$beginningTime = microtime(true);
$profileData = json_decode($argv[1], true);

Utils::logEvent("date of start", "[" . date("d-m-Y H:i:s" . "]"));

$posts = PostUtils::getPosts($profileData['_id']);
if (empty($posts)) {
    Utils::logEvent('info', 'No posts to upload');
    Utils::stopProgram();
}

$instagramAPI = Utils::initializeInstagramAPI();
Utils::login($instagramAPI, $profileData['instagramData']['instagramUsername'], $profileData['instagramData']['instagramPassword'], $profileData['instagramData']['proxy']);
(new Post($instagramAPI, $profileData['_id'], $profileData['config'], $posts))->upload();

$endingTime = microtime(true);
Utils::timeSpend($beginningTime, $endingTime);
Utils::logEvent("Info", "END\n\n");