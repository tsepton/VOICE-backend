import { Canvas, CanvasRenderingContext2D, createCanvas, Image } from "canvas";
import onnx from "onnxruntime-node";
import { AggregatedStarePoint } from "../../types/internal.ts";
import { GazeToDescriptionProcessor } from "./gaze-processor.ts";

export class Yolov8BasedImageDescription implements GazeToDescriptionProcessor {
  private _model: onnx.InferenceSession | undefined;

  private _lookedAt: string[] = [];
  private _notLookedAt: string[] = [];

  private _canvas: Canvas;
  private _ctx: CanvasRenderingContext2D;

  private _width: number;
  private _height: number;

  public constructor(private image: Image) {
    this._width = image.width;
    this._height = image.height;

    this._canvas = createCanvas(640, 640);
    this._ctx = this._canvas.getContext("2d");

    this._ctx.drawImage(image, 0, 0, 640, 640);
  }

  public async init(): Promise<void> {
    this._model = await onnx.InferenceSession.create("./models/yolov8m.onnx");
  }

  public get(): string[] {
    return this._lookedAt;
  }

  public getAllOther(): string[] {
    return this._notLookedAt;
  }

  public async process(data: AggregatedStarePoint[]): Promise<void> {
    if (!this._model) await this.init();

    const pixels = await this._prepareInput(this.image!);
    const output = await this._askModel(pixels);
    const todo = this._processOutput(output);
    this._lookedAt = todo.map((item) => item[4]); // todo check with gaze data
    this._notLookedAt = this._cocoClasses.filter(
      (item) => !this._lookedAt.includes(item)
    );
    return;
  }

  private async _prepareInput(image: Image) {
    const imageData = this._ctx.getImageData(0, 0, 640, 640);
    const pixels = imageData.data;

    const red = [],
      green = [],
      blue = [];

    for (let i = 0; i < pixels.length; i += 4) {
      red.push(pixels[i] / 255.0); 
      green.push(pixels[i + 1] / 255.0); 
      blue.push(pixels[i + 2] / 255.0); 
    }

    return [...red, ...green, ...blue];
  }

  private async _askModel(input: number[]): Promise<any> {
    if (!this._model) throw new Error("Model not initialized");

    // FIXME - return type should be number[]
    const tensor = new onnx.Tensor(Float32Array.from(input), [1, 3, 640, 640]);
    const outputs = await this._model.run({ images: tensor });
    return outputs["output0"].data;
  }

  /**
   * Function used to convert RAW output from YOLOv8 to an array of detected objects.
   * Each object contain the bounding box of this object, the type of object and the probability
   * @param output Raw output of YOLOv8 network
   * @returns Array of detected objects in a format [[x1,y1,x2,y2,object_type,probability],..]
   */
  private _processOutput(output: number[]) {
    let boxes: any[][] = [];
    for (let index = 0; index < 8400; index++) {
      const [class_id, prob] = [...Array(80).keys()]
        .map((col) => [col, output[8400 * (col + 4) + index]])
        .reduce((accum, item) => (item[1] > accum[1] ? item : accum), [0, 0]);
      if (prob < 0.5) {
        continue;
      }
      const label = this._cocoClasses[class_id];
      const xc = output[index];
      const yc = output[8400 + index];
      const w = output[2 * 8400 + index];
      const h = output[3 * 8400 + index];
      const x1 = ((xc - w / 2) / 640) * this._width;
      const y1 = ((yc - h / 2) / 640) * this._height;
      const x2 = ((xc + w / 2) / 640) * this._width;
      const y2 = ((yc + h / 2) / 640) * this._height;
      boxes.push([x1, y1, x2, y2, label, prob]);
    }

    boxes = boxes.sort((box1, box2) => box2[5] - box1[5]);
    const result = [];
    while (boxes.length > 0) {
      result.push(boxes[0]);
      boxes = boxes.filter((box) => this._iou(boxes[0], box) < 0.7);
    }
    return result;
  }

  /**
   * Function calculates "Intersection-over-union" coefficient for specified two boxes
   * https://pyimagesearch.com/2016/11/07/intersection-over-union-iou-for-object-detection/.
   * @param box1 First box in format: [x1,y1,x2,y2,object_class,probability]
   * @param box2 Second box in format: [x1,y1,x2,y2,object_class,probability]
   * @returns Intersection over union ratio as a float number
   */
  private _iou(box1: number[], box2: number[]) {
    return this._intersection(box1, box2) / this._union(box1, box2);
  }

  /**
   * Function calculates union area of two boxes.
   *     :param box1: First box in format [x1,y1,x2,y2,object_class,probability]
   *     :param box2: Second box in format [x1,y1,x2,y2,object_class,probability]
   *     :return: Area of the boxes union as a float number
   * @param box1 First box in format [x1,y1,x2,y2,object_class,probability]
   * @param box2 Second box in format [x1,y1,x2,y2,object_class,probability]
   * @returns Area of the boxes union as a float number
   */
  private _union(box1: number[], box2: number[]) {
    const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
    const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
    const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1);
    const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1);
    return box1_area + box2_area - this._intersection(box1, box2);
  }

  /**
   * Function calculates intersection area of two boxes
   * @param box1 First box in format [x1,y1,x2,y2,object_class,probability]
   * @param box2 Second box in format [x1,y1,x2,y2,object_class,probability]
   * @returns Area of intersection of the boxes as a float number
   */
  private _intersection(box1: number[], box2: number[]) {
    const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
    const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
    const x1 = Math.max(box1_x1, box2_x1);
    const y1 = Math.max(box1_y1, box2_y1);
    const x2 = Math.min(box1_x2, box2_x2);
    const y2 = Math.min(box1_y2, box2_y2);
    return (x2 - x1) * (y2 - y1);
  }

  private _cocoClasses = [
    "person",
    "bicycle",
    "car",
    "motorcycle",
    "airplane",
    "bus",
    "train",
    "truck",
    "boat",
    "traffic light",
    "fire hydrant",
    "stop sign",
    "parking meter",
    "bench",
    "bird",
    "cat",
    "dog",
    "horse",
    "sheep",
    "cow",
    "elephant",
    "bear",
    "zebra",
    "giraffe",
    "backpack",
    "umbrella",
    "handbag",
    "tie",
    "suitcase",
    "frisbee",
    "skis",
    "snowboard",
    "sports ball",
    "kite",
    "baseball bat",
    "baseball glove",
    "skateboard",
    "surfboard",
    "tennis racket",
    "bottle",
    "wine glass",
    "cup",
    "fork",
    "knife",
    "spoon",
    "bowl",
    "banana",
    "apple",
    "sandwich",
    "orange",
    "broccoli",
    "carrot",
    "hot dog",
    "pizza",
    "donut",
    "cake",
    "chair",
    "couch",
    "potted plant",
    "bed",
    "dining table",
    "toilet",
    "tv",
    "laptop",
    "mouse",
    "remote",
    "keyboard",
    "cell phone",
    "microwave",
    "oven",
    "toaster",
    "sink",
    "refrigerator",
    "book",
    "clock",
    "vase",
    "scissors",
    "teddy bear",
    "hair drier",
    "toothbrush",
  ];
}
