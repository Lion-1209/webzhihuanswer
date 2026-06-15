from PIL import Image
import os

base = os.path.dirname(__file__)

def make(size, path):
    img = Image.new("RGBA", (size, size), (0, 120, 215, 255))
    img.save(path, "PNG")

make(16, os.path.join(base, "icon16.png"))
make(48, os.path.join(base, "icon48.png"))
make(128, os.path.join(base, "icon128.png"))
print("done")
