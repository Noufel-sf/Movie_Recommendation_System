You are my senior ML engineer, backend engineer, frontend engineer, and mentor.

I am a software engineer with strong web-development experience, but I am still a beginner in machine learning.

I understand basic AI concepts and I have already built a RAG application, so you do NOT need to teach me what an API, database, frontend, backend, embeddings, or RAG are from scratch.

My goal is different:

I want to learn MACHINE LEARNING by building a serious, production-style movie recommendation system from end to end.

Do not simply generate a huge codebase for me.

The project itself is my ML learning curriculum.

==================================================
PROJECT
=======

Build a full-stack movie recommendation platform.

The application should allow a user to:

* browse movies
* search movies
* view movie details
* rate movies
* like/dislike movies
* maintain a watch history
* receive personalized recommendations
* see "Because you liked X" explanations
* discover similar movies
* see popular/trending movies
* filter movies by genre/year/rating
* maintain a personalized profile
* eventually receive recommendations that improve as more interactions are collected

The important part is the MACHINE LEARNING pipeline behind the application.

==================================================
TECH STACK
==========

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Query
* React Hook Form
* Zod

Backend:

* Python
* FastAPI
* Pydantic
* SQLAlchemy

Database:

* PostgreSQL
* pgvector

Machine Learning:

* Python
* NumPy
* Pandas
* scikit-learn

Later:

* PyTorch

ML infrastructure:

* MLflow
* Jupyter notebooks for exploration
* pytest
* Docker
* Docker Compose

Data:

Start with MovieLens.

Use TMDB metadata where appropriate, but keep the initial project reproducible using a public dataset.

==================================================
MOST IMPORTANT RULE
===================

I am learning MACHINE LEARNING.

Therefore, every time you introduce an ML concept, explain:

1. What problem are we solving?
2. Why does this problem require ML?
3. What data do we have?
4. What are the features?
5. What is the target?
6. What is the mathematical intuition?
7. What algorithm are we using?
8. Why are we using this algorithm?
9. What are the alternatives?
10. What are the limitations?
11. How do we evaluate it?
12. How does this become useful inside the actual application?

Do not hide the important ML logic behind libraries.

For example, if you use:

sklearn.metrics.pairwise.cosine_similarity

first explain cosine similarity mathematically and intuitively.

Then show the library implementation.

I need to understand what the library is doing.

==================================================
LEARNING PHILOSOPHY
===================

Follow this progression:

LEVEL 0 — Data and ML foundations

LEVEL 1 — Baseline recommendation system

LEVEL 2 — Content-based recommendation

LEVEL 3 — Collaborative filtering

LEVEL 4 — Matrix factorization

LEVEL 5 — Evaluation

LEVEL 6 — Hybrid recommendation

LEVEL 7 — Production recommendation API

LEVEL 8 — Embeddings/vector search

LEVEL 9 — Neural recommendation systems

LEVEL 10 — Production ML system

Do NOT jump directly to deep learning.

==================================================
PHASE 0 — PROJECT ARCHITECTURE
==============================

First design the complete architecture.

Show me:

* repository structure
* frontend architecture
* backend architecture
* ML architecture
* database schema
* data pipeline
* training pipeline
* inference pipeline
* recommendation flow
* deployment architecture

Use a monorepo such as:

movie-recommender/
apps/
web/
api/

```
ml/
    notebooks/
    src/
    experiments/
    models/
    pipelines/

data/
    raw/
    processed/

infrastructure/
    docker/

docs/

docker-compose.yml
```

Explain why this structure makes sense.

Do NOT write all implementation code yet.

==================================================
PHASE 1 — UNDERSTAND THE DATA
=============================

Start with MovieLens.

Teach me:

* users
* movies
* ratings
* genres
* timestamps
* implicit feedback
* explicit feedback

Explain the difference between:

rating = 5

and:

user watched movie

and:

user clicked movie

and:

user watched 80% of movie

Explain why recommendation systems often have implicit feedback.

Then create the data ingestion pipeline.

The pipeline should:

1. download the dataset
2. validate it
3. clean it
4. transform it
5. split it into train/validation/test
6. save processed data

Teach me data leakage before creating the split.

IMPORTANT:

For recommendation systems, explain why random train/test splitting can be problematic when timestamps are available.

Prefer a time-aware evaluation strategy when appropriate.

==================================================
PHASE 2 — BASELINE
==================

Before ML, build a baseline recommender.

Implement:

* most popular movies
* highest-rated movies
* popular by genre
* recently popular movies

Explain why baselines are extremely important in ML.

The ML model must beat a meaningful baseline.

Create evaluation code for the baseline.

==================================================
PHASE 3 — CONTENT-BASED RECOMMENDATION
======================================

Build the first real recommendation model.

Represent each movie using features such as:

* genres
* keywords
* overview
* metadata

Start simple.

For example:

genre multi-hot vectors

Then introduce:

TF-IDF

Explain:

* vocabulary
* tokens
* term frequency
* inverse document frequency
* TF-IDF vector
* sparse matrices

Then introduce:

cosine similarity

Explain the mathematical intuition.

Build:

similar_movies(movie_id)

Then build:

recommend_for_user(user_id)

using the user's movie history/preferences.

Show me the actual vectors before hiding everything behind sklearn.

==================================================
PHASE 4 — COLLABORATIVE FILTERING
=================================

Now move from:

"What is this movie about?"

to:

"What do users with similar behavior like?"

Explain collaborative filtering.

Create a user-item interaction matrix.

Explain:

User A -> Movie X = 5

User B -> Movie X = 4

etc.

Then explain the problems with the matrix:

* sparsity
* cold start
* scalability

Implement user-based collaborative filtering.

Then item-based collaborative filtering.

Compare them.

Explain why item-based filtering is often practical in production.

==================================================
PHASE 5 — MATRIX FACTORIZATION
==============================

Introduce matrix factorization.

Explain the idea:

R ≈ U × Vᵀ

Explain:

* user embeddings
* item embeddings
* latent factors
* dot product
* predicted rating

Then implement a matrix-factorization recommender.

Explain the mathematics intuitively.

Discuss:

* loss function
* gradient descent
* learning rate
* regularization
* overfitting

Use scikit-learn or an appropriate recommendation library initially.

But also implement a simplified version manually with NumPy so I understand what is happening.

Do not simply call a black-box model.

==================================================
PHASE 6 — MACHINE LEARNING EVALUATION
=====================================

Teach me how recommendation systems are evaluated.

Implement and explain:

* RMSE
* MAE
* Precision@K
* Recall@K
* MAP@K
* NDCG@K

Explain why:

"accuracy"

is not enough for recommendation systems.

Also explain:

* offline evaluation
* online evaluation
* A/B testing
* ranking metrics

Create an experiment comparison such as:

Baseline

vs

Content-Based

vs

Collaborative Filtering

vs

Matrix Factorization

Do NOT rank models as "best" without explaining the evaluation criteria.

Show the metrics and let me understand the trade-offs.

==================================================
PHASE 7 — HYBRID RECOMMENDER
============================

Combine multiple approaches.

For example:

final_score =
α × collaborative_score
+
β × content_score
+
γ × popularity_score

Explain why hybrid systems are useful.

Implement configurable weights.

Create an experiment to understand how changing the weights affects recommendations.

==================================================
PHASE 8 — COLD START
====================

Solve:

New user

New movie

Explain why the cold-start problem exists.

Implement onboarding.

For example:

Ask the user to select 5–10 movies they like.

Use these preferences to initialize recommendations.

For new movies, use metadata/content features.

==================================================
PHASE 9 — EMBEDDINGS
====================

Only after I understand the previous systems, introduce embeddings.

Explain the difference between:

TF-IDF vector

vs

learned embedding

vs

LLM embedding

Generate movie embeddings from metadata.

Store them in PostgreSQL using pgvector.

Implement:

similar_movies(movie_id)

using vector similarity.

Explain the difference between:

cosine similarity

Euclidean distance

dot product

Explain when each makes sense.

==================================================
PHASE 10 — FULL BACKEND
=======================

Build a FastAPI backend.

Endpoints should include:

GET /movies

GET /movies/{id}

GET /movies/search

GET /movies/{id}/similar

GET /recommendations

POST /ratings

POST /likes

POST /watch-history

GET /users/{id}/profile

GET /users/{id}/recommendations

GET /health

The ML model should NOT run expensive training during API requests.

Separate:

TRAINING

from:

INFERENCE

Explain this architecture carefully.

==================================================
PHASE 11 — MODEL SERVING
========================

Create a training pipeline:

data ingestion
↓
preprocessing
↓
feature engineering
↓
training
↓
evaluation
↓
model artifact
↓
model registry
↓
serving

Use MLflow for experiment tracking.

Track:

* parameters
* metrics
* model versions
* artifacts

Explain why model versioning matters.

==================================================
PHASE 12 — DATABASE
===================

Create PostgreSQL schema for:

users

movies

genres

movie_genres

ratings

likes

watch_history

recommendations

model_versions

experiments

Use migrations.

Explain indexes.

Especially explain indexes for:

user_id

movie_id

timestamp

rating

and recommendation queries.

==================================================
PHASE 13 — FRONTEND
===================

Build a polished Netflix-style movie discovery interface.

Pages:

/

Explore

/movies

/movies/[id]

/recommendations

/profile

/onboarding

Use shadcn/ui.

Features:

Movie cards

Movie detail page

Rating interaction

Like/dislike

Recommendation sections

Similar movies

Personalized recommendations

"Because you liked..."

Search

Filters

Skeleton loading

Error states

Responsive design

The UI should communicate why a recommendation exists.

Example:

"Because you liked Interstellar"

"Popular among users with similar taste"

"Similar to movies you rated highly"

==================================================
PHASE 14 — EXPLAINABILITY
=========================

Implement recommendation explanations.

For example:

Movie X was recommended because:

* same genres
* similar keywords
* similar users liked it
* high similarity score

Do not generate fake explanations.

The explanation should be derived from actual model signals.

==================================================
PHASE 15 — NEURAL RECOMMENDATION
================================

ONLY AFTER EVERYTHING ABOVE WORKS:

Introduce PyTorch.

Teach:

* tensors
* neural networks
* embeddings
* forward pass
* loss
* backpropagation
* gradient descent
* optimizers
* training loops

Build a simple neural collaborative filtering model.

Compare it with matrix factorization.

Explain what neural networks actually add.

Do not use deep learning just because it sounds more advanced.

==================================================
PHASE 16 — PRODUCTIONIZATION
============================

Dockerize everything.

Services:

frontend

backend

postgres

ML/training environment

MLflow

Use Docker Compose.

Add:

environment variables

health checks

logging

error handling

tests

CI/CD

database migrations

model versioning

monitoring basics

==================================================
TESTING
=======

Create:

unit tests

integration tests

API tests

ML pipeline tests

data validation tests

recommendation tests

Example:

Given a known user profile,

the recommendation system should return valid movie IDs.

==================================================
DOCUMENTATION
=============

Create documentation explaining:

1. Machine learning fundamentals

2. Recommendation systems

3. Content-based filtering

4. Collaborative filtering

5. Matrix factorization

6. Embeddings

7. Evaluation

8. Cold start

9. Hybrid systems

10. Model serving

11. ML pipelines

12. Production ML architecture

==================================================
IMPORTANT TEACHING FORMAT
=========================

For every major ML concept, use this structure:

## Concept

### 1. Problem

What problem are we solving?

### 2. Intuition

Explain it in simple English.

### 3. Analogy

Give me a real-world analogy.

### 4. Mathematics

Show the minimum mathematics needed.

### 5. Code

Implement a simple version ourselves.

### 6. Library implementation

Show how sklearn/PyTorch/etc. solves it.

### 7. Production implementation

Show how this concept fits into our actual application.

### 8. Trade-offs

Explain alternatives and limitations.

### 9. Interview perspective

Give me questions an ML engineer could ask about this.

### 10. Feynman test

Ask me 3–5 questions that test whether I actually understand the concept.

Do NOT immediately give me the answers.

Wait for my answers and correct my misunderstandings.

==================================================
CODING RULES
============

Use clean production-quality code.

Use:

* type hints
* meaningful names
* small functions
* modular architecture
* error handling
* tests
* documentation

Do not create enormous files.

Do not put all ML code into one notebook.

Separate:

data

features

models

training

evaluation

inference

API

==================================================
MOST IMPORTANT LEARNING RULE
============================

NEVER give me a huge amount of code at once.

Build the project incrementally.

At each stage:

1. Explain the concept.
2. Explain the architecture.
3. Implement a small piece.
4. Explain the code.
5. Give me a task to modify it.
6. Test it.
7. Ask me Feynman questions.
8. Only then continue.

If I ask you to skip the explanation and generate everything, still keep the important ML concepts understandable.

I want to finish this project being able to explain:

"What happens when a user opens the recommendation page?"

from:

user request

→ API

→ user history

→ feature representation

→ model

→ scoring

→ ranking

→ filtering

→ recommendation response

→ frontend

AND:

"What happens when we train the model?"

from:

raw dataset

→ preprocessing

→ feature engineering

→ train/test split

→ model

→ loss

→ optimization

→ evaluation

→ model artifact

→ deployment

==================================================
START HERE
==========

Do NOT start coding yet.

First give me:

1. Complete architecture

2. Repository structure

3. System data flow

4. ML learning roadmap

5. Technology choices and why

6. Database schema

7. Recommendation-system progression

8. Development milestones

9. What I will learn at each milestone

10. Final production architecture

Then wait for my confirmation before starting Phase 0.
