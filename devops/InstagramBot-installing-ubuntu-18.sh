#!/bin/bash

if [[ "$EUID" -eq 0 ]]
  then echo "Please do not run it with sudo"
  exit
fi

cd

sudo apt -y update
sudo apt -y upgrade

#install php
sudo apt -y install php7.2
sudo apt -y install php-pear php7.2-mbstring php7.2-json php7.2-curl php7.2-dev php7.2-gd php-mongodb php7.2-zip php7.2-mysql php7.2-xml php7.2-cli php7.2-common php7.2-bcmath libevent-dev

#install additional software
sudo apt -y install git unzip ffmpeg

#install pip
sudo apt -y install python3-pip

#install pymongo
sudo pip3 install pymongo

#install php mongodb extension
sudo pecl install mongodb

#install composer
curl -sS https://getcomposer.org/installer -o composer-setup.php
echo "Enter HASH from https://composer.github.io/pubkeys.html"
echo "HASH: "
read HASH
php -r "if (hash_file('SHA384', 'composer-setup.php') === '$HASH') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
rm -rf composer-setup.php