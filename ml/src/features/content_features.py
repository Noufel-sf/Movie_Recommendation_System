import math
import numpy as np
import pandas as pd


def build_genre_multihot_matrix(movies_df: pd.DataFrame) -> tuple[np.ndarray, list[str], dict[int, int]]:
    """
    Builds a multi-hot binary vector for each movie based on its genres.
    
    Returns:
        matrix: 2D NumPy array of shape (num_movies, num_genres) where cell is 1 or 0.
        genre_vocab: List of unique genre names corresponding to columns.
        movie_id_to_idx: Mapping from movie_id to matrix row index.
    """
    # 1. Collect all unique genres to form the vocabulary
    genre_set = set()
    for genre_str in movies_df["genres"].dropna():
        for g in genre_str.split("|"):
            if g.strip():
                genre_set.add(g.strip())
                
    genre_vocab = sorted(list(genre_set))
    genre_to_col = {g: idx for idx, g in enumerate(genre_vocab)}
    
    # 2. Build row mapping
    movie_id_to_idx = {int(mid): idx for idx, mid in enumerate(movies_df["movie_id"])}
    
    # 3. Populate binary multi-hot matrix
    num_movies = len(movies_df)
    num_genres = len(genre_vocab)
    matrix = np.zeros((num_movies, num_genres), dtype=np.float32)
    
    for row_idx, (_, row) in enumerate(movies_df.iterrows()):
        genre_str = row["genres"]
        if pd.notna(genre_str) and genre_str:
            for g in genre_str.split("|"):
                g = g.strip()
                if g in genre_to_col:
                    matrix[row_idx, genre_to_col[g]] = 1.0
                    
    return matrix, genre_vocab, movie_id_to_idx


class ManualTfidfVectorizer:
    """
    A transparent, educational TF-IDF Vectorizer built in pure Python and NumPy.
    
    TF (Term Frequency):
        How often token t appears in document d divided by total words in d.
        TF(t, d) = count(t, d) / len(d)
        
    IDF (Inverse Document Frequency):
        Measures how rare or informative a token is across all documents N.
        IDF(t) = log(1 + (N / (1 + doc_count(t)))) + 1
        
    TF-IDF(t, d) = TF(t, d) * IDF(t)
    Followed by L2-normalization so that vector length equals 1.0.
    """
    def __init__(self):
        self.vocabulary: dict[str, int] = {}
        self.idf_: np.ndarray = np.array([])
        self.num_docs: int = 0

    def fit_transform(self, documents: list[str]) -> np.ndarray:
        self.num_docs = len(documents)
        tokenized_docs = [self._tokenize(doc) for doc in documents]
        
        # 1. Build Vocabulary: Collect unique tokens
        unique_tokens = sorted(list({token for doc in tokenized_docs for token in doc}))
        self.vocabulary = {token: idx for idx, token in enumerate(unique_tokens)}
        vocab_size = len(self.vocabulary)
        
        # 2. Compute Document Frequencies (how many docs contain each token)
        doc_counts = np.zeros(vocab_size, dtype=np.float32)
        for doc in tokenized_docs:
            seen_tokens = set(doc)
            for token in seen_tokens:
                doc_counts[self.vocabulary[token]] += 1.0
                
        # 3. Compute IDF for every token
        # Smooth IDF formula: log((1 + N) / (1 + doc_count)) + 1
        self.idf_ = np.log((1.0 + self.num_docs) / (1.0 + doc_counts)) + 1.0
        
        # 4. Compute TF-IDF matrix
        tfidf_matrix = np.zeros((self.num_docs, vocab_size), dtype=np.float32)
        for i, doc in enumerate(tokenized_docs):
            if not doc:
                continue
            doc_len = len(doc)
            for token in doc:
                col = self.vocabulary[token]
                # Increment term count
                tfidf_matrix[i, col] += 1.0
            # Term Frequency = count / doc_len
            tfidf_matrix[i] = (tfidf_matrix[i] / doc_len) * self.idf_
            
            # L2 Normalization: divide by Euclidean norm so ||v|| = 1.0
            norm = np.linalg.norm(tfidf_matrix[i])
            if norm > 0:
                tfidf_matrix[i] = tfidf_matrix[i] / norm
                
        return tfidf_matrix

    def _tokenize(self, text: str) -> list[str]:
        if not isinstance(text, str):
            return []
        # Lowercase and split on non-alphanumeric characters
        import re
        tokens = re.findall(r"\b[a-zA-Z0-9]{2,}\b", text.lower())
        return tokens


def cosine_similarity_matrix(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """
    Computes pairwise Cosine Similarity between rows of matrix A and matrix B:
        CosineSim(u, v) = (u . v) / (||u|| * ||v||)
        
    If vectors are already L2-normalized (length = 1.0), this simplifies to dot product:
        CosineSim(u, v) = u . v
    """
    # Compute norms
    norm_a = np.linalg.norm(a, axis=1, keepdims=True)
    norm_b = np.linalg.norm(b, axis=1, keepdims=True)
    
    # Avoid division by zero
    norm_a[norm_a == 0] = 1e-10
    norm_b[norm_b == 0] = 1e-10
    
    dot_product = np.dot(a, b.T)
    return dot_product / (norm_a * norm_b.T)
