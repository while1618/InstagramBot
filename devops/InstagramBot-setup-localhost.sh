#!/bin/bash

if [[ "$EUID" -eq 0 ]]
  then echo "Please do not run it with sudo"
  exit
fi

cd ..
mkdir composer
cd composer/
composer require mgp25/instagram-php
composer require mongodb/mongodb
composer require mailgun/mailgun-php kriswallsmith/buzz nyholm/psr7
composer require blocktrail/cryptojs-aes-php
cd ../panel/
meteor npm install --save @babel/runtime
meteor npm install --save chart.js
meteor npm install moment-timezone --save
meteor npm install simplebar --save
meteor npm install --save @types/moment-timezone
