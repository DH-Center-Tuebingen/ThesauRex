# Installation
We recommend a recent unix/linux-based OS. Please check if your desired OS meets the following requirements. If not, we recommend debian (8.5 aka _jessie_ or later) or Ubuntu (16.04 LTS aka _Xenial Xerus_ or later). For better PHP performance we recommend a system with PHP 7.x support such as Ubuntu 16.04. Note: Installation on Windows 10 with PHP 5.6 was also successfully tested, but you will need to adjust the commands in these instructions by yourself to your local Windows version equivalents.

## Requirements
The following packages you should be able to install from your package manager:
- git
- Apache (or any other web server-software, e.g. nginx)
- PHP (`>= 5.6.4`) with the following extensions installed and enabled:
  - memcached (on Windows this will not work -- see later)
  - mbstring
  - php-pgsql
  - php-intl (on Windows, php_intl.dll ships with PHP, so just uncomment the line `;extension=php_intl.dll` in php.ini)
- libapache2-mod-php (on Unix systems)
- [Composer](https://getcomposer.org)
- PostgreSQL (`>= 9.1.0`)
- memcached (extension DLL not available for Windows at the moment, see later)
- Python 3.x (for import/export functionalities)
  - pip
  - rdflib
  - psycopg2
  - getopt
- nodejs
- npm
- bower (run `npm install -g bower` on the command line, **Please note**: on Linux you may have to link your `nodejs` executable to the new command `node`. e.g. `sudo ln -s /usr/bin/nodejs /usr/bin/node`)

## Setup
### Package Installation

1. Install all the required packages. For debian-based/apt systems you can use the following command

    ```bash
    sudo apt-get install git apache2 libapache2-mod-php php composer postgresql php-pgsql php-intl php-memcached php-mbstring memcached python3 python-pip python-rdflib python-psycopg2 nodejs npm
    ```

2. Clone This Repository

    ```bash
    git clone https://github.com/eScienceCenter/ThesauRex
    ```

3. Download Dependencies

    ```bash
    cd ThesauRex
    bower install
    cd lumen
    composer install
    ```

**Please note**: During the `composer install` you might get an error regarding an unsecure installation. To fix this you have to edit your `composer.json` file (only edit this file if you know what you're doing) in the `lumen` folder to disable secure HTTP connections. Add `"secure-http": false` or set `"secure-http": true` to `false` if the line already exists. After editing the `composer.json` you have to re-run `composer` with
```bash
composer update
```

In order to use the export functionality you have to link the `arc2` library to a subfolder of the `easyrdf` library. Both libraries should be downloaded using the `composer` command above. To link the libraries you have to (on Linux-based OS) run the following command.
```bash
cd vendor/easyrdf/easyrdf/lib/EasyRdf/Serialiser #make sure you're in the correct folder
ln -s ../../../../../semsol/arc2/ arc
```

### Proxy Setup
To communicate with Lumen, ThesauRex requires the API folder to be in the ThesauRex folder. If you run ThesauRex under `yourdomain.tld/ThesauRex`, the Lumen API has to be `yourdomain.tld/ThesauRex/api`.

Since Lumen has a sub-folder as document root `lumen/public`, it won't work to simply copy Lumen to your webserver's root directory.
One solution is to setup a proxy on the same machine and re-route all requests from `/ThesauRex/api` to Lumen's public folder (e.g. `/var/www/html/ThesauRex/lumen/public`).

1. Enable the webserver's proxy packages and the rewrite engine

    ```bash
    sudo a2enmod proxy proxy_http rewrite
    ```

2. Add a new entry to your hosts file, because your proxy needs a (imaginary) domain.

    ```bash
    sudo nano /etc/hosts
    # Add an entry to "redirect" a domain to your local machine (localhost)
    127.0.0.1 thesaurex-lumen.tld # or anything you want
    ```

3. Add a new vHost file to your apache

    ```bash
    cd /etc/apache2/sites-available
    sudo nano thesaurex-lumen.conf
    ```

    Paste the following snippet into the file:
    ```apache
    <VirtualHost *:80>
      ServerName thesaurex-lumen.tld
      ServerAdmin webmaster@localhost
      DocumentRoot /var/www/html/ThesauRex/lumen/public

      DirectoryIndex index.php

      <Directory "/var/www/html/ThesauRex/lumen/public">
        AllowOverride All
        Require all granted
      </Directory>
    </VirtualHost>
    ```

4. Add the proxy route to your default vHost file (e.g. `/etc/apache2/sites-available/000-default.conf`)

    ```apache
    ProxyPass "/ThesauRex/api" "http://thesaurex-lumen.tld"
    ProxyPassReverse "/ThesauRex/api" "http://thesaurex-lumen.tld"
    ```

5. Enable the new vHost file and restart the webserver

    ```bash
    sudo a2ensite thesaurex-lumen.conf
    sudo service apache2 restart
    ```

### Configure Lumen
Lumen should now work, but to test it you need to create a `.env` file which stores the Lumen configuration.
Inside the `lumen`-subfolder in the ThesauRex installation, create the `.env` file:
```bash
cd /var/www/html/ThesauRex/lumen
sudo nano .env
```

Then paste this configuration (Please edit some of the configuration settings `*` to match your installation). **Note**: on Windows, memchached extension DLL seems unavailable. Use `CACHE_DRIVER=array` instead where indicated:
```
APP_ENV=local
APP_DEBUG=true
APP_KEY=* #this needs to be a 32 digit random key. Use an online generator or run php artisan jwt:secret twice

# Your database setup. pgsql is PostgreSQL. Host, port, database, username and password need to be configured first (e.g. using your database server's commands).
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=*
DB_USERNAME=*
DB_PASSWORD=*

CACHE_DRIVER=memcached # on Windows memcached extension unavailable, but it seems to work with "array"
QUEUE_DRIVER=sync

JWT_SECRET=* #same as APP_KEY, run php artisan jwt:secret
JWT_TTL=* #the time to live (in minutes) of your user tokens. Default is 60 (minutes).
JWT_REFRESH_TTL=* #the ttl (in minutes) in which you can generate a new token. Default is two weeks
JWT_BLACKLIST_GRACE_PERIOD=* #a time span in seconds which allows you to use the same token several times in this time span without blacklisting it (good for async api calls)
```

After the `.env` file has been configured you should run the migrations to setup your database. Note: the DB must already exists, so create one if you do this for the first time.
```bash
php artisan migrate
```

If you have just migrated into an empty database, you need to run the following command, which will populate the database with required stuff:
```bash
php artisan db:seed
```

To test your installation, simply open `http://yourdomain.tld/ThesauRex/api`. You should see a website with Lumen's current version.
Example:
```
Lumen (5.3.2) (Laravel Components 5.3.*)
```
