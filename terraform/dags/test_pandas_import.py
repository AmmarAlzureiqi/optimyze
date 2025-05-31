from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

def check_pandas():
    import pandas
    print("✅ Pandas is available!")

with DAG("test_pandas_import", start_date=datetime(2023, 1, 1), schedule_interval=None, catchup=False) as dag:
    PythonOperator(
        task_id="import_pandas",
        python_callable=check_pandas,
    )
