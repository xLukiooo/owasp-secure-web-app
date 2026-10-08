#!/usr/bin/env bash
set -euo pipefail

# ===================================================================
# Inicjalizacja bazy danych i ograniczonego użytkownika runtime
# Hasła i nazwy pobierane dynamicznie ze zmiennych środowiskowych
# ===================================================================

DB_NAME="${DB_NAME:-fintrackbd}"
DB_USER="${DB_USER:-fintrack_user}"
DB_PASSWORD="${DB_PASSWORD:-fintrack_password_dev_123}"

sql_query="
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'%'
  IDENTIFIED BY '${DB_PASSWORD}';

REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${DB_USER}'@'%';
FLUSH PRIVILEGES;
"

if declare -F docker_process_sql > /dev/null; then
    docker_process_sql --database=mysql <<< "$sql_query"
else
    mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" --socket="${SOCKET:-/var/run/mysqld/mysqld.sock}" <<< "$sql_query"
fi

