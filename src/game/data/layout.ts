import type { ObjectId } from '../types';

/**
 * The room is authored on a fixed stage. Room art (SVG) and interaction
 * hotspots share this coordinate system so they can never drift apart.
 */
export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 1000;
export const FLOOR_Y = 860;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const OBJECT_RECTS: Record<ObjectId, Rect> = {
  door: { x: 80, y: 190, w: 270, h: 670 },
  clock: { x: 425, y: 150, w: 140, h: 420 },
  painting: { x: 640, y: 150, w: 330, h: 250 },
  lamp: { x: 650, y: 420, w: 110, h: 170 },
  memo: { x: 860, y: 548, w: 110, h: 54 },
  drawer: { x: 752, y: 622, w: 206, h: 76 },
  basket: { x: 1030, y: 758, w: 84, h: 104 },
  window: { x: 1110, y: 170, w: 150, h: 200 },
  safe: { x: 1120, y: 688, w: 150, h: 172 },
  bookshelf: { x: 1300, y: 130, w: 260, h: 730 },
};

export const DESK = { x: 610, y: 585, w: 400, h: 275 };

/** Horizontal focus points used when the viewport is too narrow to show the whole room. */
export const PAN_STOPS = [215, 560, 810, 1180, 1400];

export function rectCenter(r: Rect): { x: number; y: number } {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
