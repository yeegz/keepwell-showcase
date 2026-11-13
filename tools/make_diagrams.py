"""Draws the showcase diagrams in the Datum style: one ink colour, signal yellow, hatching, datum lines.
Light and dark files for each. The Keepwell typefaces are embedded (OFL 1.1) when the product repo's
font files are present, so the drawings render in the real faces on GitHub.
Usage: python3 -I tools/make_diagrams.py
"""
import base64
import html
import os
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
DEST = HERE.parent / "assets" / "diagrams"
FONTS = pathlib.Path(os.environ.get("KEEPWELL_FONTS", pathlib.Path.home() / "Documents/MendGrid/design/fonts/dist"))
THEMES = {
    "light": dict(bg="#F2F0EA", sheet="#FAF9F6", ink="#141518", ink2="#4A4943", ink3="#64625B", line="#D2CFC6", sig="#F5C518", on_sig="#141518"),
    "dark": dict(bg="#0B0C0F", sheet="#121317", ink="#ECEAE4", ink2="#A8A69E", ink3="#8A887F", line="#34363C", sig="#F5C518", on_sig="#141518"),
}
SANS = "KS, 'Helvetica Neue', Arial, sans-serif"
MONO = "KM, Menlo, Consolas, monospace"


def font_css():
    css = ""
    for fam, f in (("KS", "KeepwellSans[wght].woff2"), ("KM", "KeepwellMono[wght].woff2")):
        p = FONTS / f
        if p.exists():
            b64 = base64.b64encode(p.read_bytes()).decode()
            css += f"@font-face{{font-family:{fam};src:url(data:font/woff2;base64,{b64}) format('woff2');font-weight:400 700}}"
    return css


class D:
    def __init__(self, w, h, t, title):
        self.w, self.h, self.t, self.title, self.o = w, h, t, title, []

    def add(self, s):
        self.o.append(s)

    def text(self, x, y, s, size=15, weight=400, color=None, mono=False, anchor="start"):
        c = color or self.t["ink"]
        fam = MONO if mono else SANS
        self.add(f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" font-weight="{weight}" fill="{c}" text-anchor="{anchor}">{html.escape(s)}</text>')

    def box(self, x, y, w, h, title, lines=(), fill=None, hl=False, dashed=False, code=None):
        t = self.t
        f = t["sig"] if hl else (fill or t["sheet"])
        dash = ' stroke-dasharray="6 4"' if dashed else ""
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{f}" stroke="{t["ink"] if not hl else t["sig"]}" stroke-width="1.5"{dash}/>')
        ty = y + 26
        if code:
            self.text(x + 14, ty - 2, code, 12, 500, t["on_sig"] if hl else t["ink3"], mono=True)
            ty += 20
        self.text(x + 14, ty, title, 17, 700, t["on_sig"] if hl else t["ink"])
        for i, ln in enumerate(lines):
            self.text(x + 14, ty + 22 + i * 19, ln, 13.5, 400, t["on_sig"] if hl else t["ink2"])

    def arrow(self, pts, color=None, dashed=False, width=1.5, head=True):
        c = color or self.t["ink"]
        d = "M" + " L".join(f"{x},{y}" for x, y in pts)
        dash = ' stroke-dasharray="5 4"' if dashed else ""
        self.add(f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{width}" stroke-linejoin="miter"{dash}/>')
        if head:
            (x1, y1), (x2, y2) = pts[-2], pts[-1]
            if x2 != x1:
                s = 1 if x2 > x1 else -1
                p = f"{x2},{y2} {x2 - 9 * s},{y2 - 4.5} {x2 - 9 * s},{y2 + 4.5}"
            else:
                s = 1 if y2 > y1 else -1
                p = f"{x2},{y2} {x2 - 4.5},{y2 - 9 * s} {x2 + 4.5},{y2 - 9 * s}"
            self.add(f'<polygon points="{p}" fill="{c}"/>')

    def datum(self, x, y, label, x2):
        t = self.t
        self.add(f'<line x1="{x + 16}" y1="{y}" x2="{x2}" y2="{y}" stroke="{t["ink3"]}" stroke-width="1" stroke-dasharray="3 5"/>')
        self.add(f'<polygon points="{x},{y - 11} {x + 12},{y - 11} {x + 6},{y - 1}" fill="none" stroke="{t["ink"]}" stroke-width="1.4"/>')
        self.text(x + 20, y - 4, label, 13, 600, t["ink2"])

    def hatch_rect(self, x, y, w, h, color=None):
        c = color or self.t["ink3"]
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#hatch)" stroke="{c}" stroke-width="1"/>')

    def svg(self, sheet):
        t = self.t
        # title block, as on a drawing sheet
        tb = self.h - 44
        foot = (f'<line x1="24" y1="{tb}" x2="{self.w - 24}" y2="{tb}" stroke="{t["ink"]}" stroke-width="1.5"/>')
        body = "\n".join(self.o)
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" '
                f'role="img" aria-label="{html.escape(self.title)}">'
                f'<title>{html.escape(self.title)}</title>'
                f'<style>{font_css()}</style>'
                f'<defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
                f'<line x1="0" y1="0" x2="0" y2="7" stroke="{t["ink3"]}" stroke-width="1"/></pattern></defs>'
                f'<rect width="100%" height="100%" fill="{t["bg"]}"/>')
        self.o = []
        self.text(24, self.h - 18, self.title, 13, 700)
        self.text(self.w - 24, self.h - 18, f"Keepwell · sheet {sheet} · 13 Nov 2026", 12, 500, t["ink3"], mono=True, anchor="end")
        return head + body + foot + "\n".join(self.o) + "</svg>"


def architecture(t):
    d = D(1240, 700, t, "Keepwell architecture: one modular monolith, Postgres row-level security, an outbox to a Go notifier")
    d.datum(24, 40, "Request path", 1216)
    d.datum(24, 260, "Events", 1216)
    d.datum(24, 470, "Where it runs", 1216)
    # request path
    d.box(40, 70, 250, 150, "Browser and PWA", ["Desk app, Angular 22", "Technician PWA, offline", "IndexedDB change queue", "QR request pages, no login"])
    d.box(340, 70, 220, 150, "nginx", ["Serves the app", "CSP and security headers", "Proxies /api to core"])
    d.box(610, 70, 300, 150, "Spring Boot core", ["Java 25, Spring Boot 4.1", "Modular monolith, 20 modules", "Module boundaries tested", "RFC 9457 errors, OpenAPI 3.1"])
    d.box(960, 70, 250, 150, "PostgreSQL 17", ["Row-level security, FORCE", "App role without BYPASSRLS", "SET LOCAL tenant and scope", "per transaction"])
    for x1, x2 in ((290, 340), (560, 610), (910, 960)):
        d.arrow([(x1, 145), (x2, 145)])
    # outbox path
    d.box(610, 290, 300, 92, "Outbox table", ["row written in the same transaction", "relay in core: FOR UPDATE SKIP LOCKED"], hl=True)
    d.arrow([(1085, 220), (1085, 336), (910, 336)])
    d.text(1095, 290, "same", 12, 600, t["ink2"])
    d.text(1095, 305, "commit", 12, 600, t["ink2"])
    d.box(340, 290, 220, 92, "SQS + DLQ", ["at-least-once, 5 receives", "then the dead-letter queue"])
    d.arrow([(610, 336), (560, 336)])
    d.box(40, 290, 250, 150, "Go notifier", ["Standard library first", "Dedupes on event id", "Email", "Webhooks: HMAC-signed,", "resolved IP pinned"])
    d.arrow([(340, 336), (290, 336)])
    d.text(610, 412, "The request thread never calls SQS or sends email.", 13, 500, t["ink2"])
    # where it runs
    y = 500
    d.box(40, y, 360, 130, "Live demo: Google Cloud Run", ["One instance: nginx, core, Postgres sidecar", "Synthetic data, re-seeded on every cold start", "Resets itself every 24 hours"])
    d.box(430, y, 470, 130, "AWS target: Terraform, not yet applied", ["CloudFront + WAF, origin lock to the ALB", "ECS Fargate (core, notifier), RDS PostgreSQL", "SQS + DLQ, Cognito OIDC, S3, KMS, GuardDuty", "Budgets and alarms, no NAT gateway"], dashed=True)
    d.box(930, y, 280, 130, "Self-host", ["One docker compose file", "Postgres, core, web", "then /setup in the browser"])
    return d


def reservation(t):
    d = D(1240, 560, t, "Two technicians race for the last part under READ COMMITTED")
    x0, x1 = 230, 1200
    d.text(40, 50, "Stock row: pump seal, store A", 15, 700)
    d.text(40, 72, "on_hand 1 · reserved 0", 13, 500, t["ink2"], mono=True)
    # time axis
    d.add(f'<line x1="{x0}" y1="110" x2="{x1}" y2="110" stroke="{t["ink"]}" stroke-width="1.5"/>')
    for i, lab in enumerate(["t0", "t1", "t2", "t3", "t4"]):
        x = x0 + 30 + i * 230
        d.add(f'<line x1="{x}" y1="104" x2="{x}" y2="116" stroke="{t["ink"]}" stroke-width="1.5"/>')
        d.text(x, 96, lab, 12, 500, t["ink3"], mono=True, anchor="middle")
    lanes = [(170, "Rajan"), (330, "Kumar")]
    for y, who in lanes:
        d.text(40, y + 6, who, 17, 700)
        d.text(40, y + 26, "one transaction", 13, 400, t["ink2"])
        d.add(f'<line x1="{x0}" y1="{y}" x2="{x1}" y2="{y}" stroke="{t["line"]}" stroke-width="1"/>')
    # Rajan
    d.box(x0 + 30, 140, 300, 62, "UPDATE ... WHERE available ≥ 1", ["matches, row lock taken, reserved 1"])
    d.box(x0 + 490, 140, 140, 62, "COMMIT", ["lock released"])
    # Kumar
    d.box(x0 + 260, 300, 200, 62, "Same UPDATE", ["needs the row lock"])
    d.hatch_rect(x0 + 460, 314, 210, 34)
    d.text(x0 + 565, 304, "waits, nothing returned yet", 12, 600, t["ink2"], anchor="middle")
    d.box(x0 + 670, 300, 290, 62, "Re-checks the newest row", ["1 − 1 ≥ 1 is false: 0 rows updated"], hl=True)
    d.arrow([(x0 + 630, 202), (x0 + 670, 300)], dashed=True)
    d.box(x0 + 670, 400, 290, 62, "409 INSUFFICIENT_STOCK", ["with the stores that still have it"])
    d.arrow([(x0 + 815, 362), (x0 + 815, 400)])
    d.text(40, 430, "Postgres re-evaluates the WHERE", 13, 600, t["ink2"])
    d.text(40, 449, "on the updated row (EvalPlanQual),", 13, 600, t["ink2"])
    d.text(40, 468, "so the check and the write are one step.", 13, 600, t["ink2"])
    return d


def sync(t):
    d = D(1240, 660, t, "Offline sync: a durable queue on the phone, an idempotent apply loop on the server")
    cols = [(150, "Phone", "IndexedDB queue"), (620, "Core", "POST /sync/mutations"), (1060, "Postgres", "one transaction per change")]
    for x, a, b in cols:
        d.text(x, 48, a, 17, 700, anchor="middle")
        d.text(x, 68, b, 13, 400, t["ink2"], anchor="middle")
        d.add(f'<line x1="{x}" y1="84" x2="{x}" y2="530" stroke="{t["ink3"]}" stroke-width="1" stroke-dasharray="3 5"/>')
    # offline period
    d.hatch_rect(40, 100, 220, 120)
    d.add(f'<rect x="52" y="122" width="196" height="76" fill="{t["sheet"]}" stroke="{t["ink"]}" stroke-width="1.5"/>')
    d.text(64, 146, "No signal", 15, 700)
    d.text(64, 166, "START_WORK  #a1", 12.5, 500, t["ink2"], mono=True)
    d.text(64, 184, "COMPLETE_WORK  #a2", 12.5, 500, t["ink2"], mono=True)
    # send
    d.arrow([(150, 250), (620, 250)])
    d.text(385, 240, "batch + Idempotency-Key", 13, 600, anchor="middle")
    d.arrow([(620, 280), (1060, 280)])
    d.text(840, 270, "#a1: dedupe key free → apply, store result", 12.5, 500, t["ink2"], anchor="middle")
    d.arrow([(620, 310), (1060, 310)])
    d.text(840, 300, "#a2: state machine re-checked → apply", 12.5, 500, t["ink2"], anchor="middle")
    # lost response
    d.arrow([(620, 345), (390, 345)], dashed=True, head=False)
    d.add(f'<path d="M380,333 L398,357 M398,333 L380,357" stroke="{t["ink"]}" stroke-width="2"/>')
    d.text(505, 335, "response lost on the way back", 12.5, 600, t["ink2"], anchor="middle")
    # resend
    d.arrow([(150, 390), (620, 390)])
    d.text(385, 380, "same batch, same key", 13, 600, anchor="middle")
    d.box(660, 405, 520, 72, "Same key, same body: stored response replayed", ["New batch, old change id: status duplicate, stored result"], hl=True)
    d.arrow([(620, 520), (150, 520)])
    d.text(385, 510, "applied · duplicate · conflict · rejected", 13, 600, anchor="middle")
    d.text(40, 572, "Conflicts come back with the server's copy and are shown to the person. Nothing is overwritten silently.", 13, 500, t["ink2"])
    return d


def rls(t):
    d = D(1240, 680, t, "Tenant and site isolation enforced by Postgres, not only by the service layer")
    steps = [
        ("Token", ["who you are, never your role"]),
        ("Membership", ["org, role and site scope", "read from the database"]),
        ("SET LOCAL", ["app.tenant_id", "app.scope_paths"]),
        ("Policies", ["tenant: permissive", "scope_limit: restrictive"]),
    ]
    x = 40
    for i, (a, lines) in enumerate(steps):
        d.box(x, 60, 250, 100, a, lines, hl=(i == 2))
        if i < 3:
            d.arrow([(x + 250, 110), (x + 290, 110)])
        x += 290
    d.text(40, 196, "Each transaction sets both values; they vanish at commit, so a pooled connection never carries them to the next request.", 13, 500, t["ink2"])
    # site tree as a section
    gx, gy = 120, 500
    d.add(f'<line x1="60" y1="{gy}" x2="1180" y2="{gy}" stroke="{t["ink"]}" stroke-width="2"/>')
    d.hatch_rect(60, gy, 1120, 30)
    blds = [("Plant 1 · Line A", 260, 4, True), ("Plant 1 · Line B", 560, 4, False), ("Tower · another site", 860, 7, False)]
    for name, cx, n, inside in blds:
        w = 220
        for k in range(n):
            y = gy - (k + 1) * 34
            fill = t["sig"] if inside else t["sheet"]
            d.add(f'<rect x="{cx - w / 2}" y="{y}" width="{w}" height="30" fill="{fill}" stroke="{t["ink"]}" stroke-width="1.3"/>')
        d.text(cx, gy + 56, name, 14, 700, anchor="middle")
        d.text(cx, gy - n * 34 - 12, "in scope: rows visible" if inside else "outside: 404, empty lists", 12.5, 600, t["ink"] if inside else t["ink2"], anchor="middle")
    d.text(40, 240, "A technician scoped to Line A", 15, 700)
    d.text(40, 260, "sees work, assets, permits and stores under that path. Another tenant's row is", 13, 400, t["ink2"])
    d.text(40, 278, "never visible: a missing setting reads as NULL, so the policy matches nothing.", 13, 400, t["ink2"])
    return d


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for i, (name, fn) in enumerate([("architecture", architecture), ("reservation-race", reservation), ("offline-sync", sync), ("rls-isolation", rls)], 1):
        for theme, t in THEMES.items():
            out = DEST / f"{name}-{theme}.svg"
            out.write_text(fn(t).svg(i))
            print(out.name, f"{out.stat().st_size / 1e3:.0f} kB")


main()
