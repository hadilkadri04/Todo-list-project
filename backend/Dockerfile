FROM php:8.1-cli

WORKDIR /var/www/html

COPY . .

RUN apt-get update && \
    apt-get install -y sqlite3 && \
    docker-php-ext-install pdo_sqlite

EXPOSE 80

CMD ["php", "-S", "0.0.0.0:80", "-t", "."]