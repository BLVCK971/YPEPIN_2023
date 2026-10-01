"""Génère un compte rendu Word d'exemple par client de la démo ARC GR, avec le
vrai moteur du backend (app/report.py, importé en lecture seule) appliqué au
jeu de données fictif de demos/arc-gr/data.ts (exporté en JSON par gen-seed.mjs).

    node demos/arc-gr/outils/gen-seed.mjs <tmp>
    python demos/arc-gr/outils/gen-rapports.py <tmp>/seed.json demos/arc-gr/rapports <tmp>

Dépôt ARC_GR voisin par défaut, ou variable ARC_GR_DIR. Python avec les
dépendances du backend ARC_GR (python-docx, Pillow...)."""
import json, os, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace as NS

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(os.environ.get("ARC_GR_DIR", Path(__file__).resolve().parents[4] / "ARC_GR")) / "backend"))
from PIL import Image  # noqa: E402
import app.report as report  # noqa: E402
from app.models import DossierStatus  # noqa: E402
from app.tz import local_date, local_today  # noqa: E402

seed_path, out_dir, scratch = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)

# Logo allégé (le PNG d'origine fait 160 Ko, répété dans chaque document).
logo = Image.open(report._LOGO_PATH)
logo.thumbnail((480, 480))
small = scratch / "logo-small.png"
logo.quantize(colors=48, method=Image.Quantize.FASTOCTREE).save(small, optimize=True)
report._LOGO_PATH = small

def dt(iso):
    return datetime.fromisoformat(iso.replace("Z", "+00:00")) if iso else None

db = json.loads(seed_path.read_text(encoding="utf-8"))
end = local_today()
start = end - timedelta(days=29)
for c in db["clients"]:
    if c["deleted_at"]:
        continue
    client = NS(company_name=c["company_name"], contact_name=c["contact_name"], commission_rate=c["commission_rate"])
    dossiers = [
        NS(debtor_name=d["debtor_name"], amount=d["amount"], status=DossierStatus(d["status"]),
           settled_at=dt(d["settled_at"]), created_at=dt(d["created_at"]))
        for d in db["dossiers"] if d["client_id"] == c["id"] and not d["deleted_at"]
    ]
    ids = {d["id"] for d in db["dossiers"] if d["client_id"] == c["id"] and not d["deleted_at"]}
    events = [e for e in db["events"] if e["dossier_id"] in ids and start <= local_date(dt(e["created_at"])) <= end]
    recovered = sum(d.amount for d in dossiers if d.settled_at and start <= local_date(d.settled_at) <= end)
    new = sum(1 for d in dossiers if start <= local_date(d.created_at) <= end)
    data = report.ReportData(client=client, start=start, end=end, dossiers=dossiers, events=events,
                             recovered_this_period=recovered, new_this_period=new, show_commission=True, comment=None)
    (out_dir / f"{c['id']}.docx").write_bytes(report.render_report_docx(data))
    print(c["id"], len(dossiers), len(events), recovered)
