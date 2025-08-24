# LLM Red Team Platform

A comprehensive web application for automated red teaming and security assessment of Large Language Models (LLMs). This platform enables organizations to identify vulnerabilities, biases, and security risks in LLMs through systematic testing and real-time monitoring.

## Overview

This defensive security tool performs automated vulnerability assessments on LLMs across multiple attack vectors including jailbreaks, bias detection, hallucination testing, privacy leakage, and manipulation attempts. The platform provides real-time monitoring, comprehensive reporting, and actionable security insights.

## Key Features

### Multi-LLM Provider Support
- **OpenAI**: GPT-3.5-turbo, GPT-4, GPT-4o,GPT-4o-mini etc
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Haiku etc
- **Google**: Gemini 

### Real-Time Assessment
- **WebSocket Integration**: Live progress updates and result streaming
- **Interactive Dashboard**: Real-time visualization of attack patterns
- **Progress Monitoring**: Track assessment completion with detailed status

### Comprehensive Analysis
- **Vulnerability Categories**: Jailbreak, Bias, Hallucination, Privacy, Manipulation
- **Automated Scoring**: 0-10 vulnerability scores with clear rubrics
- **Advanced Metrics**: BLEU scores, sentiment analysis, consistency scoring
- **Risk Prioritization**: Findings categorized by severity level

### Reporting & Visualization
- **Interactive Charts**: Plotly-powered visualizations
- **PDF Export**: Comprehensive assessment reports
- **Historical Tracking**: Compare assessments over time
- **Model Comparisons**: Side-by-side security analysis

### Advanced Capabilities
- **Scheduled Assessments**: Automated recurring security tests
- **Custom Prompts**: Upload and test organization-specific scenarios
- **API Integration**: RESTful endpoints for CI/CD integration
- **Secure Credential Management**: Encrypted storage of API keys

## Architecture

```
├── dashboard/                 # Next.js Frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom hooks (WebSocket)
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utility functions
├── llm-redteam-platform/     # Backend Services
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/         # REST API endpoints
│   │   │   ├── models/      # Database models
│   │   │   ├── services/    # Core business logic
│   │   │   └── websocket/   # WebSocket handlers
│   └── data/
│       └── red_team_prompts/ # Attack vectors & test cases
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- API keys for target LLM providers

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd block-convey-task
   ```

2. **Backend Setup**
   ```bash
   cd llm-redteam-platform
   pip install -r requirements.txt
   python run.py
   ```

3. **Frontend Setup**
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

## Usage

### Web Dashboard
1. Navigate to `http://localhost:3000`
2. Select your target LLM provider and model
3. Input API credentials securely
4. Configure assessment parameters
5. Launch automated red team testing
6. Monitor real-time progress and results
7. Review comprehensive security report

### API Endpoints
- `POST /api/assessments` - Start new assessment
- `GET /api/assessments/{id}` - Get assessment results
- `POST /api/models/compare` - Compare model security
- `GET /api/reports/{id}/export` - Export PDF report

### WebSocket Events
- `assessment_progress` - Real-time progress updates
- `test_result` - Individual test completion
- `assessment_complete` - Final results available

## Testing Methodologies

### Vulnerability Categories

#### Jailbreak Testing
Tests the model's ability to resist prompt injection and instruction bypassing attempts.
- Safety guardrail circumvention
- System prompt manipulation
- Role-playing attacks

#### Bias Detection
Evaluates the model for social, cultural, and demographic biases.
- Profession-based stereotypes
- Gender and racial bias
- Cultural assumptions

#### Hallucination Assessment
Checks for factual accuracy and fabricated information.
- False fact generation
- Confidence in incorrect information
- Source attribution accuracy

#### Privacy Evaluation
Tests for potential data leakage and privacy violations.
- Personal information disclosure
- Training data memorization
- Sensitive data handling

#### Manipulation Resistance
Assesses susceptibility to persuasive and deceptive prompts.
- Social engineering attempts
- Misinformation generation
- Emotional manipulation

##  Metrics & Scoring

### Core Metrics
- **Safeguard Success Rate**: Percentage of blocked unsafe responses
- **Average Response Time**: API performance metrics
- **Vulnerability Score**: 0-10 scale per category
- **Response Length Analysis**: Verbosity and detail metrics

### Advanced Analytics
- **Sentiment Analysis**: Bias detection in responses  
- **Consistency Score**: Multi-turn conversation analysis
- **Risk Assessment**: Prioritized vulnerability ranking

## Assessment Reports

### Automated Analysis Includes:
- **Strengths**: Security features that performed well
- **Weaknesses**: Identified vulnerabilities and risks
- **Recommendations**: Actionable steps for improvement
- **Trend Analysis**: Performance over time
- **Compliance Status**: Industry standard adherence

## Technical Implementation

### Frontend Stack
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Plotly.js**: Interactive data visualization
- **WebSocket Client**: Real-time communication

### Backend Stack
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: Database ORM with SQLite
- **WebSocket**: Real-time event streaming
- **Async Processing**: Non-blocking assessment execution
- **Security**: Encrypted credential storage

### Data Processing
- **NLTK**: Natural language processing
- **Sentence Transformers**: Semantic similarity analysis
- **Pandas**: Data manipulation and analysis
- **Asyncio**: Concurrent API request handling


## 🙏 Acknowledgments

- **PromptFoo**: Inspiration for assessment methodologies
- **OWASP**: Security best practices and guidelines
- **AI Security Community**: Research and vulnerability databases

---


