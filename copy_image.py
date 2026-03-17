import shutil
import os

source = r"C:\Users\Antigravity\.gemini\antigravity\brain\2ce16d97-d5f7-47a5-8cbd-bab5ddfb54be\dodi_store_hero_1773651135900.png"
dest_dir = r"c:\Users\Antigravity\.gemini\antigravity\scratch\Sales_Agent_System\static"
dest = os.path.join(dest_dir, "hero.png")

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

shutil.copy2(source, dest)
print(f"Copied {source} to {dest}")
