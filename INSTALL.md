# Installation
We recommend a recent unix/linux-based OS. Please check if your desired OS meets the following requirements. If not, we recommend debian (9.5 aka _Stretch_ or later) or Ubuntu (18.04 LTS aka _Bionic Beaver_ or later). For Giza and later at least PHP 7.1.3 is required
**Note**: Installation on Windows 10 with PHP 5.6 was also successfully tested, but you will need to adjust the commands in these instructions by yourself to your local Windows version equivalents.

## Requirements
The following packages you should be able to install from your package manager:
- git
- Apache (or any other web server-software, e.g. nginx)
- PHP (`>= 7.1.3`) with the following extensions installed and enabled:
  - memcached (on Windows this will not work -- see later)
  - mbstring
  - php-pgsql
- libapache2-mod-php (on Unix systems)
- [Composer](https://getcomposer.org)
- PostgreSQL (`>= 9.1.0`)
- memcached (extension DLL not available for Windows at the moment, see later)
- nodejs
- npm

## Migration from < 0.6 (Lumen- and Angular-based releases)
There are no additional database migrations steps required. Laravel's migration command should take care of database changes. **But** you have to update to the latest pre-0.6 release before switching to 0.6+.
However, since we switched to a different code base, you have to get the new dependencies (see _Download Dependencies_ in [Package Installation](INSTALL.md#package-installation)).
You should also check for changes in [Proxy Setup](INSTALL.md#proxy-setup) and [Configure Laravel](INSTALL.md#configure-laravel).

## Setup
### Package Installation

1. Install all the required packages. For debian-based/apt systems you can use the following command

   ```bash
    sudo apt-get install git apache2 libapache2-mod-php php composer postgresql php-pgsql php-memcached php-mbstring memcached nodejs npm
   ```

2. Clone This Repository

   ```bash
    git clone https://github.com/DH-Center-Tuebingen/ThesauRex
   ```

3. Download Dependencies

   ```bash
    cd ThesauRex
    npm install
    composer install
   ```

### Proxy Setup
Since Laravel has a sub-folder as document root `ThesauRex/public`, it won't work to simply copy Laravel to your webserver's root directory.
One solution is to setup a proxy on the same machine and re-route all requests from `/ThesauRex` to Laravel's public folder (e.g. `/var/www/html/ThesauRex/public`). For testing purposes you can run `php artisan serve` and navigate your browser to `localhost:8000`.

1. Enable the webserver's proxy packages and the rewrite engine

   ```bash
    sudo a2enmod proxy proxy_http rewrite
   ```

2. Add a new entry to your hosts file, because your proxy needs a (imaginary) domain.

   ```bash
    sudo nano /etc/hosts
    # Add an entry to "redirect" a domain to your local machine (localhost)
    127.0.0.1 thesaurex-laravel.tld # or anything you want
   ```

3. Add a new vHost file to your apache

   ```bash
    cd /etc/apache2/sites-available
    sudo nano thesaurex-laravel.conf
   ```

    Paste the following snippet into the file:
   ```apache
    <VirtualHost *:80>
      ServerName thesaurex-laravel.tld
      ServerAdmin webmaster@localhost
      DocumentRoot /var/www/html/ThesauRex/public

      DirectoryIndex index.php

      <Directory "/var/www/html/ThesauRex/public">
        AllowOverride All
        Require all granted
      </Directory>
    </VirtualHost>
   ```

4. Add the proxy route to your default vHost file (e.g. `/etc/apache2/sites-available/000-default.conf`)

   ```apache
    ProxyPass "/ThesauRex/api" "http://thesaurex-laravel.tld"
    ProxyPassReverse "/ThesauRex/api" "http://thesaurex-laravel.tld"
   ```

5. Enable the new vHost file and restart the webserver

   ```bash
    sudo a2ensite thesaurex-laravel.conf
    sudo service apache2 restart
   ```

### Configure JavaScript
ThesauRex is based on several JavaScript libraries, which are bundled using Webpack (configuration is done using Laravel Mix, a webpack-wrapper for Laravel). Only the zipped releases contain the already bundled JavaScript libraries. All other users have to run webpack to bundle these libraries.

Before running webpack, you have to adjust the public path in the mix config file `webpack.mix.js`. Replace `publicPath` inside the `webpackConfig` call with the path of your instance.

```bash
.webpackConfig({
   output: {
       publicPath: '/ThesauRex/'
   }
})
```

Now you can run webpack using

```bash
npm run dev
# or
npm run prod
```
depending on whether you want a debugging-friendly development build or an optimized production-ready build.

### Configure Laravel
Lumen should now work, but to test it you need to create a `.env` file which stores the Lumen configuration.
Inside the `lumen`-subfolder in the ThesauRex installation, create the `.env` file:
```bash
cd /var/www/html/ThesauRex/lumen
sudo nano .env
```

Then paste this configuration (Please edit some of the configuration settings `*` to match your installation). **Note**: on Windows, memchached extension DLL seems unavailable. Use `CACHE_DRIVER=array` instead where indicated:
```
APP_NAME=ThesauRex
APP_ENV=local
APP_DEBUG=true
APP_KEY=* base64:<32bit-key> #this needs to be a 32 digit random key. Use 'php artisan key:generate'

# Your database setup. pgsql is PostgreSQL. Host, port, database, username and password need to be configured first (e.g. using your database server's commands).
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=*
DB_USERNAME=*
DB_PASSWORD=*

BROADCAST_DRIVER=log
CACHE_DRIVER=memcached # on Windows memcached extension unavailable, but it seems to work with "array"
SESSION_DRIVER=file
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

When you want to run ThesauRex as standalone software without [Spacialist](https://github.com/DH-Center-Tuebingen/Spacialist) you have to run the `StandaloneSeeder`.
```bash
php artisan db:seed --class=StandaloneSeeder
```

To test your installation, simply open `http://yourdomain.tld/ThesauRex/api`. You should see a website with Laravel's current version.
Example:
```
Laravel (5.5.33)
```

## Installing ThesauRex as part of [Spacialist](https://github.com/DH-Center-Tuebingen/Spacialist)

As ThesauRex is a crutial part of the [Spacialist](https://github.com/DH-Center-Tuebingen/Spacialist) platform, it can be installed directly within the Spacialist environment as well. This part only contains changes that must be made when installing ThesauRex as part of Spacialist against a standalone installation.

2. `cd` into your Spacialist Repository and clone the ThesauRex Repository into it

   ```bash
   git clone https://github.com/DH-Center-Tuebingen/ThesauRex thesaurex
   ```

### Proxy Setup

2. Add one entry for your spacialist and one for thesaurex to your hosts file

   ```bash
    sudo nano /etc/hosts
    # Add an entry to "redirect" a domain to your local machine (localhost)
    127.0.0.1 project.spacialist # or anything you want
    127.0.0.1 project.thesaurex # or anything you want
   ```

3. Append an additional configuration to the `spacialist-laravel.conf` file of  your apache that you created while installing Spacialist (see [Spacialist/INSTALL.md](https://github.com/DH-Center-Tuebingen/Spacialist/blob/master/INSTALL.md)). The `DocumentRoot` and `<Directory ... >` must point to the location of your `public` folder and might be adjusted if needed.

   ```bash
    sudo nano /etc/apache2/sites-available/spacialist-laravel.conf
   ```

   ```apache
    # Start existing Spacialist configuration
    <VirtualHost *:80>
      ServerName project.spacialist
      ServerAdmin webmaster@localhost
      DocumentRoot /var/www/html/spacialist/public # adjust path if needed

      DirectoryIndex index.php

      <Directory "/var/www/html/spacialist/public"> # adjust path if needed
        AllowOverride All
        Require all granted
      </Directory>
    </VirtualHost>
    # End existing Spacialist configuration

    <VirtualHost *:80>
      ServerName project.thesaurex
      ServerAdmin webmaster@localhost
      DocumentRoot /var/www/html/spacialist/thesaurex/public # adjust path if needed

      DirectoryIndex index.php

      <Directory "/var/www/html/spacialist/thesaurex/public"> # adjust path if needed
        AllowOverride All
        Require all granted
      </Directory>
    </VirtualHost>
   ```

4. Add the proxy route to your default vHost file (e.g. `/etc/apache2/sites-available/000-default.conf`) with reference to the path to the api-folder of your ThesauRex Installation and the name you gave within your host file (see 2.)

   ```apache
    ProxyPass "/spacialist/thesaurex/api" "http://project.thesaurex"
    ProxyPassReverse "/spacialist/thesaurex/api" "http://project.thesaurex"
   ```

### Configure Laravel

As you have configured your `.env` file with your DB connection during the installation of Spacialist (see [Spacialist/INSTALL.md](https://github.com/DH-Center-Tuebingen/Spacialist/blob/master/INSTALL.md)) its sufficient to just set a soft link to the `.env` file of Spacialist

```bash
ln -s /var/www/html/spacialist/.env /var/www/html/spacialist/thesaurex/.env
```
