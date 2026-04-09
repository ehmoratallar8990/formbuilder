# =============================================================================
# Stage 1: Build CMS (Vue.js)
# =============================================================================
FROM node:22-alpine AS node-cms-build

WORKDIR /build/cms
COPY cms/package*.json ./
RUN npm ci --frozen-lockfile

COPY cms/ ./
# Only .env.cms is needed — NOT .env.api (security: never copy backend secrets here)
ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME="Form Builder"
ARG VITE_APP_ENV=production
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_ENV=$VITE_APP_ENV
RUN npm run build

# =============================================================================
# Stage 2: Build Renderer (Lit)
# =============================================================================
FROM node:22-alpine AS node-renderer-build

WORKDIR /build/renderer
COPY renderer/package*.json ./
RUN npm ci --frozen-lockfile

COPY renderer/ ./
RUN npm run build

# =============================================================================
# Stage 3: Install PHP dependencies
# =============================================================================
FROM composer:2.8 AS composer-build

WORKDIR /build/api
COPY api/composer.json api/composer.lock ./
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-scripts \
    --no-interaction

COPY api/ ./
RUN composer dump-autoload --optimize

# =============================================================================
# Stage 4: Final runtime image
# =============================================================================
FROM php:8.2-fpm-alpine AS final

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng-dev \
    libzip-dev \
    redis \
    && docker-php-ext-install pdo pdo_mysql zip gd opcache \
    && rm -rf /var/cache/apk/*

# Install Redis PHP extension
RUN pecl install redis && docker-php-ext-enable redis

# PHP configuration
COPY docker/php/php.ini /usr/local/etc/php/conf.d/formbuilder.ini
COPY docker/php/php-fpm.conf /usr/local/etc/php-fpm.d/formbuilder.conf

# Nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Supervisor configuration (manages nginx + php-fpm)
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# --- Application files ---

# PHP API
WORKDIR /var/www/api
COPY --from=composer-build /build/api ./
RUN chown -R www-data:www-data /var/www/api/storage /var/www/api/bootstrap/cache

# Vue CMS static assets
COPY --from=node-cms-build /build/cms/dist /var/www/html

# Renderer library
COPY --from=node-renderer-build /build/renderer/dist /var/www/html/assets/renderer

# Storage symlink for public uploads
RUN php artisan storage:link 2>/dev/null || true

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
