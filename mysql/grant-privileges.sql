-- ===================================================================
-- OWASP Secure Web App – Table-Level Least Privilege Configuration
-- ===================================================================
-- Ogranicza uprawnienia użytkownika runtime aplikacji ('fintrack_user')
-- wyłącznie do operacji DML (SELECT, INSERT, UPDATE, DELETE) na ściśle
-- określonych tabelach. Blokuje wszelkie operacje DDL (CREATE, DROP, ALTER).
-- ===================================================================

-- Tabele biznesowe aplikacji
GRANT SELECT ON `fintrackbd`.`api_app_category` TO `fintrack_user`@`%`;
GRANT SELECT, INSERT, UPDATE, DELETE ON `fintrackbd`.`api_app_expense` TO `fintrack_user`@`%`;

-- Tabele autoryzacji i grup
GRANT SELECT ON `fintrackbd`.`auth_group` TO `fintrack_user`@`%`;
GRANT SELECT, DELETE ON `fintrackbd`.`auth_user_groups` TO `fintrack_user`@`%`;
GRANT SELECT, DELETE ON `fintrackbd`.`auth_user_user_permissions` TO `fintrack_user`@`%`;
GRANT SELECT, INSERT, UPDATE, DELETE ON `fintrackbd`.`auth_user` TO `fintrack_user`@`%`;
GRANT SELECT ON `fintrackbd`.`auth_permission` TO `fintrack_user`@`%`;

-- Tabele pomocnicze i sesje Django
GRANT SELECT, DELETE ON `fintrackbd`.`django_admin_log` TO `fintrack_user`@`%`;
GRANT SELECT, INSERT, DELETE ON `fintrackbd`.`django_rest_passwordreset_resetpasswordtoken` TO `fintrack_user`@`%`;
GRANT SELECT, INSERT, UPDATE, DELETE ON `fintrackbd`.`django_session` TO `fintrack_user`@`%`;
GRANT SELECT ON `fintrackbd`.`django_content_type` TO `fintrack_user`@`%`;
GRANT SELECT ON `fintrackbd`.`django_migrations` TO `fintrack_user`@`%`;

FLUSH PRIVILEGES;

