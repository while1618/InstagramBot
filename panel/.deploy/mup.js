module.exports = {
  servers: {
    one: {
      host: 'your-ip-address',
      username: 'root',
      pem: 'your id_rsa'
      // password: 'server-password'
    }
  },

  app: {
    name: 'InstagramBot',
    path: '../',

    servers: {
      one: {},
    },

    volumes: {
      '/var/InstagramBot/uploads':'/var/InstagramBot/uploads',
      '/var/InstagramBot/php-scripts-for-panel':'/var/InstagramBot/php-scripts-for-panel',
      '/var/InstagramBot/composer':'/var/InstagramBot/composer',
      '/var/InstagramBot/general-php-scripts':'/var/InstagramBot/general-php-scripts',
      '/var/InstagramBot/bot':'/var/InstagramBot/bot',
      '/var/log/InstagramBot/init_statistics/':'/var/log/InstagramBot/init_statistics/',
      '/var/log/InstagramBot/challenge_required/':'/var/log/InstagramBot/challenge_required/',
      '/etc/localtime':'/etc/localtime',
      '/usr/share/zoneinfo':'/usr/share/zoneinfo'
    },

    buildOptions: {
      serverOnly: true,
    },

    env: {
      // If you are using ssl, it needs to start with https://
      ROOT_URL: 'https://your-domain.com',
      MONGO_URL: 'mongodb://mongodb/meteor',
      MONGO_OPLOG_URL: 'mongodb://mongodb/local',
    },

    docker: {
      // change to 'abernix/meteord:base' if your app is using Meteor 1.4 - 1.5
      image: 'abernix/meteord:node-8-base',

      buildInstructions: [
        'RUN apt install -y nano wget',
        'RUN apt update -y',
        'RUN apt install ca-certificates apt-transport-https -y',
        'RUN wget -q https://packages.sury.org/php/apt.gpg -O- | apt-key add -',
        'RUN echo "deb https://packages.sury.org/php/ jessie main" | tee /etc/apt/sources.list.d/php.list',
        'RUN apt update -y',
        'RUN apt install php7.2 -y',
        'RUN apt -y install php-pear php7.2-curl php7.2-json php7.2-dev php7.2-gd php-mongodb php7.2-zip php7.2-mysql php7.2-xml php7.2-cli php7.2-common php7.2-bcmath libevent-dev php7.2-mbstring',
        'RUN pecl install mongodb'
      ],
    },

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    enableUploadProgressBar: true
  },

  mongo: {
    version: '3.4.1',
    servers: {
      one: {}
    }
  },

  // (Optional)
  // Use the proxy to setup ssl or to route requests to the correct
  // app when there are several apps
  proxy: {
    domains: 'your-domain.com,www.your-domain.com',

    ssl: {
      // Enable Let's Encrypt
      letsEncryptEmail: 'your-email',
      forceSSL: true
    }
  }
};

