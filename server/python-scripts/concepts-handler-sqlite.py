"""
SQLite dev variant of concepts-handler.py — populates the app DB's `concepts`
table (data/db.sqlite3) from three separate local SQLite files instead of one
Postgres database with `app`/`omopcdm`/`vocabulary` schemas:

    OMOP_DB_STORAGE      data/omop.sqlite3   (read source: clinical occurrence tables)
    VOCAB_SQLITE_PATH     data/vocab.sqlite3  (read source: standard OMOP `concept` table)
    APP_DB_STORAGE       data/db.sqlite3     (write target: `concepts` table)

SQLite can't JOIN across separate database files in one query, so unlike the
Postgres script this loads the vocab `concept` table into memory once and
merges it in pandas against per-table/column usage counts pulled from OMOP.

Run ONCE before launching the server (it DROPs + recreates the table each run):

    cd server
    pip install -r python-scripts/requirements.txt      # once
    python python-scripts/concepts-handler-sqlite.py
    npm start

Paths come from the same server/.env the Node server uses (OMOP_DB_STORAGE,
APP_DB_STORAGE); VOCAB_SQLITE_PATH is python-tooling-only (Node's vocab
feature isn't a dedicated DB — it reads `concepts` off the app DB), so it
isn't part of server/.env's Node-facing config and defaults to
data/vocab.sqlite3 if unset.
"""

import os

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.dirname(SCRIPT_DIR)


def env(*names, default=None):
    for n in names:
        v = os.environ.get(n)
        if v:
            return v
    return default


def sqlite_url(relative_or_absolute_path):
    path = relative_or_absolute_path
    if not os.path.isabs(path):
        path = os.path.join(SERVER_DIR, path)
    return f"sqlite:///{path}"


# ---------------------------------------------------------------
# Table -> concept columns to scan. Same set as concepts-handler.py.
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
# Drop + recreate the target table (matches the Sequelize model in
# server/features/vocab/models/concept.js exactly, including its indexes).
# ---------------------------------------------------------------
def create_concepts(app_engine):
    with app_engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS concepts;"))
        conn.execute(
            text(
                """
                CREATE TABLE concepts (
                    concept_id       INTEGER,
                    concept_name     VARCHAR(255),
                    concept_class_id VARCHAR(20) NOT NULL,
                    concept_code     VARCHAR(50) NOT NULL,
                    vocabulary_id    VARCHAR(20) NOT NULL,
                    table_name       VARCHAR(255) NOT NULL,
                    column_name      VARCHAR(255) NOT NULL,
                    count            INTEGER,
                    PRIMARY KEY (concept_id, table_name, column_name)
                );
                """
            )
        )
        conn.execute(
            text(
                "CREATE INDEX concepts_table_name_column_name "
                "ON concepts (table_name, column_name);"
            )
        )
        conn.execute(
            text("CREATE INDEX concepts_concept_name ON concepts (concept_name);")
        )
        conn.execute(
            text(
                "CREATE INDEX concepts_vocabulary_id ON concepts (vocabulary_id);"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX concepts_concept_class_id "
                "ON concepts (concept_class_id);"
            )
        )
        conn.execute(
            text("CREATE INDEX concepts_concept_code ON concepts (concept_code);")
        )
    print("✔ Dropped + recreated concepts")


# ---------------------------------------------------------------
# Concept-usage extraction: for each (table, column), count distinct subjects
# per concept in omop.sqlite3, then merge against vocab.sqlite3's concept
# table in pandas (SQLite can't JOIN across separate database files) and
# append the rows to app db.sqlite3's concepts table.
# ---------------------------------------------------------------
def populate(omop_engine, vocab_df, app_engine):
    total = 0
    for table, columns in tables.items():
        for col in columns:
            count_field = "note_id" if table == "note_nlp" else "person_id"
            sql = f"""
                SELECT
                    {col} AS concept_id,
                    COUNT(DISTINCT {count_field}) AS count
                FROM {table}
                WHERE {col} IS NOT NULL
                GROUP BY {col}
            """
            print(f"\n=== Running: {table}.{col} ===")
            usage_df = pd.read_sql(sql, omop_engine)

            df = usage_df.merge(vocab_df, on="concept_id", how="inner")
            df["table_name"] = table
            df["column_name"] = col

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
                if_exists="append",
                index=False,
            )
            total += len(df)

    print(f"\n✔ Populated concepts: {total} rows.")


# ---------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------
if __name__ == "__main__":
    load_dotenv()  # reads server/.env when run from server/

    omop_engine = create_engine(sqlite_url(env("OMOP_DB_STORAGE", default="data/omop.sqlite3")))
    vocab_engine = create_engine(sqlite_url(env("VOCAB_SQLITE_PATH", default="data/vocab.sqlite3")))
    app_engine = create_engine(sqlite_url(env("APP_DB_STORAGE", default="data/db.sqlite3")))

    print("Loading vocab concept table...")
    vocab_df = pd.read_sql(
        "SELECT concept_id, concept_name, concept_class_id, concept_code, "
        "vocabulary_id FROM concept",
        vocab_engine,
    )
    print(f"✔ Loaded {len(vocab_df)} concepts from vocab.sqlite3")

    create_concepts(app_engine)
    print("Starting concept usage extraction...")
    populate(omop_engine, vocab_df, app_engine)
