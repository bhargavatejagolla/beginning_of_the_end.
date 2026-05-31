from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Neo4j (will be used later)
    NEO4J_URI: str = "bolt://neo4j:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"

    # Groq API (free tier)
    GROQ_API_KEY: str = ""

    # Model paths (mounted in Docker)
    MODEL_PATH: str = "app/models/cybershield_ensemble_model.pkl"
    FEATURE_NAMES_PATH: str = "app/models/cybershield_features.pkl"
    XGB_MODEL_PATH: str = "app/models/xgb_model.pkl"   # optional, for SHAP

    # Database
    DATABASE_URL: str = "sqlite:///cybershield.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
