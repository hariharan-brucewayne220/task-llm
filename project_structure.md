# Project Structure

```
llm-redteam-platform/
├── backend/                    # Flask backend
│   ├── app/
│   │   ├── __init__.py        # Flask app factory
│   │   ├── models/            # Database models
│   │   │   ├── __init__.py
│   │   │   ├── assessment.py  # Assessment model
│   │   │   ├── test_result.py # TestResult model
│   │   │   └── prompt.py      # Prompt model
│   │   ├── api/               # REST API routes
│   │   │   ├── __init__.py
│   │   │   ├── assessments.py # Assessment endpoints
│   │   │   ├── results.py     # Results endpoints
│   │   │   └── export.py      # Export endpoints
│   │   ├── services/          # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── llm_client.py  # LLM API clients
│   │   │   ├── test_engine.py # Test execution engine
│   │   │   ├── metrics.py     # Metrics calculation
│   │   │   └── assessment.py  # Assessment service
│   │   ├── utils/             # Utilities
│   │   │   ├── __init__.py
│   │   │   ├── validators.py  # Input validation
│   │   │   ├── security.py    # Security utilities
│   │   │   └── config.py      # Configuration
│   │   └── websocket/         # WebSocket handlers
│   │       ├── __init__.py
│   │       └── events.py      # Socket events
│   ├── migrations/            # Database migrations
│   ├── tests/                 # Backend tests
│   │   ├── test_api.py
│   │   ├── test_services.py
│   │   └── test_models.py
│   ├── requirements.txt       # Python dependencies
│   ├── config.py             # App configuration
│   └── run.py                # Application entry point
├── frontend/                  # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Dashboard/
│   │   │   ├── Assessment/
│   │   │   ├── Results/
│   │   │   └── Common/
│   │   ├── services/          # API client
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── hooks/             # Custom hooks
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utilities
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tailwind.config.js
├── data/                      # Static data
│   ├── red_team_prompts/      # Prompt libraries
│   │   ├── jailbreak.json
│   │   ├── bias.json
│   │   ├── hallucination.json
│   │   ├── privacy.json
│   │   └── manipulation.json
│   └── cookbooks/             # Source references
├── docs/                      # Documentation
│   ├── api_spec.md
│   ├── deployment.md
│   └── user_guide.md
├── scripts/                   # Utility scripts
│   ├── setup.sh
│   └── seed_data.py
├── docker-compose.yml         # Development environment
├── .env.example              # Environment variables template
└── .gitignore
```

## Key Design Decisions

1. **Modular Architecture**: Clear separation between API, services, and data layers
2. **Async Processing**: Celery for long-running assessment tasks
3. **Real-time Updates**: WebSocket for live progress monitoring
4. **Type Safety**: TypeScript for frontend reliability
5. **Scalable Data**: JSON storage for flexible prompt management
6. **Testing Strategy**: Comprehensive test coverage for critical paths