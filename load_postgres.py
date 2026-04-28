import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine(
    "postgresql://admin:admin@localhost:5432/architecture_data"
)

# Supprimer toutes les tables avec CASCADE (supprime aussi les FK)
with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS cyclable, transport, connectivite, marche, streets CASCADE"))
    conn.commit()

print("Tables supprimées")

# streets
streets = pd.read_parquet(
    "data/bronze/streets_base.parquet"
)
streets = streets.rename(
    columns={"name": "street_name"}
)
streets = streets[
    [
        "street_id",
        "osm_id",
        "street_name",
        "highway",
        "longueur_metres",
        "arrondissement"
    ]
]
streets["street_id"] = streets["street_id"].astype("int64")
streets.to_sql(
    "streets",
    engine,
    if_exists="replace",
    index=False
)
print("streets loaded")

# Récupérer les street_id valides depuis streets
valid_street_ids = set(streets["street_id"].unique())
print(f"Nombre de streets valides: {len(valid_street_ids)}")

# cyclable
cyclable = pd.read_parquet(
    "data/silver/cyclable_clean.parquet"
)
cyclable = (
    cyclable
    .groupby("street_id", as_index=False)
    .agg({
        "rue": "first",
        "rue_reference": "first",
        "rue_norm": "first",
        "arrondissement": "first",
        "longueur": "sum",
        "vitesse": "mean",
        "bidirectionnel": "max",
        "temporaire": "max",
        "matched_street": "max"
    })
)
cyclable["street_id"] = cyclable["street_id"].astype("int64")

# Filtrer les street_id invalides
cyclable_before = len(cyclable)
cyclable = cyclable[cyclable["street_id"].isin(valid_street_ids)]
cyclable_after = len(cyclable)
print(f"cyclable: {cyclable_before} -> {cyclable_after} lignes (supprimé: {cyclable_before - cyclable_after})")

cyclable.to_sql(
    "cyclable",
    engine,
    if_exists="replace",
    index=False
)
print("cyclable loaded")

# transport
# transport = pd.read_parquet(
#     "data/silver/transport_clean.parquet"
# )
# if "street_id" in transport.columns:
#     transport["street_id"] = transport["street_id"].astype("int64")
    
#     # Filtrer les street_id invalides
#     transport_before = len(transport)
#     transport = transport[transport["street_id"].isin(valid_street_ids)]
#     transport_after = len(transport)
#     print(f"transport: {transport_before} -> {transport_after} lignes (supprimé: {transport_before - transport_after})")

# transport.to_sql(
#     "transport",
#     engine,
#     if_exists="replace",
#     index=False
# )

transport = pd.read_parquet(
    "data/silver/transport_clean.parquet"
)

# garder toutes les lignes
# pas de filtre

print(
 f"transport loaded : {len(transport)} lignes"
)

transport.to_sql(
    "transport",
    engine,
    if_exists="replace",
    index=False
)

# connectivite
connectivite = pd.read_parquet(
    "data/silver/connectivite_rue.parquet"
)
if "street_id" in connectivite.columns:
    connectivite["street_id"] = connectivite["street_id"].astype("int64")
    
    # Filtrer les street_id invalides
    connectivite_before = len(connectivite)
    connectivite = connectivite[connectivite["street_id"].isin(valid_street_ids)]
    connectivite_after = len(connectivite)
    print(f"connectivite: {connectivite_before} -> {connectivite_after} lignes (supprimé: {connectivite_before - connectivite_after})")

connectivite.to_sql(
    "connectivite",
    engine,
    if_exists="replace",
    index=False
)

# marche
marche = pd.read_parquet(
    "data/silver/marche_clean.parquet"
)
if "street_id" in marche.columns:
    marche["street_id"] = marche["street_id"].astype("int64")
    
    # Filtrer les street_id invalides
    marche_before = len(marche)
    marche = marche[marche["street_id"].isin(valid_street_ids)]
    marche_after = len(marche)
    print(f"marche: {marche_before} -> {marche_after} lignes (supprimé: {marche_before - marche_after})")

marche.to_sql(
    "marche",
    engine,
    if_exists="replace",
    index=False
)

print("Chargement terminé")