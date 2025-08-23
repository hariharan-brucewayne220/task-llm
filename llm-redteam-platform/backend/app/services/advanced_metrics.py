"""Advanced metrics service for calculating BLEU scores, sentiment bias, and consistency scores."""
import logging
import numpy as np
from typing import List, Optional, Dict, Any
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from nltk.tokenize import word_tokenize
from nltk.sentiment.vader import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

class AdvancedMetricsService:
    """Service for calculating advanced NLP metrics."""
    
    def __init__(self):
        """Initialize the advanced metrics service."""
        try:
            # Download required NLTK data
            import nltk
            nltk.download('vader_lexicon', quiet=True)
            nltk.download('punkt', quiet=True)
            
            # Initialize sentiment analyzer
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
            
            # Initialize sentence transformer (lazy loading)
            self._sentence_transformer = None
            
            logger.info("Advanced metrics service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize advanced metrics service: {str(e)}")
            self.sentiment_analyzer = None
            self._sentence_transformer = None
    
    @property
    def sentence_transformer(self):
        """Lazy load sentence transformer to avoid startup delays."""
        if self._sentence_transformer is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Sentence transformer loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load sentence transformer: {str(e)}")
                return None
        return self._sentence_transformer
    
    def calculate_bleu_score(self, reference_text: str, generated_text: str) -> float:
        """
        Calculate BLEU score for factual accuracy.
        
        Args:
            reference_text: The reference/expected text
            generated_text: The generated/actual text
            
        Returns:
            BLEU score scaled to 0-10 range
        """
        try:
            if not reference_text or not generated_text:
                return 0.0
            
            # Tokenize texts
            reference_tokens = word_tokenize(reference_text.lower())
            generated_tokens = word_tokenize(generated_text.lower())
            
            if not reference_tokens or not generated_tokens:
                return 0.0
            
            # Use smoothing for short texts
            smoothing = SmoothingFunction().method1
            score = sentence_bleu([reference_tokens], generated_tokens, smoothing_function=smoothing)
            
            # Scale to 0-10 range
            scaled_score = min(score * 10, 10.0)
            return round(scaled_score, 3)
            
        except Exception as e:
            logger.error(f"Error calculating BLEU score: {str(e)}")
            return 0.0
    
    def calculate_sentiment_bias(self, prompt_text: str, response_text: str) -> float:
        """
        Analyze sentiment bias in responses.
        
        Args:
            prompt_text: The input prompt
            response_text: The model response
            
        Returns:
            Sentiment bias score (0-10, lower = less biased)
        """
        try:
            if not response_text:
                return 0.0
            
            # Analyze sentiment of response
            response_sentiment = self.sentiment_analyzer.polarity_scores(response_text)
            
            if not response_sentiment:
                return 0.0
            
            # Check for extreme sentiment (potential bias)
            compound = abs(response_sentiment['compound'])
            
            # Higher score = more biased
            bias_score = compound * 10  # Scale to 0-10
            return round(bias_score, 3)
            
        except Exception as e:
            logger.error(f"Error calculating sentiment bias: {str(e)}")
            return 0.0
    
    def calculate_consistency_score(self, responses: List[str]) -> float:
        """
        Measure consistency across multiple responses.
        
        Args:
            responses: List of response texts
            
        Returns:
            Consistency score (0-10, higher = more consistent)
        """
        try:
            if not responses or len(responses) < 2:
                return 10.0  # Perfect consistency for single response
            
            # Filter out empty responses
            valid_responses = [r for r in responses if r and len(r.strip()) > 0]
            
            if len(valid_responses) < 2:
                return 10.0
            
            # Get embeddings for all responses
            if not self.sentence_transformer:
                logger.warning("Sentence transformer not available for consistency calculation")
                return 5.0  # Default middle score
            
            embeddings = self.sentence_transformer.encode(valid_responses)
            
            # Calculate cosine similarity matrix
            similarities = []
            for i in range(len(embeddings)):
                for j in range(i + 1, len(embeddings)):
                    try:
                        # Normalize vectors
                        vec1 = embeddings[i] / np.linalg.norm(embeddings[i])
                        vec2 = embeddings[j] / np.linalg.norm(embeddings[j])
                        
                        # Calculate cosine similarity
                        similarity = float(np.dot(vec1, vec2))
                        similarities.append(similarity)
                    except Exception as e:
                        logger.warning(f"Error calculating similarity between responses {i} and {j}: {str(e)}")
                        continue
            
            if not similarities:
                return 5.0  # Default middle score
            
            # Average similarity (higher = more consistent)
            avg_similarity = float(np.mean(similarities))
            
            # Invert and scale to 0-10 (higher similarity = higher consistency score)
            consistency_score = avg_similarity * 10
            return round(max(0.0, min(10.0, consistency_score)), 3)
            
        except Exception as e:
            logger.error(f"Error calculating consistency score: {str(e)}")
            return 5.0  # Default middle score
    
    def calculate_category_consistency(self, results: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Calculate consistency scores for each test category.
        
        Args:
            results: List of test results with category and response_text
            
        Returns:
            Dictionary mapping categories to consistency scores
        """
        try:
            category_responses = {}
            
            # Group responses by category
            for result in results:
                if result.get('response_text') and result.get('category'):
                    category = result['category']
                    if category not in category_responses:
                        category_responses[category] = []
                    category_responses[category].append(result['response_text'])
            
            # Calculate consistency for each category
            category_consistency = {}
            for category, responses in category_responses.items():
                if len(responses) >= 2:
                    consistency = self.calculate_consistency_score(responses)
                    category_consistency[category] = consistency
                else:
                    category_consistency[category] = 10.0  # Perfect for single response
            
            return category_consistency
            
        except Exception as e:
            logger.error(f"Error calculating category consistency: {str(e)}")
            return {}
    
    def calculate_comprehensive_metrics(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate all advanced metrics for a set of test results.
        
        Args:
            results: List of test results
            
        Returns:
            Dictionary containing all advanced metrics
        """
        try:
            metrics = {
                'bleu_scores': [],
                'sentiment_scores': [],
                'consistency_scores': [],
                'category_consistency': {},
                'overall_metrics': {}
            }
            
            # Calculate individual metrics
            for result in results:
                if result.get('response_text'):
                    # Sentiment bias (always available)
                    sentiment = self.calculate_sentiment_bias(
                        result.get('prompt_text', ''),
                        result['response_text']
                    )
                    metrics['sentiment_scores'].append(sentiment)
                    
                    # BLEU score (if reference available)
                    if result.get('reference_text'):
                        bleu = self.calculate_bleu_score(
                            result['reference_text'],
                            result['response_text']
                        )
                        metrics['bleu_scores'].append(bleu)
            
            # Calculate category consistency
            metrics['category_consistency'] = self.calculate_category_consistency(results)
            
            # Calculate overall metrics
            if metrics['sentiment_scores']:
                metrics['overall_metrics']['sentiment_bias_score'] = float(np.mean(metrics['sentiment_scores']))
            
            if metrics['bleu_scores']:
                metrics['overall_metrics']['bleu_score_factual'] = float(np.mean(metrics['bleu_scores']))
            
            if metrics['category_consistency']:
                metrics['overall_metrics']['consistency_score'] = float(np.mean(list(metrics['category_consistency'].values())))
            
            # Round all scores
            for key, value in metrics['overall_metrics'].items():
                if isinstance(value, float):
                    metrics['overall_metrics'][key] = round(value, 3)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating comprehensive metrics: {str(e)}")
            return {
                'bleu_scores': [],
                'sentiment_scores': [],
                'consistency_scores': [],
                'category_consistency': {},
                'overall_metrics': {},
                'error': str(e)
            }
    
    def is_available(self) -> bool:
        """Check if advanced metrics service is available."""
        return self.sentiment_analyzer is not None and self.sentence_transformer is not None
