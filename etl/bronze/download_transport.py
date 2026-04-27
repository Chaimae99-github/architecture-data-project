import requests
import json
import os
import logging
from datetime import datetime
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [BRONZE] %(levelname)s — %(message)s"
)
logger = logging.getLogger(__name__)

# --------------------------------------------------
# Dossier bronze
# --------------------------------------------------

BRONZE_DIR = os.path.join(
    os.path.dirname(__file__),
    "../../data/bronze"
)

os.makedirs(BRONZE_DIR, exist_ok=True)


# --------------------------------------------------
# Sources Open Data
# --------------------------------------------------

VOIES_URL = (
    "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/voie/exports/geojson"
    "?limit=-1&timezone=Europe%2FParis"
)

GARES_URL = (
    "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/"
    "emplacement-des-gares-idf-data-generalisee/exports/geojson"
    "?limit=-1&timezone=Europe%2FParis"
)


# --------------------------------------------------
# Download + save raw json
# --------------------------------------------------

def fetch_and_save(url, output_path, label):

    logger.info(f"Téléchargement {label}...")

    try:
        response = requests.get(url, timeout=120)
        response.raise_for_status()

        data = response.json()

    except requests.exceptions.Timeout:
        logger.error(f"Timeout sur {label}")
        raise

    except requests.exceptions.HTTPError as e:
        logger.error(
            f"Erreur HTTP {e.response.status_code}"
        )
        raise

    except json.JSONDecodeError:
        logger.error("Réponse non JSON")
        raise

    record = {
        "_meta": {
            "source_url": url,
            "label": label,
            "ingested_at":
                datetime.utcnow().isoformat()+"Z",
            "feature_count":
                len(data.get("features",[]))
        },
        "data": data
    }

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            record,
            f,
            ensure_ascii=False
        )

    logger.info(
      f"✓ {label} sauvegardé "
      f"({record['_meta']['feature_count']} features)"
    )

    # on renvoie les données pour construire le parquet
    return data


# --------------------------------------------------
# Main
# --------------------------------------------------

def run():

    # ---------- RAW JSON en bronze ----------

    voies_data = fetch_and_save(
        VOIES_URL,
        os.path.join(
            BRONZE_DIR,
            "voies_paris_raw.json"
        ),
        "Voies de Paris"
    )


    gares_data = fetch_and_save(
        GARES_URL,
        os.path.join(
            BRONZE_DIR,
            "gares_idf_raw.json"
        ),
        "Gares IDF"
    )


    # ---------- log ingestion ----------

    log_path = os.path.join(
        BRONZE_DIR,
        "ingestion_log.json"
    )

    logs=[]

    if os.path.exists(log_path):
        try:
            with open(
                log_path,
                encoding="utf-8"
            ) as f:
                logs=json.load(f)

        except:
            logs=[]


    logs.append({
        "run_at":
            datetime.utcnow().isoformat()+"Z",
        "voies_features":
            len(
                voies_data.get(
                   "features",
                   []
                )
            ),
        "gares_features":
            len(
                gares_data.get(
                   "features",
                   []
                )
            )
    })


    with open(
        log_path,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            logs,
            f,
            indent=2,
            ensure_ascii=False
        )

    logger.info(
       "Log ingestion mis à jour"
    )


    # ---------- BRONZE PARQUET ----------

    cols_drop = [
        "geometry",
        "geometry.coordinates",
        "geometry.type"
    ]


    voies_df = pd.json_normalize(
        voies_data["features"]
    ).drop(
        columns=cols_drop,
        errors="ignore"
    )


    gares_df = pd.json_normalize(
        gares_data["features"]
    ).drop(
        columns=cols_drop,
        errors="ignore"
    )


    voies_df["source"]="voie"
    gares_df["source"]="gare"


    transport_df = pd.concat(
        [voies_df, gares_df],
        ignore_index=True
    )


    transport_df.to_parquet(
        os.path.join(
            BRONZE_DIR,
            "transport.parquet"
        ),
        index=False
    )


    logger.info(
       "✓ transport.parquet créé"
    )

    logger.info(
       "Bronze ingestion terminée."
    )


if __name__=="__main__":
    run()