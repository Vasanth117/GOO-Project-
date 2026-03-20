import os
import shutil
import random

SOURCE_DIR = r"e:\GOO\PlantVillage\PlantVillage"
OUTPUT_DIR = r"e:\GOO\yolo_dataset"

train_dir = os.path.join(OUTPUT_DIR, "train")
val_dir = os.path.join(OUTPUT_DIR, "val")

os.makedirs(train_dir, exist_ok=True)
os.makedirs(val_dir, exist_ok=True)

for disease_name in os.listdir(SOURCE_DIR):
    disease_path = os.path.join(SOURCE_DIR, disease_name)
    
    if os.path.isdir(disease_path):
        images = [f for f in os.listdir(disease_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        random.shuffle(images)
        
        split_index = int(len(images) * 0.8)
        train_images = images[:split_index]
        val_images = images[split_index:]
        
        os.makedirs(os.path.join(train_dir, disease_name), exist_ok=True)
        os.makedirs(os.path.join(val_dir, disease_name), exist_ok=True)
        
        for img in train_images:
            shutil.copy(os.path.join(disease_path, img), os.path.join(train_dir, disease_name, img))
            
        for img in val_images:
            shutil.copy(os.path.join(disease_path, img), os.path.join(val_dir, disease_name, img))

print(f"Dataset securely split and formatted for YOLOv8 inside {OUTPUT_DIR}")
