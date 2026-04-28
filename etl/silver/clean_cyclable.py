import pandas as pd
import unicodedata
from pathlib import Path
 
# ─────────────────────────────────────────────
# 1. CHEMINS
# ─────────────────────────────────────────────
 
ROOT = Path(__file__).resolve().parents[2]
 
BRONZE_DIR = ROOT / "data" / "bronze"
SILVER_DIR = ROOT / "data" / "silver"
 
CYCLABLE_FILE = BRONZE_DIR / "cyclable.parquet"
STREETS_FILE = BRONZE_DIR / "streets_base.parquet"
OUTPUT_FILE = SILVER_DIR / "cyclable_clean.parquet"
 
 
# ─────────────────────────────────────────────
# 2. NORMALISATION DES NOMS DE RUE
# ─────────────────────────────────────────────
 
def normalize_street_name(text):
    """
    Normalise un nom de rue :
    - minuscule
    - suppression accents
    - suppression ponctuation
    - suppression espaces multiples
    """
    if pd.isna(text):
        return ""
 
    text = str(text).strip().lower()
 
    # enlever accents
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
 
    # enlever ponctuation simple
    text = "".join(c if c.isalnum() or c.isspace() else " " for c in text)
 
    # espaces multiples
    text = " ".join(text.split())
 
    return text
 
 
# ─────────────────────────────────────────────
# 3. CHARGEMENT DES DONNÉES
# ─────────────────────────────────────────────
 
def load_data():
    print("🔵 Chargement du Bronze cyclable...")
    if not CYCLABLE_FILE.exists():
        raise FileNotFoundError(f"Fichier introuvable : {CYCLABLE_FILE}")
 
    print("🔵 Chargement du référentiel rues...")
    if not STREETS_FILE.exists():
        raise FileNotFoundError(f"Fichier introuvable : {STREETS_FILE}")
 
    df_cyclable = pd.read_parquet(CYCLABLE_FILE)
    df_streets = pd.read_parquet(STREETS_FILE)
 
    print(f"✅ Cyclable chargé : {df_cyclable.shape}")
    print(f"✅ Streets chargé : {df_streets.shape}")
 
    return df_cyclable, df_streets
 
 
# ─────────────────────────────────────────────
# 4. NETTOYAGE CYCLABLE
# ─────────────────────────────────────────────
 
def clean_cyclable_raw(df):
    print("🔵 Nettoyage des colonnes cyclables...")
 
    df = df[[
        "Nom",
        "Longueur",
        "Vitesse maximale autorisée",
        "Infrastructure bidirectionnelle",
        "Aménagement temporaire"
    ]].copy()
 
    df = df.rename(columns={
        "Nom": "rue",
        "Longueur": "longueur",
        "Vitesse maximale autorisée": "vitesse",
        "Infrastructure bidirectionnelle": "bidirectionnel",
        "Aménagement temporaire": "temporaire"
    })
 
    # normalisation nom de rue
    df["rue_norm"] = df["rue"].apply(normalize_street_name)
 
    # filtrer valeurs vides
    df = df[df["rue_norm"] != ""].copy()
 
    # conversions
    df["longueur"] = pd.to_numeric(df["longueur"], errors="coerce").fillna(0)
    df["vitesse"] = pd.to_numeric(df["vitesse"], errors="coerce").fillna(30)
 
    # mapping oui/non
    df["bidirectionnel"] = (
        df["bidirectionnel"]
        .astype(str)
        .str.lower()
        .map({"oui": 1, "non": 0})
        .fillna(0)
        .astype(int)
    )
 
    df["temporaire"] = (
        df["temporaire"]
        .astype(str)
        .str.lower()
        .map({"oui": 1, "non": 0})
        .fillna(0)
        .astype(int)
    )
 
    print(f"✅ Cyclable nettoyé : {df.shape}")
    return df
 
 
# ─────────────────────────────────────────────
# 5. PRÉPARATION DU RÉFÉRENTIEL RUES
# ─────────────────────────────────────────────
 
def prepare_streets_reference(streets):
    print("🔵 Préparation du référentiel rues...")
 
    required_cols = ["street_id", "name", "arrondissement"]
    for col in required_cols:
        if col not in streets.columns:
            raise ValueError(f"Colonne manquante dans streets_base.parquet : {col}")
 
    streets = streets[["street_id", "name", "arrondissement"]].copy()
    streets["rue_norm"] = streets["name"].apply(normalize_street_name)
 
    streets = streets[streets["rue_norm"] != ""].copy()
 
    # Vérification noms ambigus
    duplicates = streets.groupby("rue_norm")["street_id"].nunique().reset_index()
    ambiguous = duplicates[duplicates["street_id"] > 1]
 
    print(f"✅ Référentiel rues préparé : {streets.shape}")
    print(f"⚠️ Noms ambigus dans streets : {len(ambiguous)}")
 
    # version simple : on garde le premier street_id par nom normalisé
    streets_unique = streets.drop_duplicates(subset=["rue_norm"]).copy()
 
    return streets_unique, ambiguous
 
 
# ─────────────────────────────────────────────
# 6. JOINTURE CYCLABLE ↔ STREETS
# ─────────────────────────────────────────────
 
def match_with_streets(df_cyclable, streets_unique):
    print("🔵 Jointure avec le référentiel rues...")
 
    df = df_cyclable.merge(
        streets_unique[["street_id", "name", "arrondissement", "rue_norm"]],
        on="rue_norm",
        how="left"
    )
 
    df = df.rename(columns={
        "name": "rue_reference"
    })
 
    df["matched_street"] = df["street_id"].notna().astype(int)
 
    matched_count = int(df["matched_street"].sum())
    total_count = len(df)
    match_rate = round((matched_count / total_count) * 100, 2) if total_count > 0 else 0
 
    print(f"✅ Match rues : {matched_count}/{total_count} ({match_rate}%)")
 
    return df
 
 
# ─────────────────────────────────────────────
# 7. CONTRÔLE QUALITÉ
# ─────────────────────────────────────────────
 
def quality_check(df, ambiguous):
    print("\n📊 CONTRÔLE QUALITÉ MATCHING")
    print("-" * 50)
 
    unmatched = df[df["street_id"].isna()][["rue", "rue_norm"]].drop_duplicates()
 
    print(f"Nombre de rues non matchées : {len(unmatched)}")
    print(f"Nombre de noms ambigus dans le référentiel : {len(ambiguous)}")
 
    if len(unmatched) > 0:
        print("\n🔎 Exemples de rues non matchées :")
        print(unmatched.head(20).to_string(index=False))
 
    if len(ambiguous) > 0:
        print("\n⚠️ Exemples de noms ambigus dans streets :")
        print(ambiguous.head(20).to_string(index=False))
 
 
# ─────────────────────────────────────────────
# 8. SAUVEGARDE SILVER
# ─────────────────────────────────────────────
 
def save_silver(df):
    SILVER_DIR.mkdir(parents=True, exist_ok=True)
 
    df_final = df[[
        "street_id",
        "rue",
        "rue_reference",
        "rue_norm",
        "arrondissement",
        "longueur",
        "vitesse",
        "bidirectionnel",
        "temporaire",
        "matched_street"
    ]].copy()
 
    df_final.to_parquet(OUTPUT_FILE, index=False)
 
    print(f"\n✅ Fichier Silver généré : {OUTPUT_FILE}")
    print(f"✅ Shape finale : {df_final.shape}")
    print(df_final.head(10).to_string())
 
 
# ─────────────────────────────────────────────
# 9. MAIN
# ─────────────────────────────────────────────
 
def clean_cyclable():
    df_cyclable, df_streets = load_data()
 
    df_cyclable = clean_cyclable_raw(df_cyclable)
    streets_unique, ambiguous = prepare_streets_reference(df_streets)
 
    df_matched = match_with_streets(df_cyclable, streets_unique)
 
    quality_check(df_matched, ambiguous)
    save_silver(df_matched)
 
 
if __name__ == "__main__":
    clean_cyclable()


# import pandas as pd
# import re

# def clean_cyclable():
#     df = pd.read_parquet("data/bronze/cyclable.parquet")

#     print("AVANT:", df.shape)

#     df = df[[
#         "Nom",
#         "Longueur",
#         "Vitesse maximale autorisée",
#         "Infrastructure bidirectionnelle",
#         "Aménagement temporaire"
#     ]]

#     print("APRES SELECTION:", df.shape)

#     df = df.rename(columns={
#         "Nom": "rue",
#         "Longueur": "longueur",
#         "Vitesse maximale autorisée": "vitesse",
#         "Infrastructure bidirectionnelle": "bidirectionnel",
#         "Aménagement temporaire": "temporaire"
#     })

#     # df["rue"] = df["rue"].astype(str).str.strip().str.lower()


   

#     df["rue"] = (
#         df["rue"]
#         .astype(str)
#         .str.lower()
#         .str.strip()
#         .str.replace(r"\s+", " ", regex=True)  # espaces multiples
#         .str.replace(r"[^\w\s]", "", regex=True)  # enlever ponctuation
#     )

    
#     df = df[df["rue"] != ""]
#     df = df[df["rue"] != "nan"]
#     # df["rue"] = df["rue"].str.normalize('NFKD').str.encode('ascii', errors='ignore').str.decode('utf-8')
#     print("APRES RENAME:", df.shape)

#     # conversion
#     df["longueur"] = pd.to_numeric(df["longueur"], errors="coerce")
#     df["vitesse"] = pd.to_numeric(df["vitesse"], errors="coerce")


#     # 👉 AJOUTE ICI
#     df["longueur"] = df["longueur"].fillna(0)
#     # df["vitesse"] = df["vitesse"].fillna(df["vitesse"].median())
#     df["vitesse"] = df["vitesse"].fillna(30)


  

#     print("APRES CONVERSION:", df.shape)

#     # mapping
#     df["bidirectionnel"] = df["bidirectionnel"].astype(str).str.lower().map({'oui': 1, 'non': 0})
#     df["temporaire"] = df["temporaire"].astype(str).str.lower().map({'oui': 1, 'non': 0})

#     print("APRES MAPPING:", df.shape)

#     df.to_parquet("data/silver/cyclable_clean.parquet", index=False)

# if __name__ == "__main__":
#     clean_cyclable()




# # import pandas as pd

# # def clean_cyclable():
# #     df = pd.read_parquet("data/bronze/cyclable.parquet")


# #     # garder colonnes utiles
# #     df = df[[
# #         "Nom",
# #         "Longueur",
# #         "Vitesse maximale autorisée",
# #         "Infrastructure bidirectionnelle",
# #         "Aménagement temporaire"
# #     ]]

# #     # rename propre
# #     df = df.rename(columns={
# #         "Nom": "rue",
# #         "Longueur": "longueur",
# #         "Vitesse maximale autorisée": "vitesse",
# #         "Infrastructure bidirectionnelle": "bidirectionnel",
# #         "Aménagement temporaire": "temporaire"
# #     })

# #     # nettoyer
# #     #df = df.dropna()
# #     df = df.dropna(subset=["rue", "longueur", "vitesse", "bidirectionnel", "temporaire"])

# #     # convertir en numérique si besoin
# #     df["longueur"] = pd.to_numeric(df["longueur"], errors="coerce")
# #     df["vitesse"] = pd.to_numeric(df["vitesse"], errors="coerce")

# #      # mapper les valeurs oui/non en 0/1 avant conversion
# #     # df["bidirectionnel"] = df["bidirectionnel"].str.lower().map({'oui': 1, 'non': 0})
# #     # df["temporaire"] = df["temporaire"].str.lower().map({'oui': 1, 'non': 0})

# #     df["bidirectionnel"] = df["bidirectionnel"].str.lower().map({'oui': 1, 'non': 0}).fillna(0)
# #     df["temporaire"] = df["temporaire"].str.lower().map({'oui': 1, 'non': 0}).fillna(0)

# #     # convertir en 0/1
# #     df["bidirectionnel"] = df["bidirectionnel"].astype(int)
# #     df["temporaire"] = df["temporaire"].astype(int)

# #     df = df.dropna()

# #     df.to_parquet("data/silver/cyclable_clean.parquet", index=False)

# # if __name__ == "__main__":
# #     clean_cyclable()