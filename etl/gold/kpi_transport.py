# `kpi_transport.py` (version complète ajustée)

"""
GOLD LAYER — KPI Accessibilité Transport

Entrée :
  data/silver/transport_clean.parquet

Sorties :
  data/gold/kpi_transport.parquet
  data/gold/kpi_transport_accessibilite.geojson
  data/gold/kpi_transport_accessibilite.json
  data/gold/kpi_transport_summary.json
"""

import os
import json
import math
import logging
from datetime import datetime
from typing import Any

import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [GOLD] %(levelname)s — %(message)s"
)

logger=logging.getLogger(__name__)

BASE_DIR=os.path.dirname(__file__)

SILVER_DIR=os.path.abspath(
   os.path.join(
      BASE_DIR,
      "../../data/silver"
   )
)

GOLD_DIR=os.path.abspath(
   os.path.join(
      BASE_DIR,
      "../../data/gold"
   )
)

os.makedirs(
   GOLD_DIR,
   exist_ok=True
)


# -------------------------------------
# Utils
# -------------------------------------

def safe_float(
   value:Any,
   default=0.0
):
    try:
        if value is None:
            return default
        return float(value)
    except:
        return default


def classify(score):

    if score>=80:
        return "Très élevée"

    elif score>=60:
        return "Élevée"

    elif score>=40:
        return "Moyenne"

    elif score>=20:
        return "Faible"

    return "Très faible"


def percentile(values,p):

    if not values:
        return 0

    vals=sorted(values)
    n=len(vals)

    if n==1:
        return vals[0]

    pos=(p/100)*(n-1)

    lower=int(math.floor(pos))
    upper=int(math.ceil(pos))

    if lower==upper:
        return vals[lower]

    weight=pos-lower

    return round(
       vals[lower]*(1-weight)+
       vals[upper]*weight,
       2
    )


# -------------------------------------
# KPI
# -------------------------------------

def compute_kpi(features):

    logger.info(
      f"Calcul KPI sur {len(features)} voies"
    )

    for feat in features:

        p=feat["properties"]

        score_brut=safe_float(
          p.get(
             "score_brut",
             0
          )
        )

        length_km=safe_float(
           p.get(
             "length_km",
             0
           )
        )

        if length_km>0:
            densite=(
               score_brut/
               math.sqrt(
                  length_km
               )
            )
        else:
            densite=0

        p[
          "densite_accessibilite"
        ]=round(
           densite,
           4
        )

    densites=[
      f["properties"][
         "densite_accessibilite"
      ]
      for f in features
    ]

    dmin=min(densites)
    dmax=max(densites)

    drange=dmax-dmin

    for feat in features:

        p=feat[
          "properties"
        ]

        densite=p[
          "densite_accessibilite"
        ]

        if drange>0:
            score=(
              (
               densite-dmin
              )/drange
            )*100
        else:
            score=100 if densite>0 else 0

        p[
          "score_final"
        ]=round(
            score,
            2
        )

        p[
         "classe_accessibilite"
        ]=classify(
           score
        )

    return features


# -------------------------------------
# Stats
# -------------------------------------

def build_stats(features):

    scores=[
       f["properties"][
         "score_final"
       ]
       for f in features
    ]

    classes=[
      f["properties"][
       "classe_accessibilite"
      ]
      for f in features
    ]

    dist={}

    for c in classes:
        dist[c]=dist.get(
           c,
           0
        )+1

    return {
      "total_voies":len(features),
      "score_min":round(
         min(scores),2
      ),
      "score_max":round(
         max(scores),2
      ),
      "score_mean":round(
         sum(scores)/len(scores),
         2
      ),
      "score_median":percentile(
         scores,
         50
      ),
      "p25":percentile(
         scores,
         25
      ),
      "p75":percentile(
         scores,
         75
      ),
      "distribution_classes":dist,
      "computed_at":(
        datetime.utcnow(
        ).isoformat()+"Z"
      )
    }


# -------------------------------------
# Save
# -------------------------------------

def save_outputs(
    features,
    stats
):

    # ---------- GeoJSON ----------

    geojson={
      "type":"FeatureCollection",
      "_meta":stats,
      "features":features
    }

    geo_path=os.path.join(
      GOLD_DIR,
      "kpi_transport_accessibilite.geojson"
    )

    with open(
      geo_path,
      "w",
      encoding="utf-8"
    ) as f:

       json.dump(
         geojson,
         f,
         ensure_ascii=False
       )


    # ---------- JSON lite ----------

    lite=[]

    for feat in features:

        p=feat[
          "properties"
        ]

        lite.append({
           "voie_id":p[
             "voie_id"
           ],
           "nom":p[
             "nom"
           ],
           "score_final":p[
             "score_final"
           ],
           "classe_accessibilite":p[
             "classe_accessibilite"
           ]
        })

    with open(
      os.path.join(
        GOLD_DIR,
        "kpi_transport_accessibilite.json"
      ),
      "w",
      encoding="utf-8"
    ) as f:

       json.dump(
         {
           "_meta":stats,
           "records":lite
         },
         f,
         indent=2,
         ensure_ascii=False
       )


    # ---------- Summary ----------

    with open(
      os.path.join(
        GOLD_DIR,
        "kpi_transport_summary.json"
      ),
      "w",
      encoding="utf-8"
    ) as f:

       json.dump(
          stats,
          f,
          indent=2,
          ensure_ascii=False
       )


    # ---------- Gold parquet ----------

    rows=[]

    for feat in features:

        p=feat[
          "properties"
        ]

        rows.append({
           "voie_id":p[
             "voie_id"
           ],
           "nom":p[
             "nom"
           ],
           "length_km":p[
             "length_km"
           ],
           "station_count":p[
             "station_count"
           ],
           "score_brut":p[
             "score_brut"
           ],
           "densite_accessibilite":p[
             "densite_accessibilite"
           ],
           "score_final":p[
             "score_final"
           ],
           "classe_accessibilite":p[
             "classe_accessibilite"
           ]
        })

    pd.DataFrame(
      rows
    ).to_parquet(
      os.path.join(
         GOLD_DIR,
         "kpi_transport.parquet"
      ),
      index=False
    )

    logger.info(
      "✓ Sorties gold créées"
    )


# -------------------------------------
# Main
# -------------------------------------

def run():

    silver_path=os.path.join(
      SILVER_DIR,
      "transport_clean.parquet"
    )

    logger.info(
      f"Lecture {silver_path}"
    )

    if not os.path.exists(
       silver_path
    ):
        raise FileNotFoundError(
          silver_path
        )

    df=pd.read_parquet(
       silver_path
    )

    features=[]

    for _,row in df.iterrows():

        features.append({
           "type":"Feature",
           "geometry":None,
           "properties":{
              "voie_id":row[
                 "voie_id"
              ],
              "nom":row[
                 "nom"
              ],
              "length_km":row[
                 "length_km"
              ],
              "station_count":row[
                 "station_count"
              ],
              "score_brut":row[
                 "score_brut"
              ]
           }
        })

    features=compute_kpi(
      features
    )

    stats=build_stats(
      features
    )

    save_outputs(
      features,
      stats
    )

    logger.info(
      "Gold processing terminé"
    )


if __name__=="__main__":
    run()
