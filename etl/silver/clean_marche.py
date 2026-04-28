import pandas as pd
import geopandas as gpd
from pathlib import Path


# =========================================
# PATHS
# =========================================

ROOT = Path(__file__).resolve().parents[2]

BRONZE = ROOT / "data" / "bronze"
SILVER = ROOT / "data" / "silver"

SILVER.mkdir(
    parents=True,
    exist_ok=True
)


# =========================================
# CLEAN MARCHE + SPATIAL JOIN
# =========================================

def clean_marche():

    print(
      "🔵 Chargement marchés..."
    )

    gdf = gpd.read_parquet(
        BRONZE/"marches_decouverts.parquet"
    )


    print(
      "🔵 Chargement référentiel rues..."
    )

    streets = gpd.read_parquet(
        BRONZE/"streets_base.parquet"
    )


    print(
      "Marchés:",
      gdf.shape
    )

    print(
      "Rues:",
      streets.shape
    )


    # ----------------------------------
    # garder colonnes utiles
    # ----------------------------------

    keep_cols=[
      "Identifiant marché",
      "Nom court",
      "Nom complet",
      "Produit",
      "Arrondissement",
      "Localisation",
      "Linéaire commercial",
      "LUNDI",
      "MARDI",
      "MERCREDI",
      "JEUDI",
      "VENDREDI",
      "SAMEDI",
      "DIMANCHE",
      "geometry"
    ]

    cols=[
      c for c in keep_cols
      if c in gdf.columns
    ]

    gdf=gdf[
       cols
    ].copy()


    gdf=gdf.rename(
      columns={
        "Identifiant marché":"market_id",
        "Nom court":"nom_court",
        "Nom complet":"nom_complet",
        "Produit":"produit",
        "Arrondissement":"arrondissement",
        "Localisation":"localisation",
        "Linéaire commercial":"lineaire",
        "LUNDI":"lundi",
        "MARDI":"mardi",
        "MERCREDI":"mercredi",
        "JEUDI":"jeudi",
        "VENDREDI":"vendredi",
        "SAMEDI":"samedi",
        "DIMANCHE":"dimanche"
      }
    )


    # ----------------------------------
    # conversions
    # ----------------------------------

    gdf["lineaire"]=pd.to_numeric(
      gdf["lineaire"],
      errors="coerce"
    ).fillna(0)


    jours=[
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
      "dimanche"
    ]

    for j in jours:
        gdf[j]=pd.to_numeric(
            gdf[j],
            errors="coerce"
        ).fillna(0)


    gdf["jours_ouverture"]=(
      gdf[jours].sum(
        axis=1
      )
    )


    # ===================================
    # SPATIAL JOIN -> STREET_ID
    # ===================================

    print(
      "🔵 Rattachement spatial aux rues..."
    )

    joined = gpd.sjoin_nearest(
        gdf,
        streets[
         [
          "street_id",
          "name",
          "arrondissement",
          "geometry"
         ]
        ],
        how="left",
        distance_col="distance_to_street"
  )
    joined = joined.drop_duplicates(
    subset=["market_id"]
	)

    joined.rename(
      columns={
        "name":"rue_reference"
      },
      inplace=True
    )
    
	


    joined["matched_street"]=1


    print(
      "✅ Match spatial:",
      len(joined)
    )


    # ----------------------------------
    # sortie finale
    # ----------------------------------

    final=joined[
      [
        "street_id",
        "market_id",
        "nom_court",
        "nom_complet",
        "produit",
        "arrondissement_left",
        "rue_reference",
        "lineaire",
        "jours_ouverture",
        "distance_to_street",
        "matched_street"
      ]
    ].copy()


    final.rename(
      columns={
       "arrondissement_left":
       "arrondissement"
      },
      inplace=True
    )


    output=SILVER/"marche_clean.parquet"

    final.to_parquet(
       output,
       index=False
    )


    print(
      f"✅ Silver généré : {output}"
    )

    print(
      "Shape finale:",
      final.shape
    )

    print(
      final.head(10)
    )


if __name__=="__main__":
    clean_marche()

# import pandas as pd
# import re


# def clean_marche():
# 	df = pd.read_parquet("data/bronze/marches_decouverts.parquet")

# 	print("AVANT:", df.shape)

# 	df = df[[
# 		"Nom court",
# 		"Nom complet",
# 		"Localisation",
# 		"Produit",
# 		"Arrondissement",
# 		"Linéaire commercial",
# 		"LUNDI",
# 		"MARDI",
# 		"MERCREDI",
# 		"JEUDI",
# 		"VENDREDI",
# 		"SAMEDI",
# 		"DIMANCHE"
# 	]]

# 	print("APRES SELECTION:", df.shape)

# 	df = df.rename(columns={
# 		"Nom court": "nom_court",
# 		"Nom complet": "nom_complet",
# 		"Localisation": "rue",
# 		"Produit": "produit",
# 		"Arrondissement": "arrondissement",
# 		"Linéaire commercial": "lineaire",
# 		"LUNDI": "lundi",
# 		"MARDI": "mardi",
# 		"MERCREDI": "mercredi",
# 		"JEUDI": "jeudi",
# 		"VENDREDI": "vendredi",
# 		"SAMEDI": "samedi",
# 		"DIMANCHE": "dimanche"
# 	})

# 	df["rue"] = (
# 		df["rue"]
# 		.astype(str)
# 		.str.lower()
# 		.str.strip()
# 		.str.replace(r"\s+", " ", regex=True)  # espaces multiples
# 		.str.replace(r"[^\w\s]", "", regex=True)  # enlever ponctuation
# 	)

# 	df = df[df["rue"] != ""]
# 	df = df[df["rue"] != "nan"]

# 	print("APRES RENAME:", df.shape)

# 	df["lineaire"] = pd.to_numeric(df["lineaire"], errors="coerce")
# 	df["arrondissement"] = pd.to_numeric(df["arrondissement"], errors="coerce")

# 	for col in ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]:
# 		df[col] = pd.to_numeric(df[col], errors="coerce")

# 	df["lineaire"] = df["lineaire"].fillna(0)
# 	df["arrondissement"] = df["arrondissement"].fillna(0)

# 	for col in ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]:
# 		df[col] = df[col].fillna(0)

# 	print("APRES CONVERSION:", df.shape)

# 	df["jours_ouverture"] = (
# 		df["lundi"]
# 		+ df["mardi"]
# 		+ df["mercredi"]
# 		+ df["jeudi"]
# 		+ df["vendredi"]
# 		+ df["samedi"]
# 		+ df["dimanche"]
# 	)

# 	print("APRES MAPPING:", df.shape)

# 	df.to_parquet("data/silver/marche_clean.parquet", index=False)


# if __name__ == "__main__":
# 	clean_marche()
