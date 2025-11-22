# --- BUILD (optional, but clean) ---
FROM php:8.2-cli AS builder
WORKDIR /app

# --- PRODUCTION ---
FROM php:8.2-apache
WORKDIR /var/www/html

# ✅ Install MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Copy app
COPY . .

EXPOSE 80
CMD ["apache2-foreground"]