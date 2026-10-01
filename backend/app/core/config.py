from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Database ---
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

    # --- Mail (stub in dev: prints to console instead of sending) ---
    MAIL_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = "yearbook@iitg.ac.in"

    # --- File storage ---
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 8

    # --- CORS ---
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )


settings = Settings()
