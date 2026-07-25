"""
Application configuration management
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Databricks Configuration
    databricks_host: str = Field(default="", env="DATABRICKS_HOST")
    databricks_token: str = Field(default="", env="DATABRICKS_TOKEN")
    databricks_ai_gateway_token: str = Field(default="", env="DATABRICKS_AI_GATEWAY_TOKEN")
    databricks_ai_gateway_base_url: str = Field(default="", env="DATABRICKS_AI_GATEWAY_BASE_URL")
    databricks_llm_model: str = Field(default="system.ai.meta-llama-3-1-8b-instruct", env="DATABRICKS_LLM_MODEL")
    vector_search_endpoint: str = Field(default="product_search_vs_endpoint", env="VECTOR_SEARCH_ENDPOINT")
    vector_search_index_name: str = Field(
        default="product_search_dev.gold.product_search_catalog_index",
        env="VECTOR_SEARCH_INDEX_NAME"
    )

    sql_warehouse_id: str = Field(default="", env="SQL_WAREHOUSE_ID")
    unity_catalog_name: str = Field(default="recommendation_dev", env="UNITY_CATALOG_NAME")
    unity_schema_name: str = Field(default="gold", env="UNITY_SCHEMA_NAME")
    silver_schema: str = Field(default="silver", env="SILVER_SCHEMA")
    gold_schema: str = Field(default="gold", env="GOLD_SCHEMA")

    product_table: str = Field(default="recommendation_dev.silver.product_master", env="PRODUCT_TABLE")
    brand_table: str = Field(default="recommendation_dev.silver.brand", env="BRAND_TABLE")
    category_table: str = Field(default="recommendation_dev.silver.category", env="CATEGORY_TABLE")
    inventory_table: str = Field(default="recommendation_dev.silver.inventory", env="INVENTORY_TABLE")
    product_vector_index: str = Field(default="recommendation_dev.gold.product_embedding_index", env="PRODUCT_VECTOR_INDEX")

    recommendation_endpoint: str = Field(default="product-recommendation-dev", env="RECOMMENDATION_ENDPOINT")
    recommendation_bundle_path: str = Field(default="", env="RECOMMENDATION_BUNDLE_PATH")
    search_bundle_path: str = Field(default=r"E:\PraveenFrankly\Databricks\Accelerators\Retail\Product-Search\ProductSearch-Amazon-Bundle", env="SEARCH_BUNDLE_PATH")

    # LLM / Embedding Model Configuration
    llm_endpoint: str = Field(default="databricks-meta-llama-3-1-70b-instruct", env="LLM_ENDPOINT")
    embedding_model_endpoint: str = Field(default="databricks-bge-large-en", env="EMBEDDING_MODEL_ENDPOINT")

    # Data Mode
    app_data_mode: str = Field(default="live", env="APP_DATA_MODE")

    @property
    def is_mock_mode(self) -> bool:
        return self.app_data_mode.lower() == "mock"

    # Application Configuration
    app_name: str = Field(default="Retail AI Portal", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    # API Configuration
    api_v1_prefix: str = Field(default="/api/v1", env="API_V1_PREFIX")
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")

    # Security — optional with a dev fallback so server starts without .env
    jwt_secret_key: str = Field(default="dev-secret-key-please-change-in-production", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        env="ALLOWED_ORIGINS"
    )

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=100, env="RATE_LIMIT_PER_MINUTE")
    rate_limit_per_hour: int = Field(default=1000, env="RATE_LIMIT_PER_HOUR")

    # Cache Configuration
    cache_enabled: bool = Field(default=False, env="CACHE_ENABLED")
    cache_ttl_seconds: int = Field(default=3600, env="CACHE_TTL_SECONDS")
    redis_host: str = Field(default="localhost", env="REDIS_HOST")
    redis_port: int = Field(default=6379, env="REDIS_PORT")
    redis_db: int = Field(default=0, env="REDIS_DB")
    redis_password: str = Field(default="", env="REDIS_PASSWORD")

    # Search Configuration
    max_query_length: int = Field(default=200, env="MAX_QUERY_LENGTH")
    max_results_per_page: int = Field(default=50, env="MAX_RESULTS_PER_PAGE")
    default_page_size: int = Field(default=20, env="DEFAULT_PAGE_SIZE")
    vector_search_top_k: int = Field(default=100, env="VECTOR_SEARCH_TOP_K")
    similarity_threshold: float = Field(default=0.58, env="SIMILARITY_THRESHOLD")

    # Performance
    databricks_connection_timeout: int = Field(default=30, env="DATABRICKS_CONNECTION_TIMEOUT")
    databricks_read_timeout: int = Field(default=60, env="DATABRICKS_READ_TIMEOUT")
    max_concurrent_requests: int = Field(default=10, env="MAX_CONCURRENT_REQUESTS")

    # Monitoring
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=9090, env="METRICS_PORT")
    enable_request_logging: bool = Field(default=True, env="ENABLE_REQUEST_LOGGING")
    slow_query_threshold_ms: int = Field(default=2000, env="SLOW_QUERY_THRESHOLD_MS")

    class Config:
        env_file = ".env"
        case_sensitive = False

        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name == "allowed_origins":
                return [x.strip() for x in raw_val.split(",")]
            return raw_val

    @property
    def databricks_url(self) -> str:
        """Full Databricks workspace URL — strips any accidental https:// prefix from env var"""
        host = self.databricks_host.rstrip("/")
        if not host:
            return ""
        if host.startswith("https://") or host.startswith("http://"):
            return host
        return f"https://{host}"

    @property
    def is_databricks_configured(self) -> bool:
        """True if Databricks credentials are present"""
        return bool(self.databricks_host and (self.databricks_token or self.resolved_token))

    @property
    def resolved_token(self) -> str:
        """Resolves the Databricks token, falling back to secure CLI profiles if the env token is default or empty."""
        token = self.databricks_token
        if not token or token.startswith("dapi34a9e"):
            import subprocess
            import json
            import os
            import shutil
            
            # Prefer the newer CLI binary path
            cli_path = "databricks"
            if not shutil.which(cli_path):
                cli_path = r"C:\Users\ADMIN\bin\databricks.exe"
                
            for profile in ["pf277", "praveen", "Praveen", "praveen.v.ihub@snsgroups.com", "DEFAULT"]:
                try:
                    res = subprocess.run(
                        [cli_path, "auth", "token", "--profile", profile],
                        capture_output=True,
                        text=True,
                        check=True
                    )
                    data = json.loads(res.stdout)
                    cli_token = data.get("access_token")
                    if cli_token:
                        return cli_token
                except Exception:
                    continue
        return token

    @property
    def gold_table(self) -> str:
        """Full path to the Gold product search catalog table"""
        return f"{self.unity_catalog_name}.{self.unity_schema_name}.product_search_catalog"

    @property
    def full_schema_name(self) -> str:
        """Full schema name in Unity Catalog format"""
        return f"{self.unity_catalog_name}.{self.unity_schema_name}"

    @property
    def redis_url(self) -> str:
        """Redis connection URL"""
        if self.redis_password:
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"


# Global settings instance
settings = Settings()
