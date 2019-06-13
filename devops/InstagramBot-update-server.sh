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

#delete old files
sudo rm -rf /var/InstagramBot/bot/
sudo rm -rf /var/InstagramBot/general-php-scripts/
sudo rm -rf /var/InstagramBot/php-scripts-for-panel/

#move to woriking dir
cd

sudo mv InstagramBot/bot /var/InstagramBot/
sudo mv InstagramBot/general-php-scripts /var/InstagramBot/
sudo mv InstagramBot/php-scripts-for-panel /var/InstagramBot/
sudo chmod 755 -R /var/InstagramBot/

#remove clone
sudo rm -rf InstagramBot/