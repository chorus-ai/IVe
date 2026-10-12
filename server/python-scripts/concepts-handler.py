"""
Populate the app DB's `concepts` table — a precomputed index of which OMOP
concepts appear in which clinical table/column, with a per-concept patient count
and denormalized concept name. IVE's concept search (/api/vocab/concept) reads it.

Run ONCE before launching the server (it DROPs + recreates the table each run):

    cd server
    pip install -r python-scripts/requirements.txt      # once
    python python-scripts/concepts-handler.py
    npm start

Connection + schema names come from the same env the Node server uses
(server/.env), so no credentials live in this file. Postgres only — the app DB
must be Postgres for this script (it uses schemas / psycopg2), as in the CHoRUS
deployment where `app` and `omopcdm` schemas share one database.
"""

import os

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


# ---------------------------------------------------------------
# Env-driven connections (OMOP = read source, APP = write target).
# Every field is defined per DB — no shared DB_* fallback, matching
# server/config/env.js.
# ---------------------------------------------------------------
def env(*names, default=None):
    for n in names:
        v = os.environ.get(n)
        if v:
            return v
    return default


def url(prefix):
    user = env(f"{prefix}_DB_USERNAME")
    pw = env(f"{prefix}_DB_PASSWORD")
    host = env(f"{prefix}_DB_HOSTNAME")
    port = env(f"{prefix}_DB_PORT", default="5432")
    name = env(f"{prefix}_DB_NAME")
    return f"postgresql+psycopg2://{user}:{pw}@{host}:{port}/{name}"


# ---------------------------------------------------------------
# Table -> concept columns to scan.
# ---------------------------------------------------------------
tables = {
    "person": [
        "ethnicity_concept_id",
        "gender_concept_id",
        "race_concept_id",
    ],
    "death": [
        "cause_concept_id",
        "death_type_concept_id",
    ],
    "condition_occurrence": [
        "condition_concept_id",
        "condition_status_concept_id",
        "condition_type_concept_id",
    ],
    "device_exposure": [
        "device_concept_id",
        "device_type_concept_id",
        "unit_concept_id",
    ],
    "drug_exposure": [
        "drug_concept_id",
        "drug_type_concept_id",
        "route_concept_id",
    ],
    "measurement": [
        "meas_event_field_concept_id",
        "measurement_concept_id",
        "measurement_type_concept_id",
        "operator_concept_id",
        "unit_concept_id",
        "value_as_concept_id",
    ],
    "observation": [
        "obs_event_field_concept_id",
        "observation_concept_id",
        "observation_type_concept_id",
        "qualifier_concept_id",
        "unit_concept_id",
        "value_as_concept_id",
    ],
    "procedure_occurrence": [
        "modifier_concept_id",
        "procedure_concept_id",
        "procedure_type_concept_id",
    ],
    "visit_detail": [
        "admitted_from_concept_id",
        "discharged_to_concept_id",
        "visit_detail_concept_id",
        "visit_detail_type_concept_id",
    ],
    "visit_occurrence": [
        "admitted_from_concept_id",
        "discharged_to_concept_id",
        "visit_concept_id",
        "visit_type_concept_id",
    ],
    "note": [
        "encoding_concept_id",
        "language_concept_id",
        "note_class_concept_id",
        "note_event_field_concept_id",
        "note_type_concept_id",
    ],
    "note_nlp": ["note_nlp_concept_id"],
}


# ---------------------------------------------------------------
# Drop + recreate the target table (composite PK matches the Sequelize model).
# ---------------------------------------------------------------
def create_concepts(app_engine, app_schema):
    sql = f"""
    CREATE SCHEMA IF NOT EXISTS {app_schema};
    DROP TABLE IF EXISTS {app_schema}.concepts;
    CREATE TABLE {app_schema}.concepts (
        concept_id       BIGINT,
        concept_name     TEXT,
        concept_class_id VARCHAR(20) NOT NULL,
        concept_code     VARCHAR(50) NOT NULL,
        vocabulary_id    VARCHAR(20) NOT NULL,
        table_name       TEXT,
        column_name      TEXT,
        count            BIGINT,
        PRIMARY KEY (concept_id, table_name, column_name)
    );
    """
    with app_engine.begin() as conn:
        conn.execute(text(sql))
    print(f"✔ Dropped + recreated {app_schema}.concepts")


# ---------------------------------------------------------------
# Concept-usage extraction: for each (table, column), count distinct subjects
# per concept in the OMOP schema and append the rows to app.concepts.
# ---------------------------------------------------------------
def populate(omop_engine, app_engine, omop_schema, vocab_schema, app_schema):
    total = 0
    for table, columns in tables.items():
        for col in columns:
            count_field = "note_id" if table == "note_nlp" else "person_id"
            sql = f"""
                SELECT
                    c.concept_id,
                    c.concept_name,
                    c.concept_class_id,
                    c.concept_code,
                    c.vocabulary_id,
                    '{table}' AS table_name,
                    '{col}'   AS column_name,
                    COUNT(DISTINCT t.{count_field}) AS count
                FROM {vocab_schema}.concept c
                LEFT JOIN {omop_schema}.{table} t
                    ON c.concept_id = t.{col}
                WHERE t.{col} IS NOT NULL
                GROUP BY c.concept_id, c.concept_name, c.concept_class_id,
                         c.concept_code, c.vocabulary_id
            """
            print(f"\n=== Running: {table}.{col} ===")
            df = pd.read_sql(sql, omop_engine)

            # Drop unmapped concepts.
            df = df[
                (df["concept_id"] != 0)
                & (df["concept_name"] != "No matching concept")
            ]

            for _, row in df.iterrows():
                print(
                    f"{row['concept_id']} | {row['concept_name']} | "
                    f"{table}.{col} | {row['count']}"
                )

            df.to_sql(
                "concepts",
                app_engine,
                schema=app_schema,
                if_exists="append",
                index=False,
            )
            total += len(df)

    print(f"\n✔ Populated {app_schema}.concepts: {total} rows.")


# ---------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------
if __name__ == "__main__":
    load_dotenv()  # reads server/.env when run from server/

    omop_engine = create_engine(url("OMOP"))
    app_engine = create_engine(url("APP"))
    omop_schema = env("OMOP_DB_SCHEMA", default="omopcdm")
    vocab_schema = env("VOCAB_DB_SCHEMA", default="vocabulary")
    app_schema = env("APP_DB_SCHEMA", default="app")

    create_concepts(app_engine, app_schema)
    print("Starting concept usage extraction...")
    populate(omop_engine, app_engine, omop_schema, vocab_schema, app_schema)
