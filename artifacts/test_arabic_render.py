import json
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

font_path = "/artifacts/telegram-studio/public/fonts/almarai.ttf"
try:
    font = ImageFont.truetype(font_path, 40)
    print("Font loaded successfully!")
except Exception as e:
    print(f"Error loading font: {e}")

word = "يكفيني"
reshaped = arabic_reshaper.reshape(word)
bidi_aligned = get_display(reshaped)

print(f"Word: {word}")
print(f"Reshaped: {[c for c in reshaped]}")
print(f"Bidi: {[c for c in bidi_aligned]}")
