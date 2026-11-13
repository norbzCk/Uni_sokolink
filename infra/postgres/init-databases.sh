#!/bin/sh
set -eu
services="identity seller catalogue inventory commerce payment fulfilment notifications"
for service in $services; do
  role="${service}_owner"
  database="${service}_db"
  case "$service" in
    identity) app_password="$IDENTITY_DB_PASSWORD" ;;
    seller) app_password="$SELLER_DB_PASSWORD" ;;
    catalogue) app_password="$CATALOGUE_DB_PASSWORD" ;;
    inventory) app_password="$INVENTORY_DB_PASSWORD" ;;
    commerce) app_password="$COMMERCE_DB_PASSWORD" ;;
    payment) app_password="$PAYMENT_DB_PASSWORD" ;;
    fulfilment) app_password="$FULFILMENT_DB_PASSWORD" ;;
    notifications) app_password="$NOTIFICATIONS_DB_PASSWORD" ;;
  esac
  psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    --set=ON_ERROR_STOP=1 --set=app_password="$app_password" \
    --set=app_role="$role" --set=app_database="$database" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_role', :'app_password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'app_database', :'app_role') \gexec
SQL
done
