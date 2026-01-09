-- SQL schema for the authentication and classroom management system
-- Update the database name below if your .env uses a different DB_NAME value

 CREATE DATABASE `takween` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `takween`;

CREATE TABLE `Users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('teacher','student','admin') NOT NULL DEFAULT 'student',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Classes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `teacherId` INT UNSIGNED NOT NULL,
  `description` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `classes_teacher_idx` (`teacherId`),
  CONSTRAINT `classes_teacher_fk`
    FOREIGN KEY (`teacherId`) REFERENCES `Users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Subjects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `classId` INT UNSIGNED NOT NULL,
  `description` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subjects_class_idx` (`classId`),
  CONSTRAINT `subjects_class_fk`
    FOREIGN KEY (`classId`) REFERENCES `Classes`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `StudentClasses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `studentId` INT UNSIGNED NOT NULL,
  `classId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_class_unique` (`studentId`,`classId`),
  KEY `studentclasses_student_idx` (`studentId`),
  KEY `studentclasses_class_idx` (`classId`),
  CONSTRAINT `studentclasses_student_fk`
    FOREIGN KEY (`studentId`) REFERENCES `Users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `studentclasses_class_fk`
    FOREIGN KEY (`classId`) REFERENCES `Classes`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Grades` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `studentId` INT UNSIGNED NOT NULL,
  `subjectId` INT UNSIGNED NOT NULL,
  `grade` DECIMAL(5,2) NOT NULL,
  `assignment` VARCHAR(255),
  `comments` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `grade_unique` (`studentId`,`subjectId`,`assignment`),
  KEY `grades_student_idx` (`studentId`),
  KEY `grades_subject_idx` (`subjectId`),
  CONSTRAINT `grades_student_fk`
    FOREIGN KEY (`studentId`) REFERENCES `Users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `grades_subject_fk`
    FOREIGN KEY (`subjectId`) REFERENCES `Subjects`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

