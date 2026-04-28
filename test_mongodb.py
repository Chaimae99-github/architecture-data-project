import pandas as pd

files = [
 "data/silver/cyclable_clean.parquet",
 "data/gold/kpi_cyclable.parquet",
 "data/gold/kpi_transport.parquet",
 "data/gold/kpi_marche.parquet",
 "data/gold/kpi_connectivite_rue.parquet",

]

for f in files:
    print("\n",f)
    df = pd.read_parquet(f)
    print(df.columns.tolist())
    print(df.head(3))



# import pandas as pd

# files = [
#  "data/gold/kpi_transport.parquet",
#  "data/gold/kpi_cyclable.parquet",
#  "data/gold/kpi_connectivite_rue.parquet",
#  "data/gold/kpi_marche.parquet"
# ]

# for f in files:
#     print("\n",f)
#     df = pd.read_parquet(f)
#     print(df.columns.tolist())
#     print(df.head(3))