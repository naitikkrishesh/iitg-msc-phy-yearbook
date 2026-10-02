from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Database ---
    # Preferred on Render: one URL from Aiven. Falls back to the DB_* parts for local dev.
    DATABASE_URL: str = ""
    DB_SSL_CA: str = ""          # path to Aiven ca.pem, e.g. "ca.pem"
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "yearbook_user"
    DB_PASSWORD: str = "changeme"
    DB_NAME: str = "yearbook_db"

    # --- Auth ---
    JWT_SECRET: str = "change-this-in-.env-never-commit-it"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    # --- OTP ---
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5

    # --- Mail ---
    MAIL_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = "yearbook@iitg.ac.in"

    # --- File storage ---
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 8

    # --- CORS (comma-separated for multiple origins) ---
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.FRONTEND_ORIGIN.split(",") if o.strip()]

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            # Aiven gives "mysql://...?ssl-mode=REQUIRED"; pymysql rejects that query arg.
            url = url.split("?", 1)[0]
            if url.startswith("mysql://"):
                url = url.replace("mysql://", "mysql+pymysql://", 1)
            return f"{url}?charset=utf8mb4"
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )


settings = Settings()