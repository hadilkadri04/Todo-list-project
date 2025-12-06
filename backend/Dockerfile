FROM php:8.2-cli AS builder
WORKDIR /app

# Installer les dépendances de développement
RUN apt-get update && apt-get install -y \
    git \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copier le code source
COPY . .

# ===== STAGE 2: Production =====
FROM php:8.2-apache
WORKDIR /var/www/html

# Installer UNIQUEMENT les extensions nécessaires
RUN docker-php-ext-install pdo pdo_mysql

# Copier UNIQUEMENT les fichiers nécessaires depuis builder
COPY --from=builder /app .

# Configuration Apache
RUN a2enmod rewrite

EXPOSE 80
CMD ["apache2-foreground"]