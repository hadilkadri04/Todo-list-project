# backend/Dockerfile.backend

FROM php:8.1-cli

WORKDIR /var/www/html

COPY . .

# Installer SQLite3 et l'extension PDO SQLite
RUN apt-get update && \
    apt-get install -y sqlite3 && \
    docker-php-ext-install pdo_sqlite

EXPOSE 80

# Démarrer le serveur PHP interne
CMD ["php", "-S", "0.0.0.0:80", "-t", "."]