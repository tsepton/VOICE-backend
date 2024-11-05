
export interface StarePoint {
    x: number;
    y: number;
}

export interface Question {
  query: string;
  image: string;
  gaze: StarePoint[];
}

export interface Answer {}
