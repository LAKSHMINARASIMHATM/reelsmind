"""
Pydantic-free data models for the AI Reel Recommendation Agent.
Pure Python dataclasses — compatible with Python 3.14.
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any


@dataclass
class ReelInteraction:
    reel_id: str
    title: str
    description: str
    duration_seconds: int
    category: str
    topics: List[str]
    watch_duration_seconds: int
    watch_percentage: float
    liked: bool
    shared: bool
    saved: bool
    commented: bool
    comment_sentiment: str
    rewatched: bool
    engagement_score: float
    educational_value: float
    hype_score: float

    @classmethod
    def from_dict(cls, d: dict) -> 'ReelInteraction':
        return cls(
            reel_id=str(d.get('reel_id', '')),
            title=str(d.get('title', '')),
            description=str(d.get('description', '')),
            duration_seconds=int(d.get('duration_seconds', 30)),
            category=str(d.get('category', '')),
            topics=list(d.get('topics', [])),
            watch_duration_seconds=int(d.get('watch_duration_seconds', 0)),
            watch_percentage=float(d.get('watch_percentage', 0)),
            liked=bool(d.get('liked', False)),
            shared=bool(d.get('shared', False)),
            saved=bool(d.get('saved', False)),
            commented=bool(d.get('commented', False)),
            comment_sentiment=str(d.get('comment_sentiment', 'neutral')),
            rewatched=bool(d.get('rewatched', False)),
            engagement_score=float(d.get('engagement_score', 0)),
            educational_value=float(d.get('educational_value', 0)),
            hype_score=float(d.get('hype_score', 0)),
        )

    def to_dict(self):
        return asdict(self)


@dataclass
class BehavioralEvidence:
    watch_completion_contribution: float = 0.0
    rewatch_contribution: float = 0.0
    like_contribution: float = 0.0
    share_contribution: float = 0.0
    save_contribution: float = 0.0
    comment_contribution: float = 0.0
    semantic_relevance_contribution: float = 0.0
    cross_reel_contribution: float = 0.0
    supporting_reel_ids: List[str] = field(default_factory=list)
    behavioral_summary: str = ""

    def to_dict(self):
        return asdict(self)


@dataclass
class DetectedInterest:
    interest_name: str
    interest_score: float
    confidence: str
    confidence_numeric: float
    supporting_reels: List[str]
    behavioral_evidence: BehavioralEvidence
    description: str

    def to_dict(self):
        d = asdict(self)
        d['behavioral_evidence'] = self.behavioral_evidence.to_dict()
        return d


@dataclass
class InterestProfile:
    primary_interest: DetectedInterest
    secondary_interests: List[DetectedInterest]
    skill_level: str
    skill_level_justification: str
    total_reels_analyzed: int
    entertainment_ratio: float
    tech_engagement_ratio: float

    def to_dict(self):
        return {
            'primary_interest': self.primary_interest.to_dict(),
            'secondary_interests': [s.to_dict() for s in self.secondary_interests],
            'skill_level': self.skill_level,
            'skill_level_justification': self.skill_level_justification,
            'total_reels_analyzed': self.total_reels_analyzed,
            'entertainment_ratio': self.entertainment_ratio,
            'tech_engagement_ratio': self.tech_engagement_ratio,
        }


@dataclass
class LearningOutcome:
    outcome: str

    def to_dict(self):
        return {'outcome': self.outcome}


@dataclass
class RecommendationCandidate:
    candidate_id: str
    title: str
    category: str
    topics: List[str]
    difficulty: str
    educational_value: float
    engagement_potential: float
    hype_score: float
    learning_outcomes: List[LearningOutcome]
    video_url: str = ""
    interest_alignment: float = 0.0
    skill_progression_score: float = 0.0
    novelty_score: float = 0.0
    content_quality_score: float = 0.0
    final_score: float = 0.0
    why_recommended: str = ""

    def to_dict(self):
        return {
            'candidate_id': self.candidate_id,
            'title': self.title,
            'category': self.category,
            'topics': self.topics,
            'difficulty': self.difficulty,
            'educational_value': self.educational_value,
            'engagement_potential': self.engagement_potential,
            'hype_score': self.hype_score,
            'learning_outcomes': [lo.to_dict() for lo in self.learning_outcomes],
            'video_url': self.video_url,
            'interest_alignment': self.interest_alignment,
            'skill_progression_score': self.skill_progression_score,
            'novelty_score': self.novelty_score,
            'content_quality_score': self.content_quality_score,
            'final_score': self.final_score,
            'why_recommended': self.why_recommended,
        }


@dataclass
class HypeRejection:
    candidate_id: str
    title: str
    rejection_reasons: List[str]
    hype_score: float
    educational_value: float

    def to_dict(self):
        return asdict(self)


@dataclass
class Recommendation:
    rank: int
    candidate: RecommendationCandidate
    interest_match_percent: float
    recommendation_score: float
    why_recommended: str
    confidence: str
    confidence_numeric: float
    connected_interests: List[str]
    skill_progression_rationale: str

    def to_dict(self):
        return {
            'rank': self.rank,
            'candidate': self.candidate.to_dict(),
            'interest_match_percent': self.interest_match_percent,
            'recommendation_score': self.recommendation_score,
            'why_recommended': self.why_recommended,
            'confidence': self.confidence,
            'confidence_numeric': self.confidence_numeric,
            'connected_interests': self.connected_interests,
            'skill_progression_rationale': self.skill_progression_rationale,
        }


@dataclass
class ReelAnalysisOutput:
    reel_reference: str
    interest_detected: str
    why_interest: str
    recommended_reel_title: str
    recommended_reel_category: str
    why_recommendation: str
    difficulty: str
    difficulty_justification: str
    confidence: str
    confidence_numeric: float

    def to_dict(self):
        return asdict(self)


@dataclass
class ReelRepresentation:
    reel_id: str
    title: str
    topics: List[str]
    latent_domains: List[str]
    educational_depth: float
    career_relevance: float
    behavioral_score: float
    engagement_score: float
    hype_score: float
    semantic_topics: List[str]
    is_entertainment: bool
    skill_level_signal: str
    video_url: str = ""

    def to_dict(self):
        return asdict(self)


@dataclass
class TestResult:
    test_name: str
    passed: bool
    expected: str
    actual: str
    details: str

    def to_dict(self):
        return asdict(self)


@dataclass
class ValidationReport:
    total_reels_processed: int
    interest_inference_accuracy: float
    precision: float
    recall: float
    f1_score: float
    hype_content_detected: int
    hype_content_rejected: int
    hype_rejection_rate: float
    trap_tests_passed: int
    trap_tests_total: int
    trap_success_rate: float
    educational_recommendations: int
    average_processing_time_seconds: float
    test_results: List[TestResult]
    overall_pass: bool

    def to_dict(self):
        return {
            'total_reels_processed': self.total_reels_processed,
            'interest_inference_accuracy': self.interest_inference_accuracy,
            'precision': self.precision,
            'recall': self.recall,
            'f1_score': self.f1_score,
            'hype_content_detected': self.hype_content_detected,
            'hype_content_rejected': self.hype_content_rejected,
            'hype_rejection_rate': self.hype_rejection_rate,
            'trap_tests_passed': self.trap_tests_passed,
            'trap_tests_total': self.trap_tests_total,
            'trap_success_rate': self.trap_success_rate,
            'educational_recommendations': self.educational_recommendations,
            'average_processing_time_seconds': self.average_processing_time_seconds,
            'test_results': [t.to_dict() for t in self.test_results],
            'overall_pass': self.overall_pass,
        }
