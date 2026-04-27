
"""
SILVER LAYER — Nettoyage, normalisation & jointure spatiale
KPI : Accessibilité transport par rue

Entrée  : data/bronze/voies_paris_raw.json
          data/bronze/gares_idf_raw.json

Sorties :
- data/intermediate/voies_clean.geojson
- data/intermediate/gares_clean.geojson
- data/intermediate/voies_gares_joined.geojson
- data/silver/transport_clean.parquet
"""

import json
import os
import logging
import math
import hashlib
from datetime import datetime
from typing import Any
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SILVER] %(levelname)s — %(message)s"
)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(__file__)

BRONZE_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "../../data/bronze")
)

INTERMEDIATE_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "../../data/intermediate")
)

SILVER_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "../../data/silver")
)

os.makedirs(INTERMEDIATE_DIR, exist_ok=True)
os.makedirs(SILVER_DIR, exist_ok=True)

RADIUS_M = 300

MODE_WEIGHTS = {
    "RER": 3,
    "TRAIN": 3,
    "METRO": 2,
    "TRAM": 1,
    "VAL": 1,
}


# -------------------------------------------------
# Helpers
# -------------------------------------------------

def safe_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    return str(value).strip()


def safe_float(value: Any, default: float = 0.0):
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


# -------------------------------------------------
# Géospatial
# -------------------------------------------------

def haversine_m(lon1, lat1, lon2, lat2):
    R = 6371000

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2-lat1)
    dlambda = math.radians(lon2-lon1)

    a=(
        math.sin(dphi/2)**2 +
        math.cos(phi1)*math.cos(phi2)*
        math.sin(dlambda/2)**2
    )

    return 2*R*math.asin(math.sqrt(a))


def lonlat_to_local_xy_m(lon, lat, ref_lat):
    R=6371000
    x=math.radians(lon)*R*math.cos(
        math.radians(ref_lat)
    )
    y=math.radians(lat)*R
    return x,y


def point_segment_distance_m(
    px,py,
    ax,ay,
    bx,by
):

    dx=bx-ax
    dy=by-ay

    if dx==0 and dy==0:
        return math.hypot(
            px-ax,
            py-ay
        )

    t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)
    t=max(0,min(1,t))

    proj_x=ax+t*dx
    proj_y=ay+t*dy

    return math.hypot(
       px-proj_x,
       py-proj_y
    )


def point_linestring_distance_m(
    lon,
    lat,
    coords
):

    if len(coords)<2:
        return float("inf")

    ref_lat=lat
    px,py=lonlat_to_local_xy_m(
       lon,
       lat,
       ref_lat
    )

    min_dist=float("inf")

    for i in range(len(coords)-1):

        lon1,lat1=coords[i]
        lon2,lat2=coords[i+1]

        ax,ay=lonlat_to_local_xy_m(
            lon1,
            lat1,
            ref_lat
        )
        bx,by=lonlat_to_local_xy_m(
            lon2,
            lat2,
            ref_lat
        )

        dist=point_segment_distance_m(
           px,py,
           ax,ay,
           bx,by
        )

        if dist<min_dist:
            min_dist=dist

    return min_dist


def linestring_length_km(coords):

    total=0

    for i in range(len(coords)-1):
        lon1,lat1=coords[i]
        lon2,lat2=coords[i+1]
        total+=haversine_m(
            lon1,lat1,
            lon2,lat2
        )

    return total/1000


def centroid_of_linestring(coords):
    lons=[c[0] for c in coords]
    lats=[c[1] for c in coords]
    return (
       sum(lons)/len(lons),
       sum(lats)/len(lats)
    )


def get_all_coords(geometry):

    gtype=geometry.get("type","")

    if gtype=="LineString":
        return geometry.get(
            "coordinates",
            []
        )

    elif gtype=="MultiLineString":
        coords=[]
        for part in geometry.get(
            "coordinates",
            []
        ):
            coords.extend(part)
        return coords

    return []


def compute_bbox(coords):
    lons=[c[0] for c in coords]
    lats=[c[1] for c in coords]

    return (
       min(lons),
       min(lats),
       max(lons),
       max(lats)
    )


def point_in_expanded_bbox(
    lon,
    lat,
    bbox,
    expand_m
):

    min_lon,min_lat,max_lon,max_lat=bbox

    delta_lat=expand_m/111320
    delta_lon=(
      expand_m/
      (
       111320*
       math.cos(
         math.radians(
           (min_lat+max_lat)/2
         )
       )
      )
    )

    return (
      (min_lon-delta_lon)<=lon<=(max_lon+delta_lon)
      and
      (min_lat-delta_lat)<=lat<=(max_lat+delta_lat)
    )


# -------------------------------------------------
# Voies
# -------------------------------------------------

def stable_voie_id(coords):
    raw=json.dumps(
      coords[:10],
      ensure_ascii=False,
      sort_keys=True
    )

    return hashlib.md5(
      raw.encode("utf-8")
    ).hexdigest()


def clean_voies(raw_path):

    logger.info(
       "Nettoyage voies..."
    )

    with open(
       raw_path,
       encoding="utf-8"
    ) as f:
        wrapper=json.load(f)

    features=wrapper[
      "data"
    ]["features"]

    cleaned=[]

    for feat in features:

        props=feat.get(
          "properties",
          {}
        )

        geom=feat.get(
          "geometry",
          {}
        )

        if geom.get("type") not in (
          "LineString",
          "MultiLineString"
        ):
            continue

        coords=get_all_coords(geom)

        if len(coords)<2:
            continue

        length_km=linestring_length_km(
            coords
        )

        centroid_lon,centroid_lat=(
          centroid_of_linestring(
            coords
          )
        )

        bbox=compute_bbox(coords)

        voie_id=(
          safe_str(
             props.get("idvoie")
          )
          or stable_voie_id(coords)
        )

        nom=(
           safe_str(
             props.get("libelle")
           )
           or
           safe_str(
             props.get("nom_voie")
           )
           or
           "Inconnu"
        )

        cleaned.append({
          "type":"Feature",
          "geometry":geom,
          "properties":{
            "voie_id":voie_id,
            "nom":nom,
            "length_km":round(
                length_km,
                4
            ),
            "centroid_lon":round(
                centroid_lon,
                6
            ),
            "centroid_lat":round(
                centroid_lat,
                6
            ),
            "bbox_min_lon":bbox[0],
            "bbox_min_lat":bbox[1],
            "bbox_max_lon":bbox[2],
            "bbox_max_lat":bbox[3]
          }
        })

    logger.info(
      f"✓ {len(cleaned)} voies"
    )

    return cleaned


# -------------------------------------------------
# Gares
# -------------------------------------------------

def parse_modes(props):

    modes=[]

    bool_map={
      "rer":"RER",
      "train":"TRAIN",
      "metro":"METRO",
      "tram":"TRAM",
      "tramway":"TRAM",
      "val":"VAL"
    }

    for col,mode in bool_map.items():
        val=str(
          props.get(col,"")
        ).lower().strip()

        if val in (
          "1",
          "true",
          "oui",
          "yes"
        ):
            modes.append(mode)

    if not modes:
        raw_mode=(
          safe_str(
            props.get("mode")
          )
        ).upper()

        for m in [
         "RER",
         "TRAIN",
         "METRO",
         "TRAM",
         "VAL"
        ]:
           if m in raw_mode:
              modes.append(m)

    return list(
       dict.fromkeys(modes)
    ) or ["UNKNOWN"]


def clean_gares(raw_path):

    logger.info(
      "Nettoyage gares..."
    )

    with open(
      raw_path,
      encoding="utf-8"
    ) as f:
       wrapper=json.load(f)

    features=wrapper[
      "data"
    ]["features"]

    cleaned=[]

    for feat in features:

        props=feat.get(
           "properties",
           {}
        )

        geom=feat.get(
           "geometry",
           {}
        )

        if geom.get("type")!="Point":
            continue

        coords=geom.get(
          "coordinates",
          []
        )

        if len(coords)<2:
            continue

        lon=safe_float(
           coords[0],
           None
        )
        lat=safe_float(
           coords[1],
           None
        )

        if lon is None:
            continue

        gare_id=(
          safe_str(
            props.get("id_gare")
          )
          or
          hashlib.md5(
            f"{lon},{lat}".encode(
              "utf-8"
            )
          ).hexdigest()
        )

        nom=(
          safe_str(
             props.get(
               "nom_gare"
             )
          )
          or
          "Gare inconnue"
        )

        modes=parse_modes(props)

        weight=sum(
          MODE_WEIGHTS.get(
            m,
            0
          )
          for m in modes
        )

        cleaned.append({
          "type":"Feature",
          "geometry":{
             "type":"Point",
             "coordinates":[lon,lat]
          },
          "properties":{
             "gare_id":gare_id,
             "nom":nom,
             "modes":modes,
             "weight":weight,
             "lon":lon,
             "lat":lat
          }
        })

    logger.info(
      f"✓ {len(cleaned)} gares"
    )

    return cleaned


# -------------------------------------------------
# Spatial join
# -------------------------------------------------

def spatial_join(
   voies,
   gares,
   radius_m=RADIUS_M
):

    joined=[]

    total=len(voies)

    for i,voie in enumerate(
       voies,
       1
    ):

        if i%1000==0:
            logger.info(
               f"{i}/{total} voies"
            )

        vp=voie["properties"]
        coords=get_all_coords(
           voie["geometry"]
        )

        bbox=(
         vp["bbox_min_lon"],
         vp["bbox_min_lat"],
         vp["bbox_max_lon"],
         vp["bbox_max_lat"]
        )

        nearby=[]
        score_brut=0

        for gare in gares:

            gp=gare["properties"]

            lon=gp["lon"]
            lat=gp["lat"]

            if not point_in_expanded_bbox(
                lon,
                lat,
                bbox,
                radius_m
            ):
                continue

            dist=point_linestring_distance_m(
               lon,
               lat,
               coords
            )

            if dist<=radius_m:

                nearby.append({
                  "gare_id":gp["gare_id"],
                  "nom":gp["nom"],
                  "weight":gp["weight"],
                  "dist_m":round(
                     dist,
                     1
                  )
                })

                score_brut+=gp[
                  "weight"
                ]

        nearby.sort(
          key=lambda x:x[
             "dist_m"
          ]
        )

        joined.append({
          "type":"Feature",
          "geometry":voie[
            "geometry"
          ],
          "properties":{
             "voie_id":vp[
                "voie_id"
             ],
             "nom":vp[
                "nom"
             ],
             "length_km":vp[
                "length_km"
             ],
             "station_count":len(
                nearby
             ),
             "score_brut":score_brut,
             "nearby_stations":nearby
          }
        })

    return joined


# -------------------------------------------------
# Save
# -------------------------------------------------

def save_geojson(
   features,
   path,
   label
):

    geojson={
      "type":"FeatureCollection",
      "_meta":{
         "label":label,
         "processed_at":(
           datetime.utcnow(
           ).isoformat()+"Z"
         ),
         "count":len(
            features
         )
      },
      "features":features
    }

    with open(
      path,
      "w",
      encoding="utf-8"
    ) as f:

       json.dump(
         geojson,
         f,
         ensure_ascii=False
       )


# -------------------------------------------------
# Main
# -------------------------------------------------

def run():

    voies_path=os.path.join(
      BRONZE_DIR,
      "voies_paris_raw.json"
    )

    gares_path=os.path.join(
      BRONZE_DIR,
      "gares_idf_raw.json"
    )

    voies=clean_voies(
       voies_path
    )

    gares=clean_gares(
       gares_path
    )

    save_geojson(
      voies,
      os.path.join(
        INTERMEDIATE_DIR,
        "voies_clean.geojson"
      ),
      "Voies nettoyées"
    )

    save_geojson(
      gares,
      os.path.join(
        INTERMEDIATE_DIR,
        "gares_clean.geojson"
      ),
      "Gares nettoyées"
    )

    joined=spatial_join(
      voies,
      gares
    )

    save_geojson(
      joined,
      os.path.join(
         INTERMEDIATE_DIR,
         "voies_gares_joined.geojson"
      ),
      "Jointure spatiale"
    )


    # -------- vraie sortie silver --------

    records=[]

    for feat in joined:

        p=feat[
          "properties"
        ]

        records.append({
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
          ]
        })

    df=pd.DataFrame(
      records
    )

    df.to_parquet(
      os.path.join(
        SILVER_DIR,
        "transport_clean.parquet"
      ),
      index=False
    )

    logger.info(
      "✓ Silver processing terminé"
    )


if __name__=="__main__":
    run()

