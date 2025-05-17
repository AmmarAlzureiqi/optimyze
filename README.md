# Hirestack Job Application Assistant

A modern, AI-powered job application platform that helps users find relevant jobs, generate tailored resumes and cover letters, and track their application process.

## System Architecture

The system is built using a microservices architecture with the following core components:

- **Data Ingestion Layer**: Job scraping and ETL pipeline using Scrapy, Airflow, and Kafka
- **Data Processing Layer**: ML processing pipeline using PyTorch/TensorFlow and Apache Spark
- **Storage Layer**: PostgreSQL, Elasticsearch, and Pinecone/Weaviate for vector storage
- **Application Layer**: Django REST Framework backend with Go microservices
- **Analytics Layer**: Data pipeline using Apache Spark and dbt with Metabase visualizations

## Project Structure

```
hirestack/
├── api/                    # Django REST Framework API
│   ├── core/              # Core API functionality
│   ├── jobs/              # Job-related endpoints
│   ├── users/             # User management
│   └── ml/                # ML model endpoints
├── scrapers/              # Job scraping services
│   ├── common/            # Shared scraping utilities
│   └── sources/          # Source-specific scrapers
├── ml/                    # Machine learning components
│   ├── models/            # ML model definitions
│   ├── training/          # Model training scripts
│   └── inference/         # Model inference code
├── services/              # Go microservices
│   ├── alerts/            # Real-time job alerts
│   └── recommendations/   # Job recommendations
├── airflow/               # Airflow DAGs and configs
│   ├── dags/             # ETL and ML pipeline DAGs
│   └── plugins/          # Custom Airflow plugins
├── analytics/             # Analytics components
│   ├── dbt/              # dbt transformations
│   └── dashboards/       # Metabase dashboard configs
└── infrastructure/        # Infrastructure as Code
    └── terraform/        # Terraform configurations
```

## Technology Stack

- **Backend**: Python 3.11+, Django 5.0+, Go 1.21+
- **Databases**: PostgreSQL 15+, Elasticsearch 8+, Redis 7+
- **Machine Learning**: PyTorch 2.0+, TensorFlow 2.13+, scikit-learn 1.3+
- **Data Pipeline**: Apache Airflow 2.7+, Apache Kafka 3.5+, Apache Spark 3.5+
- **Infrastructure**: AWS (ECS, Lambda, RDS, OpenSearch)

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hirestack.git
cd hirestack
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize the database:
```bash
cd api
python manage.py migrate
```

6. Start the development server:
```bash
python manage.py runserver
```

## Development Guidelines

- Follow PEP 8 style guide for Python code
- Use Black for code formatting
- Write unit tests for all new features
- Document all functions and classes using docstrings
- Use type hints in Python code
- Follow Go style guide for Go services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.