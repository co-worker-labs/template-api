-- CreateTable
CREATE TABLE `signature_keypair` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `public_key` TEXT NOT NULL,
    `private_key` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
