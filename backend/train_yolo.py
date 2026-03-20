from ultralytics import YOLO

if __name__ == '__main__':
    # Load YOLOv8 classification model (nano version)
    model = YOLO('yolov8n-cls.pt')

    # Train the model on your newly formatted dataset
    results = model.train(
        data=r'e:\GOO\yolo_dataset', 
        epochs=10, 
        imgsz=224,
        batch=16,
        project='goo_ai_models',
        name='crop_classifier'
    )
