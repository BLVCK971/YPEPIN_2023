# Écriture minimale de PDF texte (Helvetica, encodage WinAnsi) pour les
# estimations et devis fictifs de la démo : quelques Ko par document, texte
# sélectionnable, sans dépendance.


def _esc(text):
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


class Page:
    def __init__(self):
        self.ops = []

    def text(self, x, y, txt, size=9, bold=False, gray=0.0):
        font = "F2" if bold else "F1"
        self.ops.append(f"BT {gray:.2f} g /{font} {size} Tf {x:.1f} {y:.1f} Td ({_esc(txt)}) Tj ET")

    def right(self, x, y, txt, size=9, bold=False):
        # Largeur approchée (Helvetica ≈ 0,5 em par caractère, chiffres 0,556).
        w = sum(0.556 if c.isdigit() else 0.5 for c in txt) * size
        self.text(x - w, y, txt, size, bold)

    def line(self, x0, y0, x1, y1, width=0.5, gray=0.0):
        self.ops.append(f"{gray:.2f} G {width} w {x0:.1f} {y0:.1f} m {x1:.1f} {y1:.1f} l S")

    def rect(self, x, y, w, h, gray=0.92):
        self.ops.append(f"{gray:.2f} g {x:.1f} {y:.1f} {w:.1f} {h:.1f} re f 0 g")

    def watermark(self, txt):
        # Texte en diagonale (matrice de rotation de 35°), gris très clair.
        self.ops.append(
            f"BT 0.88 g /F2 34 Tf 0.819 0.574 -0.574 0.819 90 220 Tm ({_esc(txt)}) Tj ET"
        )


def write_pdf(path, pages, title):
    objs = []

    def add(body):
        objs.append(body)
        return len(objs)

    font1 = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    font2 = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
    pages_id = len(objs) + 1
    objs.append(None)  # réservé pour /Pages
    kids = []
    for page in pages:
        stream = "\n".join(page.ops).encode("cp1252")
        content = add(b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream")
        kids.append(add(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 595 842] "
            f"/Resources << /Font << /F1 {font1} 0 R /F2 {font2} 0 R >> >> /Contents {content} 0 R >>".encode()
        ))
    objs[pages_id - 1] = f"<< /Type /Pages /Kids [{' '.join(f'{k} 0 R' for k in kids)}] /Count {len(kids)} >>".encode()
    info = add(b"<< /Title (" + _esc(title).encode("cp1252") + b") /Producer (Demo HellBoy - document fictif) >>")
    catalog = add(f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode())

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for i, body in enumerate(objs, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objs) + 1} /Root {catalog} 0 R /Info {info} 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    with open(path, "wb") as f:
        f.write(out)
    return bytes(out)
