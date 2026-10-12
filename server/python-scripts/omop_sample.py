"""
Sample the source OMOP Postgres database top-down, starting from cohorts, and
write two self-contained local SQLite files:

    data/omop.sqlite3  — the first N cohort_definitions, the first M subjects of
                    each, and every OMOP CDM row for those subjects (visits,
                    conditions, drugs, measurements, notes, …)
    data/vocab.sqlite3 — the subset of vocabulary.concept rows referenced by any
                    *_concept_id column in the sampled data

Sampling order:
    1. cohort_definition — first --definitions rows (by cohort_definition_id)
    2. cohort            — first --per-definition subjects of each of those
                            definitions (by subject_id)
    3. person_ids         = the distinct subject_id values from step 2
                            (cohort.subject_id is assumed to BE person_id)
    4. every other OMOP CDM table is then filtered down to those person_ids

Useful as lightweight local dev/test fixtures — point OMOP_DB_STORAGE /
APP_DB_STORAGE at these files instead of running against the full source.

Connection creds come from the same OMOP_DB_* env vars as concepts-handler.py
(server/.env) — one Postgres connection, `omop_schema`/`vocab_schema` are just
schema names within it, so no separate vocab credentials are needed. Postgres
source only.

Run:
    cd server
    pip install -r python-scripts/requirements.txt      # once
    python python-scripts/omop_sample.py [--definitions 10] [--per-definition 10]
                                          [--omop-out data/omop.sqlite3]
                                          [--vocab-out data/vocab.sqlite3]
"""

import argparse
import os

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import bindparam, create_engine, text


# ---------------------------------------------------------------
# Env-driven connection (same helpers as concepts-handler.py).
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
# Person-scoped OMOP CDM tables -> filtered by person_id once the sample's
# person_ids are known. cohort/cohort_definition are pulled FIRST (they're
# what determines the person_ids); note_nlp (keyed by note_id via note) is
# handled after `note` is fetched.
# ---------------------------------------------------------------
PERSON_TABLES = [
    "person",
    "death",
    "observation_period",
    "visit_occurrence",
    "visit_detail",
    "condition_occurrence",
    "drug_exposure",
    "device_exposure",
    "procedure_occurrence",
    "measurement",
    "observation",
    "note",
]

# Every *_concept_id column per table (used to work out which vocabulary
# concepts the sample actually references).
CONCEPT_COLUMNS = {
    "person": [
        "gender_concept_id", "race_concept_id", "ethnicity_concept_id",
        "gender_source_concept_id", "race_source_concept_id", "ethnicity_source_concept_id",
    ],
    "death": ["death_type_concept_id", "cause_concept_id", "cause_source_concept_id"],
    "observation_period": ["period_type_concept_id"],
    "visit_occurrence": [
        "visit_concept_id", "visit_type_concept_id", "visit_source_concept_id",
        "admitted_from_concept_id", "discharged_to_concept_id",
    ],
    "visit_detail": [
        "visit_detail_concept_id", "visit_detail_type_concept_id", "visit_detail_source_concept_id",
        "admitted_from_concept_id", "discharged_to_concept_id",
    ],
    "condition_occurrence": [
        "condition_concept_id", "condition_type_concept_id",
        "condition_status_concept_id", "condition_source_concept_id",
    ],
    "drug_exposure": ["drug_concept_id", "drug_type_concept_id", "route_concept_id", "drug_source_concept_id"],
    "device_exposure": [
        "device_concept_id", "device_type_concept_id", "unit_concept_id", "device_source_concept_id",
    ],
    "procedure_occurrence": [
        "procedure_concept_id", "procedure_type_concept_id", "modifier_concept_id", "procedure_source_concept_id",
    ],
    "measurement": [
        "measurement_concept_id", "measurement_type_concept_id", "operator_concept_id", "value_as_concept_id",
        "unit_concept_id", "measurement_source_concept_id", "unit_source_concept_id", "meas_event_field_concept_id",
    ],
    "observation": [
        "observation_concept_id", "observation_type_concept_id", "value_as_concept_id", "qualifier_concept_id",
        "unit_concept_id", "observation_source_concept_id", "obs_event_field_concept_id",
    ],
    "note": [
        "note_type_concept_id", "note_class_concept_id", "encoding_concept_id",
        "language_concept_id", "note_event_field_concept_id",
    ],
    "note_nlp": ["section_concept_id", "note_nlp_concept_id", "note_nlp_source_concept_id"],
    "cohort_definition": ["definition_type_concept_id", "subject_concept_id"],
}


def fetch_where_in(engine, schema, table, column, values):
    """SELECT * FROM schema.table WHERE column IN :values (empty values -> empty frame)."""
    if not values:
        return pd.DataFrame()
    stmt = text(f"SELECT * FROM {schema}.{table} WHERE {column} IN :values") \
        .bindparams(bindparam("values", expanding=True))
    return pd.read_sql(stmt, engine, params={"values": list(values)})


def collect_concept_ids(frames):
    """Every non-null, non-zero *_concept_id value referenced across all sampled frames."""
    ids = set()
    for table, df in frames.items():
        if df.empty:
            continue
        for col in CONCEPT_COLUMNS.get(table, []):
            if col in df.columns:
                ids.update(int(v) for v in df[col].dropna().unique() if int(v) != 0)
    return ids


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--definitions", type=int, default=10, help="Number of cohort_definitions to sample (first N by cohort_definition_id)")
    parser.add_argument("--per-definition", type=int, default=10, help="Number of cohort subjects to take per definition (first M by subject_id)")
    parser.add_argument("--omop-out", default="data/omop.sqlite3", help="Output path for the sampled OMOP SQLite file")
    parser.add_argument("--vocab-out", default="data/vocab.sqlite3", help="Output path for the sampled vocabulary SQLite file")
    args = parser.parse_args()

    load_dotenv()  # reads server/.env when run from server/

    omop_engine = create_engine(url("OMOP"))
    omop_schema = env("OMOP_DB_SCHEMA", default="omopcdm")
    vocab_schema = env("VOCAB_DB_SCHEMA", default="vocabulary")

    os.makedirs(os.path.dirname(args.omop_out) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(args.vocab_out) or ".", exist_ok=True)
    omop_out_engine = create_engine(f"sqlite:///{args.omop_out}")
    vocab_out_engine = create_engine(f"sqlite:///{args.vocab_out}")

    frames = {}

    # ---- 1. cohort_definition: first N ----
    # The PK column varies by deployment: standard OMOP CDM uses
    # `cohort_definition_id`; ATLAS-style cohort catalogs use `id`. Detect
    # whichever is actually present rather than assuming one.
    with omop_engine.connect() as conn:
        cd_id_col = conn.execute(
            text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = :schema AND table_name = 'cohort_definition'
                  AND column_name IN ('cohort_definition_id', 'id')
                ORDER BY CASE column_name WHEN 'cohort_definition_id' THEN 0 ELSE 1 END
                LIMIT 1
            """),
            {"schema": omop_schema},
        ).scalar()
    if not cd_id_col:
        raise SystemExit(
            f"Could not find an id column (cohort_definition_id or id) on {omop_schema}.cohort_definition"
        )

    frames["cohort_definition"] = pd.read_sql(
        text(f"SELECT * FROM {omop_schema}.cohort_definition ORDER BY {cd_id_col} LIMIT :n"),
        omop_engine,
        params={"n": args.definitions},
    )
    def_ids = frames["cohort_definition"][cd_id_col].tolist()
    print(f"cohort_definition: {len(def_ids)} rows (id column: {cd_id_col})")
    if not def_ids:
        print("No cohort definitions found — nothing to write.")
        return

    # ---- 2. cohort: first M subjects per definition ----
    cohort_stmt = text(f"""
        SELECT cohort_definition_id, subject_id, cohort_start_date, cohort_end_date
        FROM (
            SELECT cohort_definition_id, subject_id, cohort_start_date, cohort_end_date,
                   ROW_NUMBER() OVER (PARTITION BY cohort_definition_id ORDER BY subject_id) AS rn
            FROM {omop_schema}.cohort
            WHERE cohort_definition_id IN :def_ids
        ) ranked
        WHERE rn <= :per_def
    """).bindparams(bindparam("def_ids", expanding=True))
    frames["cohort"] = pd.read_sql(
        cohort_stmt, omop_engine, params={"def_ids": def_ids, "per_def": args.per_definition}
    )
    print(f"cohort: {len(frames['cohort'])} rows")

    # ---- 3. person_ids = the subjects from step 2 ----
    person_ids = frames["cohort"]["subject_id"].dropna().unique().tolist()
    print(f"Derived {len(person_ids)} distinct persons from sampled cohorts.")
    if not person_ids:
        print("No cohort subjects found — nothing to write.")
        return

    # ---- 4. Pull every person-scoped table, filtered to those persons ----
    for table in PERSON_TABLES:
        df = fetch_where_in(omop_engine, omop_schema, table, "person_id", person_ids)
        frames[table] = df
        print(f"{table}: {len(df)} rows")

    # note_nlp is keyed by note_id, not person_id.
    note_ids = frames["note"]["note_id"].tolist() if not frames["note"].empty else []
    frames["note_nlp"] = fetch_where_in(omop_engine, omop_schema, "note_nlp", "note_id", note_ids)
    print(f"note_nlp: {len(frames['note_nlp'])} rows")

    # ---- Write omop.sqlite3 ----
    for table, df in frames.items():
        if df.empty:
            continue
        df.to_sql(table, omop_out_engine, if_exists="replace", index=False)
    print(f"\n✔ Wrote {args.omop_out}")

    # ---- Pull + write the referenced vocabulary concepts ----
    concept_ids = collect_concept_ids(frames)
    print(f"\nReferenced {len(concept_ids)} distinct concepts.")
    concept_df = fetch_where_in(omop_engine, vocab_schema, "concept", "concept_id", concept_ids)
    if not concept_df.empty:
        concept_df.to_sql("concept", vocab_out_engine, if_exists="replace", index=False)
    print(f"✔ Wrote {args.vocab_out} ({len(concept_df)} concepts)")


if __name__ == "__main__":
    main()
