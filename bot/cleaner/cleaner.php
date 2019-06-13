<?php

require_once __DIR__ . '/../../general-php-scripts/header/header.php';

$beginningTime = microtime(true);
Utils::logEvent("[date of start]", "[" . date("d-m-Y H:i:m") . "]");
(new Cleaner())->clean();
$endingTime = microtime(true);
Utils::timeSpend($beginningTime, $endingTime);
Utils::logEvent("Info", "END\n\n");