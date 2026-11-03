#!/usr/bin/env python3
"""Generate the three audience social cards from Trayage's shipped assets."""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/social/violet-v1'
FONT = '/System/Library/Fonts/Avenir Next.ttc'
ICON = ROOT / 'public/assets/brand-violet/trayage-app-icon.png'
SCREEN = ROOT / 'public/assets/product-views/review-dark-native-1400.webp'
CARDS = [
 ('for-freelancers', 'FOR FREELANCERS', ['Clear the clutter.', 'Keep the client work.'], ['A calmer way to review', 'your Mac Downloads.'], (173, 145, 255)),
 ('for-students', 'FOR STUDENTS', ['Make room for class.', 'Keep what matters.'], ['Review course downloads', 'without losing important work.'], (144, 192, 255)),
 ('for-developers', 'FOR MAC DEVELOPERS', ['Less installer clutter.', 'More room to build.'], ['Review installers and', 'repeat downloads on your Mac.'], (188, 153, 255)),
]

def font(size, weight='regular'):
    return ImageFont.truetype(FONT, size, index={'regular':7, 'medium':5, 'bold':0}[weight])

def draw_card(key, label, lines, subtitle, accent):
    im = Image.new('RGB', (1200, 630)); pixels = im.load()
    for y in range(630):
        for x in range(1200):
            glow = math.exp(-(((x-1000)/450)**2 + ((y-280)/440)**2))
            pixels[x,y] = (int(22+19*glow), int(19+12*glow), int(34+45*glow))
    d = ImageDraw.Draw(im)
    icon = Image.open(ICON).convert('RGBA'); icon.thumbnail((52,52), Image.Resampling.LANCZOS)
    im.paste(icon, (62,48), icon)
    d.text((126,50), 'Trayage', font=font(30,'bold'), fill='#f7f4ff', stroke_width=0)
    d.rounded_rectangle((62,151, 62 + int(d.textlength(label, font=font(15,'bold'))) + 32,185), radius=17, fill='#302443', outline='#584175', width=1)
    d.text((78,158), label, font=font(15,'bold'), fill=accent)
    for i,line in enumerate(lines):
        size = 55
        while d.textlength(line, font=font(size,'bold')) > 650: size -= 1
        d.text((60, 210 + i*74), line, font=font(size,'bold'), fill='#f8f6ff' if i == 0 else accent, stroke_width=0)
    for i,line in enumerate(subtitle):
        d.text((63, 394 + i*35), line, font=font(24), fill='#c8c0d7')
    # Show the real app with sample data. Rounded frame and shadow are presentation only.
    shadow = Image.new('RGBA', im.size, (0,0,0,0)); sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((753,216,1148,501), radius=18, fill=(0,0,0,95))
    im = Image.alpha_composite(im.convert('RGBA'), shadow)
    shot = Image.open(SCREEN).convert('RGB'); shot.thumbnail((385,266), Image.Resampling.LANCZOS)
    x, y = 750 + (392-shot.width)//2, 199 + (280-shot.height)//2
    frame = ImageDraw.Draw(im); frame.rounded_rectangle((742,190,1152,491), radius=18, fill='#413751', outline='#786b8d', width=2)
    mask = Image.new('L',shot.size); ImageDraw.Draw(mask).rounded_rectangle((0,0,*shot.size),radius=9,fill=255)
    im.paste(shot,(x,y),mask)
    d = ImageDraw.Draw(im)
    d.line((62, 540, 1138, 540), fill='#50465c', width=1)
    d.text((62, 557), 'REVIEW FREE  ·  YOU DECIDE WHAT MOVES', font=font(15,'bold'), fill='#c9bfd6')
    d.text((1012, 555), 'trayage.app', font=font(20,'bold'), fill=accent)
    OUT.mkdir(parents=True,exist_ok=True)
    im.convert('RGB').save(OUT / f'{key}.png', optimize=True)

for card in CARDS:
    draw_card(*card)
    print(f'Created {OUT / (card[0] + ".png")}')
