"""Render Trayage's one-page duplicate-file field guide for print and Canva."""
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/trayage-duplicate-file-field-guide.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
FONT = Path('/System/Library/Fonts/Supplemental')
for name, file in [('Sans', 'Arial.ttf'), ('Bold', 'Arial Bold.ttf'), ('Serif', 'Georgia.ttf'), ('Italic', 'Georgia Italic.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT / file)))

W, H = 612, 792
paper, ink, muted, orange, line = map(HexColor, ['#f7f6f2', '#262722', '#65665d', '#b94117', '#deded5'])
c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
c.setTitle('A second look. Less clutter. | Trayage duplicate-file field guide')
c.setAuthor('Kyle Reddoch · Trayage')
c.setSubject('A printable guide to reviewing likely duplicate files on Mac before moving anything to Trash.')
c.setFillColor(paper)
c.rect(0, 0, W, H, fill=1, stroke=0)

def text(x, top, value, font='Sans', size=11, color=ink):
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, H-top-size, value)

def para(x, top, width, value, size=11, color=ink, leading=15):
    p = Paragraph(value, ParagraphStyle('body', fontName='Sans', fontSize=size, leading=leading, textColor=color))
    _, height = p.wrap(width, 200)
    p.drawOn(c, x, H-top-height)
    return height

def rule(x, top, width, color=line):
    c.setStrokeColor(color)
    c.setLineWidth(.7)
    c.line(x, H-top, x+width, H-top)

def box(x, top, width, height, fill, stroke=None, radius=10):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.setLineWidth(.8)
    c.roundRect(x, H-top-height, width, height, radius, fill=1, stroke=bool(stroke))

def label(x, top, value, color=muted, size=8):
    c.saveState()
    obj = c.beginText(x, H-top-size)
    obj.setFont('Bold', size)
    obj.setCharSpace(1.4)
    obj.setFillColor(color)
    obj.textOut(value)
    c.drawText(obj)
    c.restoreState()

c.drawImage(str(ROOT / 'public/assets/app-icon.png'), 42, H-70, 34, 34, mask='auto')
text(84, 42, 'Trayage', 'Bold', 18)
label(397, 47, 'FIELD GUIDE / 01')
rule(44, 84, 524)

text(44, 109, 'A second look.', 'Serif', 37)
text(44, 151, 'Less clutter.', 'Italic', 38, orange)
para(44, 208, 308, 'A thoughtful guide to duplicate files on your Mac.', 12, muted, 17)

# An original file-card illustration: familiar names, visibly different receipts.
box(412, 109, 119, 92, HexColor('#e8e8df'), line, 7)
text(425, 119, 'Invoice.pdf', 'Bold', 9)
rule(425, 140, 91)
label(425, 149, 'ORDER 1042', size=6.5)
box(433, 156, 127, 93, HexColor('#fffefa'), line, 7)
text(446, 167, 'Invoice (1).pdf', 'Bold', 9)
rule(446, 187, 99)
label(446, 196, 'ORDER 1088', orange, 6.5)
text(446, 213, '$72.00', 'Serif', 17)

box(44, 270, 524, 66, ink, radius=9)
text(61, 281, 'Same name. Different possibilities.', 'Bold', 15, paper)
para(61, 304, 489, 'Matching filenames and sizes are clues. They do not prove matching contents.', 10.5, HexColor('#e6e6dc'), 14)

steps = [
    ('01', 'Find the context.', 'Check where each copy lives. A project may need its own copy; a backup is intentional.'),
    ('02', 'Look beyond the filename.', 'Use Command-I for file details, then Space for Quick Look. Compare pages, notes, signatures, or image edits.'),
    ('03', 'Choose the copy that matters.', 'Confirm the copy you keep opens. Maintain a current backup. A visual preview alone cannot prove exact equality.'),
]
for i, (number, title, body) in enumerate(steps):
    y = 357 + i*63
    text(44, y, number, 'Italic', 22, orange)
    text(87, y+1, title, 'Bold', 14)
    para(87, y+23, 466, body, 10.5, muted, 14)
    if i < 2:
        rule(87, y+57, 481)

box(44, 561, 253, 124, HexColor('#f6e6d5'), radius=9)
label(60, 576, 'STILL UNSURE?', orange)
text(60, 595, 'Keep both.', 'Serif', 23)
para(60, 629, 218, 'An extra file can wait. Keep both when differences, purpose, or location remain unclear.', 10.5, ink, 14)

box(309, 561, 259, 124, HexColor('#e8ece4'), radius=9)
label(325, 576, 'UNNEEDED COPY CONFIRMED?', HexColor('#455344'), 7)
text(325, 595, 'Move it to Trash.', 'Serif', 23)
para(325, 629, 227, 'Check your work before emptying Trash. While the file is there, select it and use File > Put Back to restore it.', 10.5, ink, 14)

rule(44, 703, 524)
text(44, 713, 'A little order for your Downloads.', 'Italic', 12)
text(401, 715, 'Full guide', 'Bold', 10, orange)
text(485, 715, 'Get Trayage', 'Bold', 10, orange)
c.linkURL('https://trayage.app/blog/check-duplicate-files-on-mac/', (397, H-731, 465, H-712), relative=0, thickness=0)
releases = json.loads((ROOT / 'src/_data/releases.json').read_text())
c.linkURL(releases['direct']['url'], (480, H-731, 568, H-712), relative=0, thickness=0)
para(44, 740, 524, 'Trayage 1.0 direct edition flags likely duplicates by normalized filename and size; it does not compare contents. You choose what moves to Trash. Trayage never empties it.', 8, muted, 10.5)
label(44, 770, 'TRAYAGE.APP', size=6.5)
text(467, 769, 'OCTOBER 7, 2026', 'Sans', 7, muted)
c.showPage()
c.save()
print(OUT)
