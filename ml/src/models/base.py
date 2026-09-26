from abc import ABC, abstractmethod
import pandas as pd


class BaseRecommender(ABC):
    """
    Abstract Base Class defining the contract for all recommendation models.
    Every algorithm (Baseline, Content-Based, Collaborative Filtering, Matrix Factorization, Neural)
    must implement this interface.
    """

    @abstractmethod
    def fit(self, train_df: pd.DataFrame) -> "BaseRecommender":
        """
        Train or compute parameters from the training interactions.
        
        Args:
            train_df: DataFrame with at least ['user_id', 'movie_id', 'rating', 'timestamp']
        """
        pass

    @abstractmethod
    def predict(self, user_id: int, movie_id: int) -> float:
        """
        Predict the affinity/rating for a specific (user_id, movie_id) pair.
        
        Returns:
            Predicted score (typically float in range [0.5, 5.0]).
        """
        pass

    @abstractmethod
    def recommend(
        self, 
        user_id: int, 
        n: int = 10, 
        exclude_seen: bool = True
    ) -> list[tuple[int, float]]:
        """
        Generate top-N recommended movie IDs with predicted scores for a user.
        
        Args:
            user_id: The target user.
            n: Number of recommendations to return.
            exclude_seen: Whether to filter out movies the user has already rated in train.
            
        Returns:
            List of (movie_id, predicted_score) tuples ordered descending by score.
        """
        pass
