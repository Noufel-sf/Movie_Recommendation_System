from pydantic import BaseModel, Field, field_validator
from datetime import datetime

class MovieRecord(BaseModel):
    """Schema validation for a movie item."""
    movie_id: int = Field(gt=0, description="Unique movie identifier")
    title: str = Field(min_length=1, description="Movie title including release year")
    genres: list[str] = Field(default_factory=list, description="List of parsed genre names")

    @field_validator("genres", mode="before")
    @classmethod
    def parse_genres(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            if value == "(no genres listed)":
                return []
            return [g.strip() for g in value.split("|") if g.strip()]
        return value


class RatingRecord(BaseModel):
    """Schema validation for an explicit rating interaction."""
    user_id: int = Field(gt=0, description="Unique user identifier")
    movie_id: int = Field(gt=0, description="Unique movie identifier")
    rating: float = Field(ge=0.5, le=5.0, description="Rating scale between 0.5 and 5.0")
    timestamp: int = Field(gt=0, description="Unix timestamp of the interaction")

    @property
    def datetime(self) -> datetime:
        return datetime.fromtimestamp(self.timestamp)
