/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `project_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_user` (`user_id`),
  KEY `idx_activity_created` (`created_at`),
  CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `check_in_lat` decimal(10,8) DEFAULT NULL,
  `check_in_lng` decimal(11,8) DEFAULT NULL,
  `check_out_lat` decimal(10,8) DEFAULT NULL,
  `check_out_lng` decimal(11,8) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_user_id_date_unique` (`user_id`,`date`),
  KEY `attendance_user_id_date_index` (`user_id`,`date`),
  KEY `attendance_date_index` (`date`),
  KEY `idx_attendance_user` (`user_id`),
  KEY `idx_attendance_date` (`date`),
  KEY `idx_attendance_user_date` (`user_id`,`date`),
  CONSTRAINT `attendance_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `check_in_time` datetime DEFAULT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `check_in_latitude` decimal(10,8) DEFAULT NULL,
  `check_in_longitude` decimal(11,8) DEFAULT NULL,
  `check_out_latitude` decimal(10,8) DEFAULT NULL,
  `check_out_longitude` decimal(11,8) DEFAULT NULL,
  `check_in_photo` longtext COLLATE utf8mb4_unicode_ci,
  `check_out_photo` longtext COLLATE utf8mb4_unicode_ci,
  `gps_data` json DEFAULT NULL,
  `device_info` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `gps_warning` tinyint(1) NOT NULL DEFAULT '0',
  `distance_from_office` int DEFAULT NULL,
  `status` enum('present','late','absent','outside_area','gps_warning','no_gps') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'present',
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendances_user_id_date_unique` (`user_id`,`date`),
  CONSTRAINT `attendances_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'approved',
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customers_approved_by_foreign` (`approved_by`),
  KEY `customers_created_by_index` (`created_by`),
  KEY `idx_customers_created_by` (`created_by`),
  KEY `idx_customers_approval` (`approval_status`),
  KEY `idx_customers_created_approval` (`created_by`,`approval_status`),
  CONSTRAINT `customers_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `customers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint unsigned DEFAULT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `documents_project_id_foreign` (`project_id`),
  KEY `documents_uploaded_by_foreign` (`uploaded_by`),
  CONSTRAINT `documents_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documents_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `engineer_progress_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `engineer_progress_reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `progress_percentage` int NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `material_updates` text COLLATE utf8mb4_unicode_ci,
  `plan_updates` text COLLATE utf8mb4_unicode_ci,
  `reported_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `engineer_progress_reports_project_id_foreign` (`project_id`),
  KEY `engineer_progress_reports_user_id_foreign` (`user_id`),
  CONSTRAINT `engineer_progress_reports_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `engineer_progress_reports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `funnel_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funnel_activities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `funnel_id` bigint unsigned NOT NULL,
  `activity_type` enum('telepon','whatsapp','email','visit','meeting','demo','kirim_penawaran','revisi_penawaran','lainnya') COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_date` datetime NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_stage` enum('prospek','qualified','proposal','negosiasi','closing') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_stage` enum('prospek','qualified','proposal','negosiasi','closing') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previous_probability` enum('low','middle','high','very_high') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_probability` enum('low','middle','high','very_high') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `funnel_activities_funnel_id_index` (`funnel_id`),
  KEY `funnel_activities_activity_date_index` (`activity_date`),
  KEY `funnel_activities_created_by_index` (`created_by`),
  CONSTRAINT `funnel_activities_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `funnel_activities_funnel_id_foreign` FOREIGN KEY (`funnel_id`) REFERENCES `sales_funnels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `manpowers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manpowers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `joined_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `manpowers_project_id_foreign` (`project_id`),
  CONSTRAINT `manpowers_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty_plan` decimal(12,2) NOT NULL DEFAULT '0.00',
  `qty_terpasang` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `materials_project_id_foreign` (`project_id`),
  CONSTRAINT `materials_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `plan_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_visits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `tanggal_visit` date NOT NULL,
  `waktu_visit` time DEFAULT NULL,
  `lokasi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `tujuan` text COLLATE utf8mb4_unicode_ci,
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','pending','approved','rejected','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `plan_visits_approved_by_foreign` (`approved_by`),
  KEY `plan_visits_assigned_to_index` (`assigned_to`),
  KEY `plan_visits_tanggal_visit_index` (`tanggal_visit`),
  KEY `plan_visits_status_index` (`status`),
  KEY `idx_plan_visits_assigned` (`assigned_to`),
  KEY `idx_plan_visits_created` (`created_by`),
  KEY `idx_plan_visits_date` (`tanggal_visit`),
  KEY `idx_plan_visits_status` (`status`),
  KEY `idx_plan_visits_assigned_status` (`assigned_to`,`status`),
  KEY `idx_plan_visits_assigned_date` (`assigned_to`,`tanggal_visit`),
  KEY `plan_visits_customer_id_foreign` (`customer_id`),
  CONSTRAINT `plan_visits_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `plan_visits_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `plan_visits_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plan_visits_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `progress_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `progress_reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `progress_pct` tinyint unsigned NOT NULL,
  `kendala` text COLLATE utf8mb4_unicode_ci,
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `report_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `progress_reports_project_id_foreign` (`project_id`),
  KEY `progress_reports_user_id_foreign` (`user_id`),
  CONSTRAINT `progress_reports_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `progress_reports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `assigned_by` bigint unsigned NOT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_assignments_project_id_user_id_unique` (`project_id`,`user_id`),
  KEY `project_assignments_user_id_foreign` (`user_id`),
  KEY `project_assignments_assigned_by_foreign` (`assigned_by`),
  CONSTRAINT `project_assignments_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_assignments_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_assignments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `type` enum('over_budget','deadline_warning','success','info','visit','funnel','warning','milestone') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_notifications_project_id_foreign` (`project_id`),
  CONSTRAINT `project_notifications_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('on_track','at_risk','delayed','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'on_track',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `deadline` date DEFAULT NULL,
  `rab` decimal(15,2) DEFAULT '0.00',
  `realisasi` decimal(15,2) NOT NULL DEFAULT '0.00',
  `rab_target` decimal(15,2) NOT NULL DEFAULT '0.00',
  `rab_realisasi` decimal(15,2) DEFAULT '0.00',
  `rab_expenses` json DEFAULT NULL,
  `progress` tinyint unsigned NOT NULL DEFAULT '0',
  `pm_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pm_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_engineers` json DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `project_manager_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `site_manager_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `projects_created_by_foreign` (`created_by`),
  KEY `projects_site_manager_id_foreign` (`site_manager_id`),
  KEY `projects_user_id_foreign` (`user_id`),
  KEY `projects_project_manager_id_index` (`project_manager_id`),
  KEY `projects_status_index` (`status`),
  KEY `idx_projects_pm_id` (`project_manager_id`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_deleted` (`deleted_at`),
  KEY `idx_projects_pm_status` (`project_manager_id`,`status`),
  KEY `idx_projects_status_deleted` (`status`,`deleted_at`),
  CONSTRAINT `projects_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `projects_project_manager_id_foreign` FOREIGN KEY (`project_manager_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `projects_site_manager_id_foreign` FOREIGN KEY (`site_manager_id`) REFERENCES `users` (`id`),
  CONSTRAINT `projects_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `realisasi_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `realisasi_visits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('planned','unplanned') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `plan_visit_id` bigint unsigned DEFAULT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_address` text COLLATE utf8mb4_unicode_ci,
  `visit_date` date DEFAULT NULL,
  `visited_at` timestamp NULL DEFAULT NULL,
  `actual_duration` int DEFAULT NULL,
  `status` enum('pending','done','missed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approval_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'approved',
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `visit_time` datetime DEFAULT NULL,
  `visit_purpose` text COLLATE utf8mb4_unicode_ci,
  `meeting_notes` text COLLATE utf8mb4_unicode_ci,
  `hasil_visit` text COLLATE utf8mb4_unicode_ci,
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `visit_outcome` enum('closed','follow_up','not_interested','rescheduled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deal_amount` decimal(15,2) DEFAULT NULL,
  `deal_notes` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `photos` json DEFAULT NULL,
  `visited_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_realisasi_visited_by` (`visited_by`),
  KEY `idx_realisasi_type` (`type`),
  KEY `idx_realisasi_approval` (`approval_status`),
  KEY `idx_realisasi_status` (`status`),
  KEY `idx_realisasi_type_approval` (`type`,`approval_status`),
  KEY `idx_realisasi_visited_type` (`visited_by`,`type`),
  KEY `realisasi_visits_plan_visit_id_foreign` (`plan_visit_id`),
  CONSTRAINT `realisasi_visits_plan_visit_id_foreign` FOREIGN KEY (`plan_visit_id`) REFERENCES `plan_visits` (`id`) ON DELETE CASCADE,
  CONSTRAINT `realisasi_visits_visited_by_foreign` FOREIGN KEY (`visited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sales_funnels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_funnels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_company` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` enum('kontraktor','subdist','rsud','rs_swasta','klinik','puskesmas','lainnya') COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel_other` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `segment` enum('sot','igvm','nursecall','umum') COLLATE utf8mb4_unicode_ci NOT NULL,
  `segment_custom` text COLLATE utf8mb4_unicode_ci,
  `qty` decimal(10,2) NOT NULL,
  `unit` enum('unit','set','pcs') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unit',
  `estimated_value` decimal(15,2) NOT NULL,
  `deal_stage` enum('prospek','qualified','proposal','negosiasi','closing') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prospek',
  `deadline_date` date NOT NULL,
  `target_close_date` date NOT NULL,
  `win_probability` enum('low','middle','high','very_high') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'middle',
  `win_percentage` int NOT NULL DEFAULT '50',
  `competitor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `competitor_notes` text COLLATE utf8mb4_unicode_ci,
  `initial_notes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','won','lost') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `won_value` decimal(15,2) DEFAULT NULL,
  `won_reason_category` enum('harga_kompetitif','relasi','spesifikasi','after_sales','pengiriman','lainnya') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `won_notes` text COLLATE utf8mb4_unicode_ci,
  `won_date` date DEFAULT NULL,
  `lost_reason_category` enum('kalah_harga','kalah_spesifikasi','kalah_kompetitor','budget_dipotong','proyek_ditunda','customer_batal','lainnya') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lost_competitor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lost_notes` text COLLATE utf8mb4_unicode_ci,
  `lost_date` date DEFAULT NULL,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `last_activity_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_funnels_status_index` (`status`),
  KEY `sales_funnels_deal_stage_index` (`deal_stage`),
  KEY `sales_funnels_assigned_to_index` (`assigned_to`),
  KEY `sales_funnels_created_by_index` (`created_by`),
  KEY `sales_funnels_target_close_date_index` (`target_close_date`),
  KEY `sales_funnels_last_activity_at_index` (`last_activity_at`),
  KEY `idx_funnels_assigned` (`assigned_to`),
  KEY `idx_funnels_created` (`created_by`),
  KEY `idx_funnels_status` (`status`),
  KEY `idx_funnels_assigned_status` (`assigned_to`,`status`),
  KEY `idx_funnels_created_status` (`created_by`,`status`),
  KEY `sales_funnels_customer_id_foreign` (`customer_id`),
  CONSTRAINT `sales_funnels_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_funnels_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_funnels_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'engineer',
  `division` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `assigned_projects` json DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_approved_by_foreign` (`approved_by`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_active` (`is_active`),
  KEY `idx_users_role_active` (`role`,`is_active`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `users_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warnings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('missed_visit','late_attendance','no_attendance') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `plan_visit_id` bigint unsigned DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_warnings_user` (`user_id`),
  KEY `idx_warnings_read` (`is_read`),
  KEY `idx_warnings_user_read` (`user_id`,`is_read`),
  KEY `warnings_plan_visit_id_foreign` (`plan_visit_id`),
  CONSTRAINT `warnings_plan_visit_id_foreign` FOREIGN KEY (`plan_visit_id`) REFERENCES `plan_visits` (`id`) ON DELETE CASCADE,
  CONSTRAINT `warnings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_locations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `radius_meters` int NOT NULL DEFAULT '200',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'2024_01_01_000000_create_personal_access_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (2,'2024_01_01_000001_create_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (3,'2024_01_01_000002_create_projects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (4,'2024_01_01_000003_create_progress_reports_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (5,'2024_01_01_000004_create_documents_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (6,'2024_01_01_000005_create_manpower_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (7,'2024_01_01_000006_create_materials_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (8,'2024_01_01_000007_create_project_notifications_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (9,'2024_01_01_000008_create_activity_logs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (10,'2026_03_23_120000_fix_user_roles',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (11,'2026_03_23_130000_add_approval_system_to_users',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (12,'2026_03_23_140000_create_password_reset_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (13,'2026_04_07_100000_add_visit_management_tables',2);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (14,'2026_04_14_200000_create_work_locations_table',3);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (15,'2026_04_27_200000_create_sales_funnels_table',4);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (16,'2026_04_27_210000_create_funnel_activities_table',5);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (17,'2026_03_23_150000_add_phone_to_users_table',6);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (18,'2026_03_23_160000_add_approval_columns_to_users',6);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (19,'2026_04_06_100000_fix_project_notifications_for_welcome',6);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (20,'2026_04_08_000000_create_manpowers_table',6);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (21,'2026_04_08_100000_fix_user_roles_enum',6);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (22,'2026_04_13_100000_fix_foreign_key_constraints',7);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (23,'2026_04_14_100000_fix_attendance_and_add_work_locations',8);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (24,'2026_04_14_300000_fix_photo_columns_longtext',8);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (25,'2026_04_15_100000_create_project_assignments_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (26,'2026_04_15_110000_create_engineer_progress_reports_table',10);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (27,'2026_04_15_200000_add_missing_foreign_keys',11);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (29,'2026_04_15_210000_fix_manpower_table_name',12);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (30,'2026_04_20_100000_fix_plan_visits_table_structure',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (31,'2026_04_20_110000_create_warnings_table',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (32,'2026_04_21_100000_add_assigned_projects_to_users_table',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (33,'2026_04_21_110000_fix_projects_table_structure',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (34,'2026_04_21_120000_create_project_assignments_table',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (35,'2026_04_21_200000_add_creator_columns_to_projects_table',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (36,'2026_04_21_210000_create_project_assignments_table',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (37,'2026_04_21_220000_create_engineer_progress_reports_table',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (38,'2026_04_21_300000_ensure_manpowers_table_exists',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (39,'2026_04_21_400000_ensure_manpowers_table_exists',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (40,'2026_04_24_300000_add_approval_and_unplanned_system',14);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (41,'2026_04_27_100000_add_unplanned_visit_columns_to_realisasi_visits',15);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (42,'2026_04_27_110000_make_plan_visit_id_nullable_in_realisasi_visits',15);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (43,'2026_04_27_220000_fix_notification_types_enum',15);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (44,'2026_05_01_100000_add_performance_indexes',16);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (45,'2026_05_11_100000_add_customer_id_to_realisasi_visits',17);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (46,'2026_05_11_100000_add_missing_columns_to_realisasi_visits',17);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (47,'2026_05_12_100000_add_customer_id_to_sales_funnels',17);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (48,'2026_05_13_200000_fix_cascade_delete_all_relations',18);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (49,'2026_05_12_200000_fix_project_notifications_for_visit_funnel',19);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (50,'2026_05_15_150000_add_plan_updates_to_engineer_progress_reports',20);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (51,'2026_05_18_120000_add_rab_expenses_to_projects_table',21);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (52,'2026_05_18_160000_expand_password_reset_token_column',22);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (53,'2026_05_13_100000_add_customer_foreign_key_to_sales_funnels',23);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (54,'2026_05_14_180000_add_material_updates_to_engineer_progress_reports',23);
