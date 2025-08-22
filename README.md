# LLM Red Team Assessment Platform

A comprehensive platform for evaluating Large Language Model (LLM) vulnerabilities using PromptFoo methodology.

## 🚀 Features

- **PromptFoo Compliance**: Full implementation of PromptFoo red team methodology
- **Multi-LLM Support**: OpenAI, Anthropic, Google models
- **Real-time Assessment**: Live vulnerability testing with WebSocket updates
- **Centralized Scoring**: Consistent vulnerability scoring across all components
- **Interactive Dashboard**: Modern React-based UI for assessment management
- **Comprehensive Reporting**: Detailed vulnerability analysis and risk assessment

## 🏗️ Architecture

### Backend Components
- **Centralized Scorer**: PromptFoo-compliant vulnerability assessment
- **Assessment Engine**: Multi-threaded test execution
- **API Layer**: RESTful endpoints for frontend integration
- **WebSocket Server**: Real-time progress updates (`websocket_server.py`)
- **Database Layer**: SQLite with optional Redis caching

### Frontend Components
- **Dashboard**: Main assessment interface
- **Execution Controls**: Real-time test monitoring
- **Results Viewer**: Detailed vulnerability analysis
- **Model Comparison**: Cross-provider performance metrics

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- SQLite

### Backend Setup
```bash
cd llm-redteam-platform/backend
pip install -r requirements.txt

# Copy environment template
cp ../env.example .env
# Edit .env with your API keys

# Initialize database
python run.py
```

### WebSocket Server Setup (for Real-time Updates)
```bash
# In a separate terminal, from the root directory
python websocket_server.py
```

### Frontend Setup
```bash
cd dashboard
npm install
npm run dev
```

## 🔑 Configuration

Create a `.env` file in the backend directory:

```env
# LLM API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Security
SECRET_KEY=your_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here

# Database
DATABASE_URL=sqlite:///redteam.db
```

## 🎯 Usage

### Quick Start
```bash
# Terminal 1: Start backend
cd llm-redteam-platform/backend
python run.py

# Terminal 2: Start WebSocket server (for real-time updates)
python websocket_server.py

# Terminal 3: Start frontend
cd dashboard
npm run dev
```

Access the dashboard at `http://localhost:3000`

### Command Line Assessment
```bash
python red_team_engine.py
```

### API Testing
```bash
python test_api_access.py
```

## 📊 Scoring Methodology

The platform uses **vulnerability scoring**:

- **0-2.5**: Critical Risk (Severe vulnerabilities, deployment not recommended)
- **2.5-5.0**: High Risk (Significant vulnerabilities, needs attention)
- **5.0-7.5**: Medium Risk (Some vulnerabilities, requires monitoring) 
- **7.5-10**: Low Risk (Highly robust, minimal vulnerabilities)

**Scoring Scale**: 0 = Fully Vulnerable, 10 = Fully Robust

## 🔧 Test Categories

- **Jailbreak**: Bypass safety guardrails
- **Prompt Injection**: Manipulate system behavior
- **Bias Detection**: Identify harmful stereotypes
- **Privacy Violations**: Test for data leakage
- **Hallucination**: Detect fabricated information
- **Manipulation**: Assess deceptive content generation

## 📈 Assessment Flow

1. **Setup**: Configure LLM provider and test parameters
2. **Execution**: Real-time vulnerability testing with live updates
3. **Analysis**: PromptFoo assertion-based scoring
4. **Reporting**: Comprehensive risk assessment and recommendations

## 🛡️ Security Features

- **Environment-based Configuration**: No hardcoded API keys
- **Rate Limiting**: Configurable request throttling
- **Input Validation**: Comprehensive request sanitization
- **Encrypted Storage**: Secure handling of sensitive data
- **CORS Protection**: Configurable cross-origin policies

## 📁 Project Structure

```
├── llm-redteam-platform/          # Backend platform
│   ├── backend/                   # Flask application
│   │   ├── app/                   # Core application
│   │   │   ├── api/              # REST endpoints
│   │   │   ├── models/           # Database models
│   │   │   ├── services/         # Business logic
│   │   │   └── utils/            # Utilities
│   │   └── config.py             # Configuration
│   ├── data/                     # Test prompts and cookbooks
│   └── promptfooconfig.yaml      # PromptFoo configuration
├── dashboard/                     # React frontend
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── utils/               # Frontend utilities
│   │   └── types/               # TypeScript definitions
└── red_team_engine.py            # Standalone assessment engine
```

## 🔄 Centralized Scoring

The platform implements **centralized vulnerability scoring** for consistency:

- **Centralized Scorer**: Single source of truth for all scoring logic
- **PromptFoo Assertions**: Standards-compliant evaluation methodology
- **Automatic Fallback**: Graceful degradation to legacy scoring
- **Real-time Updates**: Live score calculation during assessments

## 🧪 Testing

### Run API Tests
```bash
python test_api_access.py
```

### Integration Tests
```bash
python test_integration.py
```

### System Verification
```bash
python run_full_system.py
```

## 📋 Requirements

### Backend Dependencies
- Flask, Flask-CORS, Flask-SocketIO
- SQLAlchemy, Alembic
- OpenAI, Anthropic, Google AI SDKs
- Redis (optional)
- dotenv, pyyaml

### Frontend Dependencies
- React 18, Next.js
- TypeScript
- Tailwind CSS
- Heroicons
- Socket.io Client

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 References

- [PromptFoo Documentation](https://www.promptfoo.dev/docs/red-team/)
- [PromptFoo GitHub](https://github.com/promptfoo/promptfoo)
- [LLM Security Best Practices](https://github.com/promptfoo/promptfoo)

## 🎯 Roadmap

- [ ] Advanced LLM rubric evaluation
- [ ] Custom assertion types
- [ ] Multi-turn conversation testing
- [ ] Automated report generation
- [ ] Integration with CI/CD pipelines
- [ ] Enterprise deployment guides