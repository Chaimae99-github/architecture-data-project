import pandas as pd
from pathlib import Path
import sys
# Ajoute la racine du projet au path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from etl.utils.normalization import min_max_scaling


ROOT = Path(__file__).resolve().parents[2]

SILVER = ROOT/"data"/"silver"
GOLD = ROOT/"data"/"gold"

GOLD.mkdir(
    parents=True,
    exist_ok=True
)


def compute_kpi_marche():

    print(
      "🔵 Chargement silver marchés..."
    )

    df=pd.read_parquet(
      SILVER/"marche_clean.parquet"
    )

    print(
      "Shape:",
      df.shape
    )


    # ------------------------------
    # sécurité
    # ------------------------------

    df=df.dropna(
      subset=["street_id"]
    )


    df["lineaire"]=pd.to_numeric(
      df["lineaire"],
      errors="coerce"
    ).fillna(0)


    df["jours_ouverture"]=pd.to_numeric(
      df["jours_ouverture"],
      errors="coerce"
    ).fillna(0)


    df["distance_to_street"]=pd.to_numeric(
      df["distance_to_street"],
      errors="coerce"
    ).fillna(0)



    # --------------------------------
    # agrégation par rue
    # --------------------------------

    grouped=(
      df.groupby(
        "street_id"
      )
      .agg(
       {
         "lineaire":"sum",
         "jours_ouverture":"mean",
         "distance_to_street":"mean",
         "market_id":"count"
       }
      )
      .rename(
        columns={
         "market_id":
         "market_count"
        }
      )
      .reset_index()
    )


    print(
      "Rues avec marchés:",
      grouped.shape[0]
    )


    # --------------------------------
    # sous scores
    # --------------------------------

    grouped["score_offre"]=(
         grouped["lineaire"]
       + grouped["market_count"]*50
    )


    grouped["score_frequence"]=(
       grouped["jours_ouverture"]
    )


    grouped["score_proximite"]=(
       1/(1+grouped[
           "distance_to_street"
       ])
    )


    # --------------------------------
    # score global
    # --------------------------------

    grouped["score"]=(
         0.5*grouped["score_offre"]
       + 0.3*grouped["score_frequence"]
       + 0.2*grouped["score_proximite"]
    )


    grouped["score"]=min_max_scaling(
       grouped["score"]
    )

    grouped["category"]="marche"


    # sortie gold
    final=grouped[
      [
        "street_id",
        "market_count",
        "lineaire",
        "jours_ouverture",
        "score",
        "category"
      ]
    ]


    output=(
      GOLD/
      "kpi_marche.parquet"
    )

    final.to_parquet(
      output,
      index=False
    )


    print(
      f"✅ Gold généré : {output}"
    )

    print(
      final.head(10)
    )


if __name__=="__main__":
    compute_kpi_marche()