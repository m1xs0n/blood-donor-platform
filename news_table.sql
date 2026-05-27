CREATE TABLE IF NOT EXISTS news (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    summary VARCHAR(500) DEFAULT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    external_url VARCHAR(500) DEFAULT NULL,
    status ENUM('draft', 'published') DEFAULT 'published',
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_news_status_created (status, created_at),
    KEY fk_news_created_by (created_by),
    CONSTRAINT fk_news_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;
