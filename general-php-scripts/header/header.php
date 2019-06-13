<?php

/**
 * This file should be included inside every php page.
 * It helps to import all constants and classes that
 * are needed for further application flow.
 */

/**
 * Enables showing all errors and warnings.
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('UTC');

set_time_limit(0);

session_start();

/**
 * This BASE_PATH is used in every class that needs another
 * class included inside it. This variable defines root
 * directory on page where class is used so current class
 * can include another class without errors.
 */
define('BASE_PATH', realpath(dirname(__FILE__)));

/**
 * Dependencies
 */
require_once __DIR__ . '/../../composer/vendor/autoload.php';

require_once __DIR__ . '/../utils/Utils.php';
require_once __DIR__ . '/../database/DataBase.php';
require_once __DIR__ . '/../database/DataBaseInsideDocker.php';
require_once __DIR__ . '/../login_on_instagram/LoginInstagram.php';
require_once __DIR__ . '/../login_on_instagram/LoginInstagramException.php';
require_once __DIR__ . '/../mailer/Mailer.php';

require_once __DIR__ . '/../../bot/validate_targets/ValidateTargets.php';
require_once __DIR__ . '/../../bot/validate_targets/ValidateTargetsUtils.php';
require_once __DIR__ . '/../../bot/get_followers/GetFollowersUtils.php';
require_once __DIR__ . '/../../bot/get_followers/GetFollowers.php';
require_once __DIR__ . '/../../bot/unfollow/Unfollow.php';
require_once __DIR__ . '/../../bot/unfollow/RegularUnfollow.php';
require_once __DIR__ . '/../../bot/unfollow/UnfollowAll.php';
require_once __DIR__ . '/../../bot/unfollow/UnfollowWhoDoNotFollowYou.php';
require_once __DIR__ . '/../../bot/end_of_day/EndOfDay.php';
require_once __DIR__ . '/../../bot/statistics/Statistics.php';
require_once __DIR__ . '/../../bot/target_metrics/TargetMetrics.php';
require_once __DIR__ . '/../../bot/messages/Messages.php';
require_once __DIR__ . '/../../bot/messages/MessagesUtils.php';
require_once __DIR__ . '/../../bot/messages/WhenFollowed.php';
require_once __DIR__ . '/../../bot/post/Post.php';
require_once __DIR__ . '/../../bot/post/PostUtils.php';
require_once __DIR__ . '/../../bot/statistics_and_action_after_update/StatisticsAndActionAfterUpdate.php';
require_once __DIR__ . '/../../bot/cleaner/Cleaner.php';
