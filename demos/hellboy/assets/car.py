# Rendu de véhicules stylisés pour les photos de la démo HellBoy.
#
# Aucune photo réelle n'est utilisée : les archives garage du vrai projet
# contiennent plaques, numéros de série et noms. Ces images sont dessinées
# de toutes pièces (silhouette de profil déformée en perspective, face avant ou
# arrière rapportée), avec des dégâts dessinés dont on connaît la position
# exacte, ce qui donne des boîtes englobantes justes.
import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SS = 2  # suréchantillonnage, pour des contours lissés à la réduction
FLANK_W, FLANK_H = 1000, 420
OUT_W, OUT_H = 800, 600
HORIZON = 335


def s(v):
    return int(round(v * SS))


def pts(points):
    return [(x * SS, y * SS) for x, y in points]


def shade(rgb, k):
    """Éclaircit (k > 0) ou assombrit (k < 0) une couleur."""
    if k >= 0:
        return tuple(int(c + (255 - c) * k) for c in rgb)
    return tuple(int(c * (1 + k)) for c in rgb)


# ── Silhouettes ─────────────────────────────────────────────────────────────
# Coordonnées « logiques » sur une toile de 1000 × 420, véhicule tourné vers la
# gauche, sol à y = 400.

BODIES = {
    "hatch": dict(
        wheels=(200, 760), r=58,
        outline=[(48, 372), (30, 330), (34, 292), (60, 262), (300, 232), (430, 150), (720, 144),
                 (862, 172), (935, 250), (948, 312), (930, 372)],
        glass=[(318, 229), (440, 160), (712, 155), (840, 178), (868, 226)],
        pillars=(575, 800), doors=(318, 575, 790),
        keys=dict(noseTop=(60, 262), noseBottom=(48, 372), hoodRear=(300, 232), roofFront=(430, 150),
                  roofRear=(720, 144), deckFront=(862, 172), tailTop=(935, 250), tailBottom=(930, 372)),
        head=[(36, 292), (62, 265), (122, 258), (106, 287)],
        tail=[(902, 232), (936, 254), (944, 284), (906, 274)],
    ),
    "sedan": dict(
        wheels=(205, 775), r=58,
        outline=[(48, 372), (30, 330), (34, 292), (60, 262), (310, 230), (445, 152), (680, 148),
                 (822, 200), (932, 208), (950, 250), (952, 312), (932, 372)],
        glass=[(328, 228), (452, 162), (672, 158), (796, 204), (330, 228)],
        pillars=(585, None), doors=(328, 585, 800),
        keys=dict(noseTop=(60, 262), noseBottom=(48, 372), hoodRear=(310, 230), roofFront=(445, 152),
                  roofRear=(680, 148), deckFront=(822, 200), tailTop=(932, 208), tailBottom=(932, 372)),
        head=[(36, 292), (62, 265), (124, 258), (108, 287)],
        tail=[(912, 214), (946, 222), (950, 258), (912, 252)],
    ),
    "suv": dict(
        wheels=(210, 770), r=66,
        outline=[(52, 360), (30, 318), (34, 270), (66, 240), (300, 214), (420, 116), (760, 110),
                 (900, 128), (944, 220), (952, 300), (934, 360)],
        glass=[(320, 212), (432, 126), (750, 121), (880, 136), (912, 206)],
        pillars=(585, 815), doors=(320, 585, 805),
        keys=dict(noseTop=(66, 240), noseBottom=(52, 360), hoodRear=(300, 214), roofFront=(420, 116),
                  roofRear=(760, 110), deckFront=(900, 128), tailTop=(944, 220), tailBottom=(934, 360)),
        head=[(38, 270), (68, 243), (132, 236), (116, 266)],
        tail=[(914, 200), (946, 214), (950, 262), (918, 250)],
    ),
    "van": dict(
        wheels=(190, 790), r=58,
        outline=[(48, 372), (30, 330), (34, 290), (58, 258), (220, 226), (330, 108), (930, 104),
                 (948, 150), (950, 312), (932, 372)],
        glass=[(238, 224), (340, 120), (520, 118), (520, 222)],
        pillars=(None, None), doors=(238, 520, 940),
        keys=dict(noseTop=(58, 258), noseBottom=(48, 372), hoodRear=(220, 226), roofFront=(330, 108),
                  roofRear=(930, 104), deckFront=(944, 130), tailTop=(948, 150), tailBottom=(932, 372)),
        head=[(36, 290), (60, 262), (118, 256), (102, 286)],
        tail=[(926, 160), (948, 160), (950, 250), (928, 250)],
    ),
}

GLASS = (38, 48, 60)
TRIM = (28, 30, 34)


def body_mask(body):
    m = Image.new("L", (s(FLANK_W), s(FLANK_H)), 0)
    ImageDraw.Draw(m).polygon(pts(body["outline"]), fill=255)
    return m


def draw_flank(color, kind, damages=()):
    """Profil gauche du véhicule (tourné vers la gauche), sur fond transparent."""
    body = BODIES[kind]
    W, H = s(FLANK_W), s(FLANK_H)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    mask = body_mask(body)

    # Carrosserie : dégradé vertical (reflet du ciel en haut, ombre en bas).
    grad = Image.new("RGB", (W, H))
    gd = ImageDraw.Draw(grad)
    for y in range(H):
        t = y / H
        k = 0.22 - 0.55 * t if t < 0.75 else 0.22 - 0.55 * 0.75 - 0.4 * (t - 0.75)
        gd.line([(0, y), (W, y)], fill=shade(color, max(-0.6, min(0.4, k))))
    img.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(img)
    r = body["r"]
    # Passages de roue, limités à la carrosserie.
    arches = Image.new("L", (W, H), 0)
    ad = ImageDraw.Draw(arches)
    for wx in body["wheels"]:
        cy = 400 - r
        ad.ellipse([s(wx - r - 11), s(cy - r - 11), s(wx + r + 11), s(cy + r + 11)], fill=255)
    arches = Image.composite(arches, Image.new("L", (W, H), 0), mask)
    img.paste(Image.new("RGBA", (W, H), (16, 16, 18, 255)), (0, 0), arches)

    # Vitrage, avec un reflet en diagonale.
    glass = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glass).polygon(pts(body["glass"]), fill=255)
    gimg = Image.new("RGBA", (W, H), GLASS + (255,))
    gdraw = ImageDraw.Draw(gimg)
    gx0 = body["glass"][0][0]
    gdraw.polygon(pts([(gx0 + 120, 120), (gx0 + 200, 120), (gx0 + 120, 240), (gx0 + 40, 240)]), fill=(92, 108, 124, 255))
    gdraw.polygon(pts([(gx0 + 230, 120), (gx0 + 260, 120), (gx0 + 180, 240), (gx0 + 150, 240)]), fill=(70, 84, 98, 255))
    img.paste(gimg, (0, 0), glass)
    for px in body["pillars"]:
        if px is None:
            continue
        d.rectangle([s(px - 8), s(100), s(px + 8), s(236)], fill=TRIM + (255,))
    # Le montant ne doit pas déborder du vitrage : on recoupe par la carrosserie.
    clip = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    clip.paste(img, (0, 0), mask)
    img = clip
    d = ImageDraw.Draw(img)

    # Lignes de portes, poignées, nervure de caisse.
    line_col = shade(color, -0.45) + (255,)
    for x in body["doors"]:
        d.line([(s(x), s(232)), (s(x - 4), s(300)), (s(x + 2), s(362))], fill=line_col, width=s(1.6))
    for a, b in zip(body["doors"], body["doors"][1:]):
        hx = b - 60
        d.rounded_rectangle([s(hx), s(258), s(hx + 34), s(266)], radius=s(3), fill=shade(color, -0.3) + (255,))
    x0, x1 = body["outline"][3][0] + 10, body["outline"][-3][0] - 10
    d.line([(s(x0), s(272)), (s(x1), s(264))], fill=shade(color, 0.35) + (255,), width=s(1.4))
    d.line([(s(x0 + 40), s(305)), (s(x1 - 20), s(300))], fill=shade(color, -0.25) + (255,), width=s(1.2))
    # Bas de caisse et boucliers en plastique brut.
    w0, w1 = body["wheels"]
    d.rectangle([s(w0 + r + 10), s(352), s(w1 - r - 10), s(366)], fill=TRIM + (255,))
    d.polygon(pts([(30, 340), (120, 344), (124, 368), (48, 372)]), fill=TRIM + (255,))

    # Optiques.
    d.polygon(pts(body["head"]), fill=(226, 232, 238, 255), outline=(60, 64, 70, 255))
    hx = sum(p[0] for p in body["head"]) / 4
    hy = sum(p[1] for p in body["head"]) / 4
    d.ellipse([s(hx - 9), s(hy - 7), s(hx + 9), s(hy + 7)], fill=(250, 250, 236, 255))
    d.polygon(pts(body["tail"]), fill=(170, 18, 28, 255), outline=(70, 10, 14, 255))

    # Rétroviseur.
    gx, gy = body["glass"][0]
    d.polygon(pts([(gx + 4, gy - 10), (gx + 36, gy - 14), (gx + 40, gy + 6), (gx + 8, gy + 10)]),
              fill=shade(color, -0.1) + (255,), outline=shade(color, -0.5) + (255,))

    # Roues : pneu, jante, rayons.
    for wx in body["wheels"]:
        cy = 400 - r
        d.ellipse([s(wx - r), s(cy - r), s(wx + r), s(cy + r)], fill=(22, 22, 24, 255))
        rr = r * 0.62
        d.ellipse([s(wx - rr), s(cy - rr), s(wx + rr), s(cy + rr)], fill=(150, 154, 160, 255))
        for k in range(5):
            a = k * 2 * math.pi / 5 + 0.3
            d.line([(s(wx), s(cy)), (s(wx + math.cos(a) * rr * 0.92), s(cy + math.sin(a) * rr * 0.92))],
                   fill=(96, 100, 106, 255), width=s(7))
        d.ellipse([s(wx - 9), s(cy - 9), s(wx + 9), s(cy + 9)], fill=(70, 72, 76, 255))

    for dmg in damages:
        draw_damage(img, dmg, color)
    return img


def draw_fascia(color, face, damages=()):
    """Bouclier avant ou arrière vu de face (toile 420 × 120), plaque vierge."""
    W, H = s(420), s(120)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    grad_top, grad_bot = shade(color, 0.15), shade(color, -0.35)
    for y in range(H):
        t = y / H
        c = tuple(int(a + (b - a) * t) for a, b in zip(grad_top, grad_bot))
        d.line([(0, y), (W, y)], fill=c + (255,))
    # Plastique bas de bouclier.
    d.rectangle([0, s(98), W, H], fill=TRIM + (255,))
    if face == "front":
        d.polygon(pts([(18, 10), (120, 16), (110, 44), (24, 40)]), fill=(226, 232, 238, 255), outline=(60, 64, 70, 255))
        d.polygon(pts([(402, 10), (300, 16), (310, 44), (396, 40)]), fill=(226, 232, 238, 255), outline=(60, 64, 70, 255))
        d.ellipse(pts([(52, 18), (78, 36)]), fill=(250, 250, 236, 255))
        d.ellipse(pts([(342, 18), (368, 36)]), fill=(250, 250, 236, 255))
        d.polygon(pts([(132, 18), (288, 18), (276, 52), (144, 52)]), fill=TRIM + (255,))
        for gy in range(24, 52, 7):
            d.line(pts([(140, gy), (280, gy)]), fill=(70, 72, 78, 255), width=s(1.2))
        d.ellipse(pts([(200, 27), (220, 43)]), fill=(190, 194, 200, 255))
        d.rectangle(pts([(120, 80), (300, 96)]), fill=TRIM + (255,))
        d.ellipse(pts([(40, 74), (62, 90)]), fill=(210, 214, 200, 255))
        d.ellipse(pts([(358, 74), (380, 90)]), fill=(210, 214, 200, 255))
    else:
        d.polygon(pts([(10, 6), (110, 10), (104, 40), (14, 36)]), fill=(170, 18, 28, 255), outline=(70, 10, 14, 255))
        d.polygon(pts([(410, 6), (310, 10), (316, 40), (406, 36)]), fill=(170, 18, 28, 255), outline=(70, 10, 14, 255))
        d.rectangle(pts([(130, 18), (290, 22)]), fill=shade(color, 0.3) + (255,))
        d.rectangle(pts([(30, 100), (60, 106)]), fill=(150, 20, 24, 255))
        d.rectangle(pts([(360, 100), (390, 106)]), fill=(150, 20, 24, 255))
    # Plaque vierge (fond blanc, bandeau bleu) : aucune immatriculation lisible.
    d.rectangle(pts([(160, 58), (260, 80)]), fill=(240, 240, 236, 255), outline=(40, 40, 40, 255))
    d.rectangle(pts([(160, 58), (170, 80)]), fill=(30, 60, 160, 255))
    for dmg in damages:
        draw_damage(img, dmg, color)
    return img


# ── Dégâts ──────────────────────────────────────────────────────────────────

def draw_damage(img, dmg, color):
    kind, (x0, y0, x1, y1) = dmg["type"], dmg["rect"]
    rnd = random.Random(dmg.get("seed", 1))
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if kind in ("scratch", "paint_chip"):
        n = 9 if kind == "scratch" else 22
        for _ in range(n):
            if kind == "scratch":
                ax, ay = rnd.uniform(x0, x0 + (x1 - x0) * 0.4), rnd.uniform(y0, y1)
                bx, by = rnd.uniform(x0 + (x1 - x0) * 0.6, x1), ay + rnd.uniform(-(y1 - y0) * 0.5, (y1 - y0) * 0.5)
                by = min(max(by, y0), y1)
                d.line([(s(ax), s(ay)), (s(bx), s(by))], fill=(236, 236, 232, 230), width=s(rnd.uniform(0.8, 1.8)))
                d.line([(s(ax), s(ay + 1.5)), (s(bx), s(by + 1.5))], fill=shade(color, -0.5) + (120,), width=s(0.8))
            else:
                cx, cy = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
                rr = rnd.uniform(1.5, 4.5)
                d.ellipse([s(cx - rr), s(cy - rr * 0.8), s(cx + rr), s(cy + rr * 0.8)], fill=(214, 214, 210, 235))
    elif kind in ("dent", "hail_damage", "structural_deformation"):
        spots = 1 if kind != "hail_damage" else 10
        for _ in range(spots):
            if spots == 1:
                cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
            else:
                cx, cy = rnd.uniform(x0 + 6, x1 - 6), rnd.uniform(y0 + 6, y1 - 6)
                rx = ry = rnd.uniform(4, 7)
            # Creux : ombre portée côté lumière, reflet écrasé de l'autre côté.
            d.ellipse([s(cx - rx * 0.9), s(cy - ry * 0.55), s(cx + rx * 0.9), s(cy + ry)], fill=shade(color, -0.45) + (95,))
            d.ellipse([s(cx - rx * 0.6), s(cy - ry * 0.9), s(cx + rx * 0.3), s(cy - ry * 0.2)], fill=shade(color, -0.6) + (110,))
            d.ellipse([s(cx - rx * 0.1), s(cy + ry * 0.05), s(cx + rx * 0.75), s(cy + ry * 0.7)], fill=shade(color, 0.5) + (80,))
            d.arc([s(cx - rx), s(cy - ry), s(cx + rx), s(cy + ry)], 20, 160, fill=shade(color, 0.6) + (120,), width=s(1.5))
        layer = layer.filter(ImageFilter.GaussianBlur(s(3)))
        if kind == "structural_deformation":
            d = ImageDraw.Draw(layer)
            d.line([(s(x0 + 4), s(y0 + (y1 - y0) * 0.3)), (s((x0 + x1) / 2), s(y1 - 4)), (s(x1 - 4), s(y0 + 6))],
                   fill=(20, 20, 20, 210), width=s(2.5))
    elif kind == "tear":
        x = x0
        prev = (x0, (y0 + y1) / 2)
        while x < x1:
            x += rnd.uniform(4, 9)
            p = (min(x, x1), rnd.uniform(y0 + 2, y1 - 2))
            d.line([(s(prev[0]), s(prev[1])), (s(p[0]), s(p[1]))], fill=(14, 14, 14, 255), width=s(3))
            d.line([(s(prev[0]), s(prev[1] - 2.5)), (s(p[0]), s(p[1] - 2.5))], fill=(236, 236, 232, 200), width=s(1))
            prev = p
    elif kind in ("broken_light", "glass_crack", "broken_glass"):
        cx, cy = rnd.uniform(x0 + (x1 - x0) * 0.35, x0 + (x1 - x0) * 0.65), (y0 + y1) / 2
        for k in range(9):
            a = k * 2 * math.pi / 9 + rnd.uniform(-0.2, 0.2)
            L = rnd.uniform(0.5, 1.0) * max(x1 - x0, y1 - y0) / 2
            mx, my = cx + math.cos(a) * L * 0.5 + rnd.uniform(-2, 2), cy + math.sin(a) * L * 0.5
            ex, ey = cx + math.cos(a) * L, cy + math.sin(a) * L
            ex, ey = min(max(ex, x0), x1), min(max(ey, y0), y1)
            d.line([(s(cx), s(cy)), (s(mx), s(my)), (s(ex), s(ey))], fill=(30, 30, 30, 230), width=s(1.3))
        d.ellipse([s(cx - 4), s(cy - 4), s(cx + 4), s(cy + 4)], fill=(20, 20, 20, 240))
        if kind == "broken_light":
            d.polygon(pts([(cx + 2, cy - 3), (cx + 12, cy - 8), (cx + 9, cy + 6)]), fill=(18, 18, 20, 255))
    elif kind == "missing_part":
        d.rectangle([s(x0), s(y0), s(x1), s(y1)], fill=(16, 16, 18, 255))
        for k in range(4):
            yy = y0 + (k + 1) * (y1 - y0) / 5
            d.line([(s(x0), s(yy)), (s(x1), s(yy + 2))], fill=(60, 62, 66, 255), width=s(1))
    elif kind == "corrosion":
        for _ in range(40):
            cx, cy = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
            rr = rnd.uniform(1.5, 4)
            d.ellipse([s(cx - rr), s(cy - rr), s(cx + rr), s(cy + rr)], fill=(140, 70, 30, 200))
    img.alpha_composite(layer)


# ── Perspective ─────────────────────────────────────────────────────────────

def homography(src, dst):
    """Matrice 3×3 envoyant les 4 points `src` sur les 4 points `dst`."""
    A, b = [], []
    for (x, y), (u, v) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        b += [u, v]
    h = np.linalg.solve(np.array(A, float), np.array(b, float))
    return np.append(h, 1).reshape(3, 3)


def apply_h(H, p):
    x, y = p
    v = H @ np.array([x, y, 1.0])
    return (v[0] / v[2], v[1] / v[2])


def warp(src_img, src_quad, dst_quad, size):
    """Déforme `src_img` (coordonnées logiques) sur le quadrilatère `dst_quad` de la sortie."""
    inv = homography([(x * SS, y * SS) for x, y in dst_quad], [(x * SS, y * SS) for x, y in src_quad])
    coeffs = (inv / inv[2, 2]).flatten()[:8]
    return src_img.transform((s(size[0]), s(size[1])), Image.PERSPECTIVE, tuple(coeffs), Image.BICUBIC)


def background(seed, tone):
    W, H = s(OUT_W), s(OUT_H)
    rnd = random.Random(seed)
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    wall_top, wall_bot = shade(tone, 0.25), shade(tone, -0.05)
    for y in range(s(HORIZON)):
        t = y / s(HORIZON)
        d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(wall_top, wall_bot)))
    # Bardage de l'atelier : quelques joints verticaux.
    for x in range(rnd.randint(0, 60), OUT_W, 160):
        d.line([(s(x), 0), (s(x), s(HORIZON))], fill=shade(tone, -0.12), width=s(2))
    ground_top, ground_bot = (118, 118, 116), (84, 84, 84)
    for y in range(s(HORIZON), H):
        t = (y - s(HORIZON)) / (H - s(HORIZON))
        d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(ground_top, ground_bot)))
    d.line([(0, s(HORIZON)), (W, s(HORIZON))], fill=(70, 70, 70), width=s(3))
    return img.convert("RGBA")


def shadow(img, poly):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).polygon(pts(poly), fill=(0, 0, 0, 120))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(s(14))))


def toward(p, vp, t):
    return (p[0] + (vp[0] - p[0]) * t, p[1] + (vp[1] - p[1]) * t)


def plane(img, quad, fill):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).polygon(pts(quad), fill=fill)
    img.alpha_composite(layer)


def three_quarter(car, end, flank_damages=(), fascia_damages=(), seed=1):
    """Vue 3/4 côté gauche : `end` = "front" (avant gauche) ou "rear" (arrière gauche).

    Le profil est déformé en perspective et la face (bouclier, capot ou hayon)
    rapportée au bout le plus proche. Renvoie l'image et la fonction qui envoie
    un point du profil (ou du bouclier) sur l'image, pour placer les boîtes.
    """
    color, kind = car["color"], car["kind"]
    body = BODIES[kind]
    keys = body["keys"]
    img = background(seed, car.get("wall", (196, 192, 184)))
    flank = draw_flank(color, kind, flank_damages)
    fascia = draw_fascia(color, end, fascia_damages)

    src = [(0, 0), (FLANK_W, 0), (FLANK_W, FLANK_H), (0, FLANK_H)]
    if end == "front":
        dst = [(250, 95), (730, 175), (730, 450), (250, 505)]
        vp = (-900, HORIZON)
    else:
        dst = [(70, 175), (550, 95), (550, 505), (70, 450)]
        vp = (1700, HORIZON)
    Hf = homography(src, dst)
    fmap = lambda p: apply_h(Hf, p)

    def across(p):
        """Point symétrique de l'autre côté du véhicule (vers le point de fuite latéral)."""
        q = fmap(p)
        near_h = fmap((0 if end == "front" else FLANK_W, FLANK_H))[1] - fmap((0 if end == "front" else FLANK_W, 0))[1]
        loc_h = fmap((p[0], FLANK_H))[1] - fmap((p[0], 0))[1]
        dist0 = abs(fmap((0 if end == "front" else FLANK_W, 0))[0] - vp[0])
        t = 0.15 * (loc_h / near_h) * (dist0 / abs(q[0] - vp[0]))
        return toward(q, vp, t)

    w0, w1 = body["wheels"]
    shadow(img, [fmap((w0 - 120, 402)), fmap((w1 + 140, 402)), across((w1 + 140, 402)), across((w0 - 120, 402))])
    img.alpha_composite(warp(flank, src, dst, (OUT_W, OUT_H)))

    if end == "front":
        top, bottom, mid, upper = keys["noseTop"], keys["noseBottom"], keys["hoodRear"], keys["roofFront"]
    else:
        top, bottom, mid, upper = keys["tailTop"], keys["tailBottom"], keys["deckFront"], keys["roofRear"]
    # Pare-brise ou lunette, puis capot ou malle, puis bouclier.
    plane(img, [fmap(mid), fmap(upper), across(upper), across(mid)], GLASS + (255,))
    refl = [toward(fmap(mid), across(mid), 0.35), toward(fmap(upper), across(upper), 0.5),
            toward(fmap(upper), across(upper), 0.62), toward(fmap(mid), across(mid), 0.5)]
    plane(img, refl, (88, 104, 120, 255))
    plane(img, [fmap(top), fmap(mid), across(mid), across(top)], shade(color, 0.28) + (255,))
    fsrc = [(0, 0), (420, 0), (420, 120), (0, 120)]
    if end == "front":
        fdst = [across(top), fmap(top), fmap(bottom), across(bottom)]
    else:
        fdst = [fmap(top), across(top), across(bottom), fmap(bottom)]
    img.alpha_composite(warp(fascia, fsrc, fdst, (OUT_W, OUT_H)))
    Hs = homography(fsrc, fdst)
    smap = lambda p: apply_h(Hs, p)
    return img, fmap, smap


def finish(img, mirror=False, blur=0.5):
    out = img.convert("RGB").resize((OUT_W, OUT_H), Image.LANCZOS)
    if mirror:
        out = out.transpose(Image.FLIP_LEFT_RIGHT)
    return out.filter(ImageFilter.GaussianBlur(blur)) if blur else out


def bbox_of(mapper, rect, mirror=False, pad=6):
    x0, y0, x1, y1 = rect
    corners = [mapper((x0, y0)), mapper((x1, y0)), mapper((x1, y1)), mapper((x0, y1))]
    xs = [c[0] for c in corners]
    ys = [c[1] for c in corners]
    bx0, bx1 = max(0, min(xs) - pad), min(OUT_W, max(xs) + pad)
    by0, by1 = max(0, min(ys) - pad), min(OUT_H, max(ys) + pad)
    if mirror:
        bx0, bx1 = OUT_W - bx1, OUT_W - bx0
    return (bx0 / OUT_W, by0 / OUT_H, (bx1 - bx0) / OUT_W, (by1 - by0) / OUT_H)
