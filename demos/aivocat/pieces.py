"""Génère les PDF d'exemple de la démo Aivocat à partir de pieces.json.

Le même JSON sert au mock (data.ts) : les extraits cités par les réponses de
démo y sont vérifiés mot pour mot, et « Ouvrir, page N » ouvre ces PDF à la
bonne page. Pièces entièrement fictives, marquées comme telles en pied de page.

    python demos/aivocat/pieces.py      # PyMuPDF (fitz) et Pillow requis

Sortie : demos/aivocat/public/pieces/<jeu>/<fichier>.pdf. Polices de base PDF
(Times) non embarquées : quelques Ko par pièce. Les pièces « scan » sont
rastérisées en niveaux de gris, légèrement penchées, comme un vrai scan qui
passe par l'OCR.
"""

from __future__ import annotations

import io
import json
import random
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
OUT = HERE / "public" / "pieces"
W, H = 595, 842  # A4 en points
MARGIN = 72
BODY = 11
FOOTER = "Pièce fictive créée pour la démonstration d'Aivocat"


def wrap(text: str, font: str, size: float, width: float) -> list[str]:
    lines: list[str] = []
    current = ""
    for word in text.split(" "):
        trial = f"{current} {word}".strip()
        if fitz.get_text_length(trial, fontname=font, fontsize=size) <= width or not current:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def render_page(page: fitz.Page, blocks: list[str], number: int, total: int) -> None:
    y = MARGIN
    width = W - 2 * MARGIN

    def line(text: str, font: str, size: float, align: str = "left", gap: float = 1.35) -> None:
        nonlocal y
        for chunk in wrap(text, font, size, width if align != "block" else width * 0.45):
            length = fitz.get_text_length(chunk, fontname=font, fontsize=size)
            if align == "block":  # bloc adresse du destinataire, calé à droite
                x = W * 0.55
            else:
                x = MARGIN if align == "left" else (W - MARGIN - length if align == "right" else (W - length) / 2)
            page.insert_text((x, y + size), chunk, fontname=font, fontsize=size)
            y += size * gap

    for block in blocks:
        for ch in block:
            ch.encode("latin-1")  # polices de base : Latin-1 seulement (ni €, ni ’, ni œ)
        if block == "":
            y += BODY * 0.9
        elif block.startswith("#T "):
            line(block[3:], "tibo", 14, "center")
            y += 4
        elif block.startswith("#C "):
            line(block[3:], "tiit", 10, "center")
        elif block.startswith("#H "):
            y += 6
            line(block[3:], "tibo", BODY)
            y += 2
        elif block.startswith("#L "):
            line(block[3:], "tiro", BODY, gap=1.25)
        elif block.startswith("#R "):
            line(block[3:], "tiro", BODY, "right", gap=1.25)
        elif block.startswith("#A "):
            line(block[3:], "tiro", BODY, "block", gap=1.25)
        elif block.startswith("#B "):
            line(block[3:], "tibo", BODY, gap=1.3)
        elif block.startswith("#P "):
            left, right = block[3:].split("|")
            page.insert_text((MARGIN, y + BODY), left, fontname="tiit", fontsize=10)
            rl = fitz.get_text_length(right, fontname="tiit", fontsize=10)
            page.insert_text((W - MARGIN - rl, y + BODY), right, fontname="tiit", fontsize=10)
            y += BODY * 1.6
        else:
            line(block, "tiro", BODY)
            y += 5
    foot = f"{FOOTER} - page {number}/{total}"
    fl = fitz.get_text_length(foot, fontname="tiit", fontsize=8)
    page.insert_text(((W - fl) / 2, H - 36), foot, fontname="tiit", fontsize=8, color=(0.45, 0.45, 0.45))


def as_scan(doc: fitz.Document, seed: int) -> fitz.Document:
    """Chaque page devient une image en niveaux de gris, un peu penchée et
    bruitée : l'aspect d'une pièce scannée, que le vrai produit lit par OCR."""
    rnd = random.Random(seed)
    out = fitz.open()
    for page in doc:
        pix = page.get_pixmap(dpi=110, colorspace=fitz.csGRAY)
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("L")
        img = img.rotate(rnd.uniform(-0.8, 0.8), resample=Image.BICUBIC, expand=False, fillcolor=246)
        img = img.filter(ImageFilter.GaussianBlur(0.45))
        # Fond légèrement grisé, comme une photocopie.
        img = img.point(lambda v: int(18 + v * 0.9))
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=48, optimize=True)
        new = out.new_page(width=W, height=H)
        new.insert_image(new.rect, stream=buf.getvalue())
    return out


def main() -> None:
    data = json.loads((HERE / "pieces.json").read_text(encoding="utf-8"))
    total_size = 0
    for jeu, pieces in data.items():
        (OUT / jeu).mkdir(parents=True, exist_ok=True)
        for index, (name, piece) in enumerate(pieces.items()):
            doc = fitz.open()
            pages = piece["pages"]
            for n, blocks in enumerate(pages, start=1):
                render_page(doc.new_page(width=W, height=H), blocks, n, len(pages))
            if piece.get("scan"):
                doc = as_scan(doc, seed=index + 7)
            doc.set_metadata({"title": name, "author": "Démo Aivocat (pièce fictive)", "creator": "pieces.py"})
            target = OUT / jeu / name
            doc.save(target, garbage=4, deflate=True)
            total_size += target.stat().st_size
            print(f"{target.relative_to(HERE)}  {target.stat().st_size // 1024} Ko")
    print(f"Total : {total_size // 1024} Ko")


if __name__ == "__main__":
    main()
