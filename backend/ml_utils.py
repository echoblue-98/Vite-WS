from __future__ import annotations
from collections import defaultdict
import math

class SimpleMultinomialNB:
    """
    Tiny Multinomial Naive Bayes for text classification.
    - No numpy/scipy required.
    - Fits on token counts from pre-tokenized texts.
    """
    def __init__(self):
        self.class_log_priors = {}  # class -> log prior
        self.feature_log_probs = {}  # class -> dict(token -> log P(token|class))
        self.vocab = set()
        self.class_counts = defaultdict(int)
        self.token_counts = defaultdict(lambda: defaultdict(int))
        self.total_tokens_per_class = defaultdict(int)

    def fit(self, docs: list[list[str]], y: list[str]):
        # Count classes and tokens
        n_docs = len(docs)
        for tokens, cls in zip(docs, y):
            self.class_counts[cls] += 1
            for tok in tokens:
                self.vocab.add(tok)
                self.token_counts[cls][tok] += 1
                self.total_tokens_per_class[cls] += 1
        # Compute log priors
        for cls, c in self.class_counts.items():
            self.class_log_priors[cls] = math.log(c / n_docs)
        # Compute smoothed log likelihoods
        V = max(1, len(self.vocab))
        for cls in self.class_counts:
            denom = self.total_tokens_per_class[cls] + V  # Laplace smoothing
            probs = {}
            for tok in self.vocab:
                num = self.token_counts[cls].get(tok, 0) + 1
                probs[tok] = math.log(num / denom)
            self.feature_log_probs[cls] = probs
        return self

    def predict(self, docs: list[list[str]]):
        preds = []
        for tokens in docs:
            scores = {}
            token_counts = defaultdict(int)
            for t in tokens:
                token_counts[t] += 1
            for cls in self.class_counts:
                score = self.class_log_priors[cls]
                flp = self.feature_log_probs[cls]
                for tok, cnt in token_counts.items():
                    score += cnt * flp.get(tok, math.log(1 / (self.total_tokens_per_class[cls] + max(1, len(self.vocab)))))
                scores[cls] = score
            # pick max score class
            pred = max(scores, key=scores.get)
            preds.append(pred)
        return preds
