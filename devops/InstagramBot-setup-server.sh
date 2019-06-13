#!/bin/bash

if [[ "$EUID" -eq 0 ]]
  then echo "Please do not run it with sudo"
  exit
fi

cd

#cloning git
echo "Cloning git... Enter branch name to clone: "
read BRANCH
#TODO:
git clone -b ${BRANCH} https:// #your git link

#delete unnecessary files
rm -rf InstagramBot/devops/
rm -rf InstagramBot/panel/
rm -rf InstagramBot/.git/
rm -rf InstagramBot/.gitignore

#composer
cd InstagramBot/
mkdir composer
cd composer/
composer require mgp25/instagram-php
composer require mongodb/mongodb
composer require mailgun/mailgun-php kriswallsmith/buzz nyholm/psr7
composer require blocktrail/cryptojs-aes-php

#creating dirs for log files
sudo mkdir /var/log/InstagramBot
sudo mkdir /var/log/InstagramBot/get_followers
sudo mkdir /var/log/InstagramBot/messages
sudo mkdir /var/log/InstagramBot/post
sudo mkdir /var/log/InstagramBot/statistics_and_action_after_update
sudo mkdir /var/log/InstagramBot/unfollow
sudo mkdir /var/log/InstagramBot/validate_targets
sudo mkdir /var/log/InstagramBot/end_of_day
sudo mkdir /var/log/InstagramBot/init_statistics
sudo mkdir /var/log/InstagramBot/challenge_required
sudo mkdir /var/log/InstagramBot/cleaner

sudo chmod 755 -R /var/log/InstagramBot/

#creating cron job
cd
sudo crontab -l > cron_file
echo "*/30 * * * * /usr/bin/python3 /var/InstagramBot/bot/python/start_get_followers.py" | sudo tee --append cron_file
echo "*/05,20,35,50 * * * * /usr/bin/python3 /var/InstagramBot/bot/python/start_messages.py" | sudo tee --append cron_file
echo "*/15 * * * * /usr/bin/python3 /var/InstagramBot/bot/python/start_post.py" | sudo tee --append cron_file
echo "00 * * * * /usr/bin/python3 /var/InstagramBot/bot/python/start_statistics_and_action_after_update.py" | sudo tee --append cron_file
echo "05 * * * * /usr/bin/python3 /var/InstagramBot/bot/python/start_unfollow.py" | sudo tee --append cron_file
echo "*/10,25,40,55 * * * * /usr/bin/python3 /var/InstagramBot/bot/python/start_validate_targets.py" | sudo tee --append cron_file
echo "0 0 * * * /usr/bin/php7.2 /var/InstagramBot/bot/end_of_day/end_of_day.php 2>&1 | tee -a /var/log/InstagramBot/end_of_day/end_of_day.log" | sudo tee --append cron_file
echo "0 1 * * * /usr/bin/php7.2 /var/InstagramBot/bot/cleaner/cleaner.php 2>&1 | tee -a /var/log/InstagramBot/cleaner/cleaner.log" | sudo tee --append cron_file
sudo crontab cron_file
sudo rm cron_file

#change develop config to production
cd
cd InstagramBot/bot/
awk 'NR==11 {$0="    port = \"27017\""} 1' python/utils.py > python/temp.py && mv python/temp.py python/utils.py
awk 'NR==12 {$0="    db_name = \"InstagramBot\""} 1' python/utils.py > python/temp.py && mv python/temp.py python/utils.py

cd ../general-php-scripts/
awk 'NR==5 {$0="    const PORT = \"27017\";"} 1' database/DataBase.php > database/temp.php && mv database/temp.php database/DataBase.php
awk 'NR==6 {$0="    const DATABASE_NAME = \"InstagramBot\";"} 1' database/DataBase.php > database/temp.php && mv database/temp.php database/DataBase.php
awk 'NR==39 {$0="            $this->instagramAPI->setProxy(\"http://\" . $this->proxy);"} 1' login_on_instagram/LoginInstagram.php > login_on_instagram/temp.php && mv login_on_instagram/temp.php login_on_instagram/LoginInstagram.php

DOCKER_ID="$(sudo docker ps -aqf 'name=mongodb')"
awk 'NR==4 {$0="    const SERVER_NAME = \"'${DOCKER_ID}'\";"} 1' database/DataBaseInsideDocker.php > database/temp.php && mv database/temp.php database/DataBaseInsideDocker.php
awk 'NR==5 {$0="    const PORT = \"27017\";"} 1' database/DataBaseInsideDocker.php > database/temp.php && mv database/temp.php database/DataBaseInsideDocker.php
awk 'NR==6 {$0="    const DATABASE_NAME = \"InstagramBot\";"} 1' database/DataBaseInsideDocker.php > database/temp.php && mv database/temp.php database/DataBaseInsideDocker.php

cd ../php-scripts-for-panel/
awk 'NR==36 {$0="            $this->instagramAPI->setProxy(\"http://\" . $this->proxy);"} 1' login-to-instagram.php > temp.php && mv temp.php login-to-instagram.php


#move to woriking dir
cd

sudo mv InstagramBot /var/
sudo chmod 755 -R /var/InstagramBot/