# Génère les fichiers de la démo HellBoy : photos dessinées (public/photos),
# estimations et devis PDF fictifs (public/documents), et scenes.json, lu par
# data.ts (dégâts et boîtes englobantes, estimations lues « à l'import »).
#
#   python demos/hellboy/assets/generate.py
#
# Tout est inventé : véhicules dessinés, plaques en DE-1xx-MO, carrossiers et
# assureurs fictifs. Aucune pièce des archives garage du vrai projet n'est
# reprise (elles portent plaques, numéros de série et noms).
import datetime
import hashlib
import json
import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
import car  # noqa: E402
from car import OUT_H, OUT_W, SS  # noqa: E402
from pdf import Page, write_pdf  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PHOTOS = os.path.join(ROOT, "public", "photos")
DOCS = os.path.join(ROOT, "public", "documents")
QUALITY = 74

AVG, AVD = "trois_quarts_avant_gauche", "trois_quarts_avant_droit"
ARG, ARD = "trois_quarts_arriere_gauche", "trois_quarts_arriere_droit"


def font(size, bold=False):
    try:
        return ImageFont.truetype("arialbd.ttf" if bold else "arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


# ── Où dessiner chaque zone ─────────────────────────────────────────────────
# Surface : "flank" (profil, toile 1000 × 420, véhicule tourné vers la gauche ;
# le côté droit est obtenu par miroir) ou "front"/"rear" (bouclier vu de face,
# toile 420 × 120 ; à l'avant, la gauche du véhicule est à droite de l'image).

ZONES = {
    "front_left_fender": ("flank", "left", (266, 246, 318, 312)),
    "front_right_fender": ("flank", "right", (266, 246, 318, 312)),
    "front_left_door": ("flank", "left", (360, 262, 540, 336)),
    "front_right_door": ("flank", "right", (360, 262, 540, 336)),
    "rear_left_door": ("flank", "left", (592, 256, 690, 314)),
    "rear_right_door": ("flank", "right", (592, 256, 690, 314)),
    "rear_left_fender": ("flank", "left", (812, 240, 912, 292)),
    "rear_right_fender": ("flank", "right", (812, 240, 912, 292)),
    "left_rocker_panel": ("flank", "left", (300, 350, 660, 366)),
    "right_rocker_panel": ("flank", "right", (300, 350, 660, 366)),
    "left_mirror": ("flank", "left", (322, 215, 360, 239)),
    "right_mirror": ("flank", "right", (322, 215, 360, 239)),
    "front_bumper": ("front", None, (130, 80, 300, 97)),
    "front_bumper_left": ("front", None, (300, 58, 412, 97)),
    "front_bumper_right": ("front", None, (8, 58, 120, 97)),
    "headlight_left": ("front", None, (300, 10, 402, 44)),
    "headlight_right": ("front", None, (18, 10, 120, 44)),
    "grille": ("front", None, (134, 20, 286, 52)),
    "rear_bumper": ("rear", None, (130, 78, 300, 97)),
    "rear_bumper_left": ("rear", None, (8, 58, 120, 97)),
    "rear_bumper_right": ("rear", None, (300, 58, 412, 97)),
    "taillight_left": ("rear", None, (10, 6, 110, 40)),
    "taillight_right": ("rear", None, (310, 6, 410, 40)),
}

VIEW_GEOMETRY = {AVG: ("left", "front"), AVD: ("right", "front"), ARG: ("left", "rear"), ARD: ("right", "rear")}


def surfaces(dmg):
    surface, side, rect = ZONES[dmg["zone"]]
    return surface, side, rect


def render_view(carspec, view, damages):
    """Vue 3/4 : image haute définition (RGBA, déjà en miroir si besoin) et boîtes des dégâts visibles."""
    side, end = VIEW_GEOMETRY[view]
    mirror = side == "right"
    flank_d, fascia_d, keys = [], [], []
    for dm in damages:
        surface, dside, rect = surfaces(dm)
        if surface == "flank" and dside == side:
            flank_d.append({"type": dm["type"], "rect": rect, "seed": dm["seed"]})
            keys.append((dm["key"], "flank", rect))
        elif surface == end:
            # Le bouclier est retourné avant composition pour retrouver le bon
            # côté une fois l'image entière passée en miroir.
            r = (420 - rect[2], rect[1], 420 - rect[0], rect[3]) if mirror else rect
            fascia_d.append({"type": dm["type"], "rect": r, "seed": dm["seed"]})
            keys.append((dm["key"], "fascia", r))
    img, fmap, smap = car.three_quarter(carspec, end, flank_d, fascia_d, seed=carspec["seed"] + len(view))
    boxes = {k: car.bbox_of(fmap if where == "flank" else smap, r, mirror) for k, where, r in keys}
    if mirror:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img, boxes


def render_side(carspec, side, damages):
    """Plan large : profil sans perspective."""
    img = car.background(carspec["seed"] + 7, carspec.get("wall", (196, 192, 184)))
    flank_d, keys = [], []
    for dm in damages:
        surface, dside, rect = surfaces(dm)
        if surface == "flank" and dside == side:
            flank_d.append({"type": dm["type"], "rect": rect, "seed": dm["seed"]})
            keys.append((dm["key"], rect))
    flank = car.draw_flank(carspec["color"], carspec["kind"], flank_d)
    src = [(0, 0), (car.FLANK_W, 0), (car.FLANK_W, car.FLANK_H), (0, car.FLANK_H)]
    dst = [(40, 150), (760, 150), (760, 452), (40, 452)]
    car.shadow(img, [(70, 430), (740, 430), (740, 452), (70, 452)])
    img.alpha_composite(car.warp(flank, src, dst, (OUT_W, OUT_H)))
    H = car.homography(src, dst)
    boxes = {k: car.bbox_of(lambda p: car.apply_h(H, p), r, side == "right") for k, r in keys}
    if side == "right":
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img, boxes


def closeup(hi, box, others, blur=0.6):
    """Gros plan recadré autour d'une boîte ; renvoie l'image et les boîtes recalculées."""
    bx, by, bw, bh = box
    cx, cy = (bx + bw / 2) * OUT_W, (by + bh / 2) * OUT_H
    w = max(bw * OUT_W * 2.6, bh * OUT_H * 2.6 * 4 / 3, 180)
    w = min(w, OUT_W)
    h = w * 3 / 4
    x0 = min(max(cx - w / 2, 0), OUT_W - w)
    y0 = min(max(cy - h / 2, 0), OUT_H - h)
    crop = hi.crop((int(x0 * SS), int(y0 * SS), int((x0 + w) * SS), int((y0 + h) * SS)))
    out = crop.convert("RGB").resize((OUT_W, OUT_H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(blur))

    def remap(b):
        nx0 = (b[0] * OUT_W - x0) / w
        ny0 = (b[1] * OUT_H - y0) / h
        nx1 = ((b[0] + b[2]) * OUT_W - x0) / w
        ny1 = ((b[1] + b[3]) * OUT_H - y0) / h
        cx0, cy0, cx1, cy1 = max(nx0, 0), max(ny0, 0), min(nx1, 1), min(ny1, 1)
        if cx1 <= cx0 or cy1 <= cy0:
            return None
        if (cx1 - cx0) * (cy1 - cy0) < 0.5 * (nx1 - nx0) * (ny1 - ny0):
            return None
        return (cx0, cy0, cx1 - cx0, cy1 - cy0)

    boxes = {k: remap(b) for k, b in others.items()}
    return out, {k: b for k, b in boxes.items() if b is not None}


def dashboard(km, seed):
    W, H = OUT_W * SS, OUT_H * SS
    img = Image.new("RGB", (W, H), (18, 18, 20))
    d = ImageDraw.Draw(img)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=(int(22 + 14 * y / H),) * 3)
    for cx in (240, 560):
        cy, r = 300, 165
        d.ellipse([car.s(cx - r), car.s(cy - r), car.s(cx + r), car.s(cy + r)], fill=(10, 10, 12), outline=(90, 90, 96), width=car.s(4))
        for k in range(11):
            a = math.radians(135 + k * 27)
            x0, y0 = cx + math.cos(a) * (r - 12), cy + math.sin(a) * (r - 12)
            x1, y1 = cx + math.cos(a) * (r - 34), cy + math.sin(a) * (r - 34)
            d.line([(car.s(x0), car.s(y0)), (car.s(x1), car.s(y1))], fill=(230, 230, 230), width=car.s(3))
            label = str(k * 20) if cx == 240 else str(k)
            tx, ty = cx + math.cos(a) * (r - 58), cy + math.sin(a) * (r - 58)
            d.text((car.s(tx), car.s(ty)), label, fill=(200, 200, 200), font=font(car.s(15)), anchor="mm")
        a = math.radians(135 + (2.2 if cx == 240 else 1.4) * 27)
        d.line([(car.s(cx), car.s(cy)), (car.s(cx + math.cos(a) * (r - 30)), car.s(cy + math.sin(a) * (r - 30)))], fill=(230, 60, 40), width=car.s(5))
        d.ellipse([car.s(cx - 14), car.s(cy - 14), car.s(cx + 14), car.s(cy + 14)], fill=(60, 60, 64))
    d.text((car.s(240), car.s(380)), "km/h", fill=(160, 160, 160), font=font(car.s(16)), anchor="mm")
    d.text((car.s(560), car.s(380)), "x1000 tr/min", fill=(160, 160, 160), font=font(car.s(16)), anchor="mm")
    d.rounded_rectangle([car.s(300), car.s(490), car.s(500), car.s(545)], radius=car.s(6), fill=(30, 46, 40), outline=(80, 90, 86), width=car.s(2))
    d.text((car.s(400), car.s(518)), f"{km:,}".replace(",", " ") + " km", fill=(170, 240, 200), font=font(car.s(26), True), anchor="mm")
    return img.resize((OUT_W, OUT_H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.4))


def maker_plate(make, seed):
    img = Image.new("RGB", (OUT_W * SS, OUT_H * SS), (60, 62, 66))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([car.s(120), car.s(150), car.s(680), car.s(450)], radius=car.s(10), fill=(196, 198, 200), outline=(120, 122, 126), width=car.s(3))
    for x, y in ((140, 170), (660, 170), (140, 430), (660, 430)):
        d.ellipse([car.s(x - 9), car.s(y - 9), car.s(x + 9), car.s(y + 9)], fill=(150, 152, 156), outline=(100, 100, 104))
    lines = [(make.upper() + "  —  PLAQUE FICTIVE", True), ("e0*0000/00*0000*00", False), ("VIN  DEMO-VIN-0000000", True),
             ("1 410 kg", False), ("1-  780 kg     2-  740 kg", False), ("DOCUMENT DE DÉMONSTRATION", False)]
    for i, (txt, bold) in enumerate(lines):
        d.text((car.s(170), car.s(200 + i * 40)), txt, fill=(30, 30, 34), font=font(car.s(24), bold))
    return img.resize((OUT_W, OUT_H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))


def plate_photo(carspec, plate):
    img = car.background(carspec["seed"] + 3, carspec.get("wall", (196, 192, 184)))
    d = ImageDraw.Draw(img)
    col = carspec["color"]
    d.rectangle([0, car.s(120), car.s(OUT_W), car.s(520)], fill=car.shade(col, -0.05))
    d.rectangle([0, car.s(420), car.s(OUT_W), car.s(520)], fill=car.TRIM)
    d.rectangle([car.s(40), car.s(150), car.s(220), car.s(230)], fill=(170, 18, 28))
    d.rectangle([car.s(580), car.s(150), car.s(760), car.s(230)], fill=(170, 18, 28))
    d.rectangle([car.s(220), car.s(290), car.s(580), car.s(375)], fill=(242, 242, 238), outline=(30, 30, 30), width=car.s(3))
    d.rectangle([car.s(220), car.s(290), car.s(260), car.s(375)], fill=(30, 60, 160))
    d.text((car.s(420), car.s(333)), plate, fill=(20, 20, 20), font=font(car.s(54), True), anchor="mm")
    return car.finish(img, blur=0.6)


def save(img, name, rotate=False):
    """Enregistre la photo ; `rotate` la couche (fichier tourné d'un quart de tour, comme les archives)."""
    if rotate:
        img = img.rotate(90, expand=True)
    path = os.path.join(PHOTOS, name)
    img.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    data = open(path, "rb").read()
    return {"file": name, "width": img.width, "height": img.height, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def to_file_box(box):
    """Boîte de l'image redressée → repère du fichier couché (rotateBoundingBox(box, 270))."""
    x, y, w, h = box
    return (y, 1 - x - w, h, w)


def r4(box):
    return {"x": round(box[0], 4), "y": round(box[1], 4), "width": round(box[2], 4), "height": round(box[3], 4)}


# ── Dossiers ────────────────────────────────────────────────────────────────
# photos : (vue, options). Options : "of" = dégât du gros plan, "rotate" =
# fichier couché, "fixed" = rotation d'affichage déjà corrigée (90), "as" =
# angle enregistré (sinon la vue elle-même ; "autre" pour une archive non triée),
# "blur" = gros plan raté.

CASES = {
    "c01": dict(car=dict(make="Peugeot", model="208", kind="hatch", color=(236, 236, 232), seed=11), km=38400,
                damages=[dict(key="d1", zone="rear_bumper", type="scratch", severity="minor"),
                         dict(key="d2", zone="rear_left_fender", type="dent", severity="medium")],
                photos=[(AVG, {}), (AVD, {}), (ARG, {}), (ARD, {}), ("probleme", {"of": "d2", "from": ARG}),
                        ("compteur", {})]),
    "c02": dict(car=dict(make="Renault", model="Clio IV", kind="hatch", color=(128, 132, 138), seed=21), km=92150,
                damages=[dict(key="d1", zone="front_bumper", type="tear", severity="medium"),
                         dict(key="d2", zone="headlight_left", type="broken_light", severity="critical")],
                photos=[(AVG, {"rotate": True, "fixed": True}), (AVD, {"rotate": True, "fixed": True}),
                        ("probleme", {"of": "d2", "from": AVG, "rotate": True, "fixed": True}),
                        ("probleme", {"of": "d1", "from": AVD}), ("plaque_constructeur", {})]),
    "c03": dict(car=dict(make="Volkswagen", model="Golf VII", kind="hatch", color=(40, 80, 150), seed=31), km=121300,
                damages=[dict(key="d1", zone="front_left_door", type="dent", severity="medium"),
                         dict(key="d2", zone="rear_left_door", type="scratch", severity="minor")],
                photos=[(AVG, {}), (AVD, {}), (ARG, {}), (ARD, {}), ("probleme", {"of": "d1", "from": AVG}),
                        ("plan_large", {"side": "left"})]),
    "c04": dict(car=dict(make="Toyota", model="Yaris III", kind="hatch", color=(170, 30, 36), seed=41), km=54800,
                damages=[dict(key="d1", zone="rear_right_door", type="scratch", severity="minor"),
                         dict(key="d2", zone="right_rocker_panel", type="paint_chip", severity="minor")],
                photos=[(AVG, {}), (AVD, {}), (ARG, {}), (ARD, {}), ("probleme", {"of": "d1", "from": ARD})]),
    "c05": dict(car=dict(make="Citroën", model="C3 III", kind="hatch", color=(214, 120, 40), seed=51), km=46900,
                damages=[dict(key="d1", zone="right_mirror", type="missing_part", severity="medium"),
                         dict(key="d2", zone="front_right_fender", type="scratch", severity="minor")],
                photos=[(AVD, {}), (ARD, {}), ("probleme", {"of": "d1", "from": AVD}),
                        ("probleme", {"of": "d2", "from": AVD}), ("compteur", {})]),
    "c06": dict(car=dict(make="Dacia", model="Sandero III", kind="hatch", color=(196, 182, 150), seed=61), km=21700,
                damages=[dict(key="d1", zone="front_bumper", type="scratch", severity="minor"),
                         dict(key="d2", zone="grille", type="tear", severity="medium")],
                photos=[(AVG, {}), (AVD, {}), (ARG, {}), (ARD, {}), ("probleme", {"of": "d2", "from": AVG})]),
    "c07": dict(car=dict(make="Peugeot", model="3008 II", kind="suv", color=(70, 72, 78), seed=71), km=88000,
                damages=[dict(key="d1", zone="rear_left_door", type="dent", severity="medium"),
                         dict(key="d2", zone="left_rocker_panel", type="scratch", severity="minor")],
                photos=[(AVG, {}), (ARG, {}), ("probleme", {"of": "d1", "from": ARG}), ("plan_large", {"side": "left"}),
                        ("compteur", {"as": "autre"})]),
    "c08": dict(car=dict(make="Renault", model="Mégane IV", kind="hatch", color=(30, 32, 36), seed=81), km=67400,
                damages=[dict(key="d1", zone="front_right_door", type="scratch", severity="medium"),
                         dict(key="d2", zone="rear_right_door", type="dent", severity="medium")],
                pointed=False,
                photos=[(AVD, {"rotate": True, "as": "autre"}), (ARD, {"rotate": True, "as": "autre"}),
                        ("probleme", {"of": "d1", "from": AVD, "rotate": True, "as": "autre"}),
                        ("probleme", {"of": "d2", "from": ARD, "as": "autre"}), ("compteur", {"as": "autre"})]),
    "c09": dict(car=dict(make="Ford", model="Fiesta VII", kind="hatch", color=(226, 190, 40), seed=91), km=73900,
                damages=[dict(key="d1", zone="front_left_fender", type="dent", severity="medium")],
                unpointed=["d1"],
                photos=[(AVG, {}), ("probleme", {"of": "d1", "from": AVG})]),
    "c11": dict(car=dict(make="Opel", model="Corsa F", kind="hatch", color=(180, 184, 190), seed=111), km=39000,
                damages=[dict(key="d1", zone="front_left_door", type="scratch", severity="minor")],
                photos=[(AVG, {}), ("probleme", {"of": "d1", "from": AVG, "blur": 7}), (ARG, {})]),
    "c12": dict(car=dict(make="Renault", model="Kangoo III", kind="van", color=(232, 232, 228), seed=121), km=102600,
                damages=[dict(key="d1", zone="rear_bumper_right", type="dent", severity="medium"),
                         dict(key="d2", zone="taillight_right", type="broken_light", severity="critical")],
                photos=[(ARD, {}), (ARG, {}), ("probleme", {"of": "d2", "from": ARD}), ("plaque", {}), ("compteur", {})]),
    "c13": dict(car=dict(make="Skoda", model="Octavia III", kind="sedan", color=(40, 96, 70), seed=131), km=134200,
                damages=[dict(key="d1", zone="front_right_door", type="scratch", severity="medium"),
                         dict(key="d2", zone="front_right_fender", type="paint_chip", severity="minor")],
                photos=[(AVG, {}), (AVD, {}), (ARG, {}), (ARD, {}), ("probleme", {"of": "d1", "from": AVD})]),
    # Archives proposées au dépôt (« Imports ») : photos non triées, dont
    # certaines couchées, aucun dégât créé — c'est l'annotateur qui tranche.
    "impA": dict(car=dict(make="Volkswagen", model="Polo VI", kind="hatch", color=(120, 160, 200), seed=201), km=58300,
                 damages=[dict(key="d1", zone="front_left_door", type="dent", severity="medium"),
                          dict(key="d2", zone="front_left_fender", type="scratch", severity="minor")],
                 pointed=False,
                 photos=[(AVG, {"as": "autre"}), (ARG, {"rotate": True, "as": "autre"}),
                         ("probleme", {"of": "d1", "from": AVG, "rotate": True, "as": "autre"}),
                         ("probleme", {"of": "d2", "from": AVG, "as": "autre"}), ("compteur", {"as": "autre"})]),
    "impB": dict(car=dict(make="Renault", model="Captur II", kind="suv", color=(190, 60, 40), seed=211), km=31200,
                 damages=[dict(key="d1", zone="rear_bumper_left", type="tear", severity="medium"),
                          dict(key="d2", zone="taillight_left", type="broken_light", severity="critical")],
                 pointed=False,
                 photos=[(ARG, {"as": "autre"}), (AVG, {"as": "autre"}),
                         ("probleme", {"of": "d2", "from": ARG, "as": "autre"}),
                         ("probleme", {"of": "d1", "from": ARG, "rotate": True, "as": "autre"})]),
    # Dossiers DREVIO proposés à l'import (écran « Imports ») : photos déjà
    # classées par le protocole de scan, dégâts repris sans zone pointée.
    "drv1": dict(car=dict(make="Peugeot", model="2008 II", kind="suv", color=(44, 86, 140), seed=301), km=27400,
                 damages=[dict(key="d1", zone="front_right_door", type="dent", severity="medium"),
                          dict(key="d2", zone="front_right_fender", type="scratch", severity="minor")],
                 pointed=False,
                 photos=[(AVD, {}), (ARD, {}), ("probleme", {"of": "d1", "from": AVD})]),
    "drv2": dict(car=dict(make="Fiat", model="500", kind="hatch", color=(200, 226, 214), seed=311), km=61800,
                 damages=[dict(key="d1", zone="rear_bumper", type="scratch", severity="minor")],
                 pointed=False,
                 photos=[(ARG, {}), (ARD, {}), ("probleme", {"of": "d1", "from": ARG})]),
    "drv3": dict(car=dict(make="Renault", model="Zoé", kind="hatch", color=(236, 236, 240), seed=321), km=44100,
                 damages=[dict(key="d1", zone="front_left_door", type="scratch", severity="medium"),
                          dict(key="d2", zone="rear_left_fender", type="dent", severity="medium")],
                 pointed=False,
                 photos=[(AVG, {}), (ARG, {}), ("probleme", {"of": "d1", "from": AVG})]),
}

PLATES = {"drv1": "DE-301-MO", "drv2": "DE-302-MO", "drv3": "DE-303-MO", "c01": "DE-101-MO", "c02": "DE-102-MO", "c03": "DE-103-MO", "c04": "DE-104-MO", "c05": "DE-105-MO",
          "c06": "DE-106-MO", "c07": "DE-107-MO", "c08": "DE-108-MO", "c09": "DE-109-MO", "c11": "DE-111-MO",
          "c12": "DE-112-MO", "c13": "DE-113-MO", "impA": "DE-201-MO", "impB": "DE-202-MO"}


def build_case(key, spec):
    carspec = spec["car"]
    for i, dm in enumerate(spec["damages"]):
        dm["seed"] = carspec["seed"] * 10 + i
    photos, cache = [], {}
    pointed = spec.get("pointed", True)
    best = {}  # dégât → (priorité, photo, boîte)
    for index, (view, opt) in enumerate(spec["photos"]):
        name = f"{key}-{index + 1}.jpg"
        boxes = {}
        if view in VIEW_GEOMETRY:
            hi, boxes = cache.setdefault(view, render_view(carspec, view, spec["damages"]))
            img = car.finish(hi)
        elif view == "probleme":
            src = opt["from"]
            hi, srcboxes = cache.setdefault(src, render_view(carspec, src, spec["damages"]))
            img, boxes = closeup(hi, srcboxes[opt["of"]], srcboxes, blur=opt.get("blur", 0.6))
        elif view == "plan_large":
            hi, boxes = render_side(carspec, opt["side"], spec["damages"])
            img = car.finish(hi)
        elif view == "compteur":
            img = dashboard(spec["km"], carspec["seed"])
        elif view == "plaque_constructeur":
            img = maker_plate(carspec["make"], carspec["seed"])
        elif view == "plaque":
            img = plate_photo(carspec, PLATES[key])
        else:
            raise ValueError(view)
        rotate = opt.get("rotate", False)
        meta = save(img, name, rotate)
        meta.update(viewType=opt.get("as", view), rotationDegrees=90 if opt.get("fixed") else 0)
        photos.append(meta)
        for dkey, box in boxes.items():
            # Gros plan d'abord, puis vue 3/4 : le dégât est pointé là où il se voit le mieux.
            prio = 0 if (view == "probleme" and opt["of"] == dkey) else (1 if view in VIEW_GEOMETRY else 2)
            if dkey not in best or prio < best[dkey][0]:
                best[dkey] = (prio, name, to_file_box(box) if rotate else box)
    damages = []
    for dm in spec["damages"]:
        anchor = best.get(dm["key"])
        unpointed = not pointed or dm["key"] in spec.get("unpointed", [])
        damages.append({
            "key": dm["key"], "zone": dm["zone"], "damageType": dm["type"], "severity": dm["severity"],
            "photo": None if unpointed or anchor is None else anchor[1],
            "bbox": None if unpointed or anchor is None else r4(anchor[2]),
        })
    return {"vehicle": {"make": carspec["make"], "model": carspec["model"], "mileageKm": spec["km"]},
            "plate": PLATES[key], "photos": photos, "damages": damages}


# ── Estimations fictives ────────────────────────────────────────────────────

def jsround(x):
    """Math.round de JavaScript (l'arrondi au pair de Python donnerait d'autres centimes)."""
    return int(math.floor(x + 0.5))


def op(label, minutes, scale="t1", code=None, cat="T", interv=None):
    return {"code": code, "label": label, "minutes": minutes, "scale": scale, "category": cat, "intervention": interv}


def part(label, price_cents, reference=None, qty=1):
    return {"label": label, "reference": reference, "quantity": qty, "unitPriceCents": price_cents // qty, "totalCents": price_cents}


SHOPS = {
    "acacias": ("CARROSSERIE DES ACACIAS", "12 rue de l'Exemple", "00100 DÉMOVILLE"),
    "moulin": ("GARAGE DU MOULIN - CARROSSERIE", "4 chemin Fictif", "00200 SAINT-DÉMO"),
    "bellevue": ("ATELIER CARROSSERIE BELLEVUE", "ZA des Essais, lot 7", "00300 EXEMPLE-SUR-MER"),
}

ESTIMATES = {
    "c02": dict(shop="acacias", number="E-24-0412", date=58, incident=63, insurer="MUTUELLE EXEMPLE", expert="Cabinet Expertise Démo",
                vehicle=dict(firstRegistration="2017-03-14", vin="DEMO-VIN-0000102", color="GRIS PLATINE", colorCode="TED", bodyType="BERLINE 5P"),
                rates=dict(t1=6400, t2=7200, t3=8400, paint=6800, ingredients=3400),
                parts=[part("PARE-CHOCS AV", 21460, "DEMO-PC-0102"), part("PROJECTEUR G - ADAPTABLE (DEMO-0000) - Homologation ECE", 16840, "DEMO-PJ-0102"),
                       part("GRILLE PARE-CHOCS AV", 3820), part("AGRAFES DIVERSES", 680, qty=10)],
                operations=[op("DEPOSE-POSE PARE-CHOCS AV", 54, "t1", "C01", "T", "D"), op("ECHANGE PROJECTEUR G", 30, "t1", "C02", "T", "C"),
                            op("REGLAGE PROJECTEURS G, D", 18, "t2", "C03", "M", "G")],
                paint=[op("PEINTURE PARE-CHOCS AV", 96, "paint", "P01", "P")], quote=True),
    "c05": dict(shop="moulin", number="2024/1187", date=41, incident=45, insurer="ASSURANCE EXEMPLE", expert=None,
                vehicle=dict(firstRegistration="2020-06-02", vin="DEMO-VIN-0000105", color="ORANGE", colorCode="KRF", bodyType="BERLINE 5P"),
                rates=dict(t1=6600, t2=7400, t3=8600, paint=7000, ingredients=3600),
                parts=[part("RETROVISEUR EXT D", 14230, "DEMO-RV-0105")],
                operations=[op("DEPOSE-POSE RETROVISEUR EXT D", 24, "t1", "1", "T", "D"), op("REPARATION AILE AV D", 42, "t1", "2", "T")],
                paint=[op("PEINTURE AILE AV D", 84, "paint"), op("PEINTURE COQUE RETROVISEUR D", 30, "paint")], quote=False),
    "c07": dict(shop="bellevue", number="EST-7731", date=12, incident=16, insurer="MUTUELLE EXEMPLE", expert="Cabinet Expertise Démo",
                vehicle=dict(firstRegistration="2018-09-21", vin="DEMO-VIN-0000107", color="GRIS ARTENSE", colorCode="M0F4", bodyType="SUV 5P"),
                rates=dict(t1=7000, t2=7800, t3=9000, paint=7400, ingredients=3800),
                parts=[part("BAGUETTE PORTE AR G", 4690, "DEMO-BG-0107")],
                operations=[op("DEBOSSELAGE PORTE AR G", 90, "t2", "B1", "T"), op("DEPOSE-POSE GARNITURE PORTE AR G", 36, "t1", "B2", "S", "D"),
                            op("REPARATION BAS DE CAISSE G", 48, "t1", "B3", "T")],
                paint=[op("PEINTURE PORTE AR G", 108, "paint"), op("PEINTURE BAS DE CAISSE G", 60, "paint")], quote=False),
    "c08": dict(shop="acacias", number="E-24-0538", date=3, incident=9, insurer="ASSURANCE EXEMPLE", expert=None,
                vehicle=dict(firstRegistration="2019-01-30", vin="DEMO-VIN-0000108", color="NOIR ETOILE", colorCode="GNE", bodyType="BERLINE 5P"),
                rates=dict(t1=6400, t2=7200, t3=8400, paint=6800, ingredients=3400),
                parts=[part("BAGUETTE PORTE AV D - ADAPTABLE", 3950)],
                operations=[op("REPARATION PORTE AV D", 60, "t1", "C01", "T"), op("DEBOSSELAGE PORTE AR D", 75, "t2", "C02", "T")],
                paint=[op("PEINTURE PORTE AV D", 96, "paint"), op("PEINTURE PORTE AR D", 96, "paint")], quote=False),
    "c12": dict(shop="moulin", number="2024/0954", date=30, incident=34, insurer="MUTUELLE EXEMPLE", expert="Cabinet Expertise Démo",
                vehicle=dict(firstRegistration="2021-11-08", vin="DEMO-VIN-0000112", color="BLANC GLACIER", colorCode="QNG", bodyType="FOURGONNETTE"),
                rates=dict(t1=6600, t2=7400, t3=8600, paint=7000, ingredients=3600),
                parts=[part("FEU AR D", 9680, "DEMO-FE-0112"), part("PARE-CHOCS AR D", 12840, "DEMO-PC-0112")],
                operations=[op("DEPOSE-POSE PARE-CHOCS AR", 48, "t1", "1", "T", "D"), op("ECHANGE FEU AR D", 18, "t1", "2", "T", "C")],
                paint=[op("PEINTURE PARE-CHOCS AR", 102, "paint")], quote=True),
    "impA": dict(shop="bellevue", number="EST-8102", date=2, incident=6, insurer="ASSURANCE EXEMPLE", expert=None,
                 vehicle=dict(firstRegistration="2019-04-17", vin="DEMO-VIN-0000201", color="BLEU AZUR", colorCode="LH5X", bodyType="BERLINE 5P"),
                 rates=dict(t1=7000, t2=7800, t3=9000, paint=7400, ingredients=3800),
                 parts=[part("BAGUETTE PORTE AV G", 5260, "DEMO-BG-0201")],
                 operations=[op("DEBOSSELAGE PORTE AV G", 84, "t2", "B1", "T"), op("REPARATION AILE AV G", 36, "t1", "B2", "T"),
                             op("DEPOSE-POSE GARNITURE PORTE AV G", 30, "t1", "B3", "S", "D")],
                 paint=[op("PEINTURE PORTE AV G", 108, "paint"), op("PEINTURE AILE AV G", 72, "paint")], quote=True),
    # Archive B : immatriculation absente de l'estimation, couleur et n° de
    # série illisibles, total imprimé qui ne retombe pas sur la somme des
    # lignes — de quoi montrer que l'import signale au lieu d'inventer.
    "impB": dict(shop="moulin", number="2024/1342", date=1, incident=4, insurer=None, expert=None, plate=None,
                 vehicle=dict(firstRegistration="2021-02-25", vin=None, color=None, colorCode=None, bodyType="SUV 5P"),
                 rates=dict(t1=6600, t2=7400, t3=8600, paint=7000, ingredients=3600),
                 parts=[part("FEU AR G", 11420, "DEMO-FE-0202"), part("PARE-CHOCS AR G", 13960, "DEMO-PC-0202"), part("AGRAFES DIVERSES", 540, qty=6)],
                 operations=[op("DEPOSE-POSE PARE-CHOCS AR", 54, "t1", "1", "T", "D"), op("ECHANGE FEU AR G", 18, "t1", "2", "T", "C")],
                 paint=[op("PEINTURE PARE-CHOCS AR", 108, "paint")], quote=False, printed_delta=240),
}


def days_ago(n):
    # Dates absolues, fixées à la génération : elles sont imprimées dans le PDF.
    return (datetime.date.today() - datetime.timedelta(days=n)).isoformat()


def rate_for(scale, rates):
    return {"t2": rates["t2"], "t3": rates["t3"], "paint": rates["paint"]}.get(scale, rates["t1"])


def build_estimate(key, spec, built):
    rates = spec["rates"]
    labor = sum(jsround(o["minutes"] / 60 * rate_for(o["scale"], rates)) for o in spec["operations"])
    paint_labor = sum(jsround(o["minutes"] / 60 * rates["paint"]) for o in spec["paint"])
    paint_hours = sum(o["minutes"] for o in spec["paint"]) / 60
    ingredients = jsround(paint_hours * rates["ingredients"])
    parts_total = sum(p["totalCents"] for p in spec["parts"])
    ht = parts_total + labor + paint_labor + ingredients + spec.get("printed_delta", 0)
    vat = jsround(ht * 0.2)
    hours = {"t1": 0, "t2": 0, "t3": 0}
    for o in spec["operations"]:
        hours[o["scale"]] += o["minutes"] / 60
    shop = SHOPS[spec["shop"]]
    v = built["vehicle"]
    return {
        "bodyshop": shop[0], "documentNumber": spec["number"], "documentDate": days_ago(spec["date"]), "incidentDate": days_ago(spec["incident"]),
        "insurer": spec["insurer"], "expert": spec["expert"],
        "vehicle": {"plate": spec.get("plate", built["plate"]), "make": v["make"].upper(), "model": v["model"].upper(),
                    "mileageKm": v["mileageKm"], **spec["vehicle"]},
        "rates": {"bodyworkT1Cents": rates["t1"], "bodyworkT2Cents": rates["t2"], "bodyworkT3Cents": rates["t3"],
                  "paintCents": rates["paint"], "ingredientsCents": rates["ingredients"]},
        "parts": spec["parts"], "operations": spec["operations"], "paintOperations": spec["paint"],
        "totals": {"laborCents": labor + paint_labor, "partsCents": parts_total, "ingredientsCents": ingredients, "miscCents": 0,
                   "totalHtCents": ht, "vatCents": vat, "totalTtcCents": ht + vat},
        "laborHours": {k: round(h, 2) for k, h in hours.items()}, "paintHours": round(paint_hours, 2),
    }


def euros(cents):
    return f"{cents / 100:,.2f}".replace(",", " ").replace(".", ",") + " €"


def estimate_pdf(key, est, shop):
    p = Page()
    p.watermark("DOCUMENT FICTIF - DÉMONSTRATION")
    y = 800
    p.text(40, y, shop[0], 13, True)
    p.text(40, y - 15, shop[1], 8)
    p.text(40, y - 26, shop[2] + " - données inventées pour la démo HellBoy", 8, gray=0.35)
    p.text(380, y, "ESTIMATION DE TRAVAUX", 12, True)
    p.text(380, y - 15, f"Dossier n° {est['documentNumber']}", 9)
    p.text(380, y - 27, f"Édité le {est['documentDate']}   Sinistre du {est['incidentDate']}", 8, gray=0.35)
    y -= 56
    p.rect(40, y - 62, 515, 66)
    v = est["vehicle"]
    rows = [("Immatriculation", v["plate"] or ""), ("Marque / modèle", f"{v['make']} {v['model']}"),
            ("1re mise en circulation", v["firstRegistration"] or ""), ("N° de série", v["vin"] or ""),
            ("Couleur", " ".join(filter(None, [v["color"], v["colorCode"]]))), ("Kilométrage", f"{v['mileageKm']} km"),
            ("Assureur", est["insurer"] or ""), ("Expert", est["expert"] or "")]
    for i, (k, val) in enumerate(rows):
        x = 48 if i % 2 == 0 else 300
        yy = y - 12 - (i // 2) * 14
        p.text(x, yy, k, 8, gray=0.35)
        p.text(x + 105, yy, val, 9, True)
    y -= 84
    r = est["rates"]
    p.text(40, y, "Taux horaires HT", 10, True)
    y -= 14
    p.text(40, y, f"T1 {euros(r['bodyworkT1Cents'])}   T2 {euros(r['bodyworkT2Cents'])}   T3 {euros(r['bodyworkT3Cents'])}   "
                  f"Peinture {euros(r['paintCents'])}   Ingrédients {euros(r['ingredientsCents'])} / h", 9)
    y -= 26
    p.text(40, y, "Pièces", 10, True)
    y -= 4
    p.line(40, y, 555, y)
    y -= 12
    for hx, h in ((40, "Référence"), (140, "Libellé"), (420, "Qté")):
        p.text(hx, y, h, 8, True)
    p.right(555, y, "Total HT", 8, True)
    for part_ in est["parts"]:
        y -= 13
        p.text(40, y, part_["reference"] or "-", 8)
        p.text(140, y, part_["label"][:52], 8)
        p.text(424, y, str(part_["quantity"]), 8)
        p.right(555, y, euros(part_["totalCents"]), 8)
    y -= 24
    p.text(40, y, "Main-d'œuvre tôlerie", 10, True)
    y -= 4
    p.line(40, y, 555, y)
    y -= 12
    for hx, h in ((40, "Code"), (80, "Libellé"), (330, "Cat"), (360, "Interv"), (420, "T1"), (470, "T2"), (520, "T3")):
        p.text(hx, y, h, 8, True)
    for o in est["operations"]:
        y -= 13
        p.text(40, y, o["code"] or "", 8)
        p.text(80, y, o["label"], 8)
        p.text(334, y, o["category"] or "", 8)
        p.text(368, y, o["intervention"] or "", 8)
        col = {"t1": 420, "t2": 470, "t3": 520}[o["scale"]]
        p.text(col, y, f"{o['minutes'] / 60:.2f}".replace(".", ","), 8)
    y -= 24
    p.text(40, y, "Peinture", 10, True)
    y -= 4
    p.line(40, y, 555, y)
    for o in est["paintOperations"]:
        y -= 13
        p.text(80, y, o["label"], 8)
        p.text(420, y, f"{o['minutes'] / 60:.2f} h".replace(".", ","), 8)
    t = est["totals"]
    y -= 30
    p.line(330, y + 12, 555, y + 12)
    for label, val, bold in (("Main-d'œuvre", t["laborCents"], False), ("Pièces", t["partsCents"], False),
                             ("Ingrédients peinture", t["ingredientsCents"], False), ("TOTAL HT", t["totalHtCents"], True),
                             ("TVA 20 %", t["vatCents"], False), ("TOTAL TTC", t["totalTtcCents"], True)):
        p.text(340, y, label, 9, bold)
        p.right(555, y, euros(val), 9, bold)
        y -= 14
    p.text(40, 40, "Document fictif généré pour la démonstration du projet HellBoy (ypepin.com). Aucune valeur réelle.", 7, gray=0.4)
    name = f"estimation-{key}.pdf"
    data = write_pdf(os.path.join(DOCS, name), [p], f"Estimation {est['documentNumber']} (fictive)")
    return {"kind": "estimate", "fileName": f"ESTIMATION_{est['documentNumber'].replace('/', '-')}.pdf", "file": name,
            "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def quote_pdf(key, est, shop):
    p = Page()
    p.watermark("DOCUMENT FICTIF - DÉMONSTRATION")
    p.text(40, 800, shop[0], 13, True)
    p.text(40, 785, shop[1] + " - " + shop[2], 8)
    p.text(400, 800, "DEVIS", 14, True)
    p.text(400, 785, f"Réf. {est['documentNumber']}-D", 9)
    y = 740
    p.text(40, y, "Pièces de rechange", 10, True)
    y -= 4
    p.line(40, y, 555, y)
    for part_ in est["parts"]:
        y -= 14
        p.text(40, y, part_["reference"] or "-", 9)
        p.text(160, y, part_["label"][:48], 9)
        p.right(555, y, euros(part_["totalCents"]), 9)
    p.text(40, 40, "Document fictif généré pour la démonstration du projet HellBoy (ypepin.com).", 7, gray=0.4)
    name = f"devis-{key}.pdf"
    data = write_pdf(os.path.join(DOCS, name), [p], f"Devis {est['documentNumber']} (fictif)")
    return {"kind": "quote", "fileName": f"DEVIS_{est['documentNumber'].replace('/', '-')}.pdf", "file": name,
            "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def main():
    os.makedirs(PHOTOS, exist_ok=True)
    os.makedirs(DOCS, exist_ok=True)
    for d in (PHOTOS, DOCS):
        for f in os.listdir(d):
            os.remove(os.path.join(d, f))
    out = {}
    for key, spec in CASES.items():
        built = build_case(key, spec)
        if key in ESTIMATES:
            espec = ESTIMATES[key]
            est = build_estimate(key, espec, built)
            shop = SHOPS[espec["shop"]]
            docs = [estimate_pdf(key, est, shop)]
            if espec["quote"]:
                docs.append(quote_pdf(key, est, shop))
            built["estimate"] = est
            built["documents"] = docs
        out[key] = built
        print(key, len(built["photos"]), "photos")
    with open(os.path.join(HERE, "..", "scenes.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    total = sum(os.path.getsize(os.path.join(PHOTOS, f)) for f in os.listdir(PHOTOS))
    total_docs = sum(os.path.getsize(os.path.join(DOCS, f)) for f in os.listdir(DOCS))
    print(f"photos : {len(os.listdir(PHOTOS))} fichiers, {total / 1024:.0f} Ko ; documents : {total_docs / 1024:.0f} Ko")


if __name__ == "__main__":
    random.seed(1)
    main()
