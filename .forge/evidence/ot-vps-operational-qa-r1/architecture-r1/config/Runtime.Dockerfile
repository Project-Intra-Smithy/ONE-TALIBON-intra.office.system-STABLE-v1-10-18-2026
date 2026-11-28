FROM postgres@sha256:5264710be20f409750ac6dc4e5706dcef929c87e241605463f0f9aefa932a8d9 AS pg_transport
FROM php@sha256:4920870fe522bc33b79781364545992d5a2c7f2a80ae06ff3ac657c486f2b8fb
RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu-dev libpq-dev libzip-dev python3-minimal \
    && docker-php-ext-install -j2 bcmath intl opcache pdo_pgsql zip \
    && a2enmod rewrite headers expires \
    && sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/*.conf /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    && printf 'ServerName localhost\n<Directory /var/www/html/public>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-enabled/one-talibon.conf \
    && rm -rf /var/lib/apt/lists/*
# The pinned stock PG image supplies modern SCRAM require_auth client support.
COPY --from=pg_transport /usr/lib/x86_64-linux-gnu/libpq.so.5* /usr/local/lib/
RUN ldconfig
WORKDIR /var/www/html
COPY package/ ./
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
    && chown -R 33:33 storage bootstrap/cache \
    && chmod -R u+rwX,go-rwx storage bootstrap/cache
COPY runtime.ini /usr/local/etc/php/conf.d/one-talibon-runtime.ini
USER 33:33
