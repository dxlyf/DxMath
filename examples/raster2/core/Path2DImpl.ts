// core/Path2DImpl.ts
export type Vec2 = { x: number; y: number };

export type PathCommand =
  | { type: 'moveTo'; to: Vec2 }
  | { type: 'lineTo'; to: Vec2 }
  | { type: 'bezierTo'; cp1: Vec2; cp2: Vec2; to: Vec2 }
  | { type: 'closePath' };

export class Path2DImpl {
  commands: PathCommand[] = [];

  moveTo(x: number, y: number) {
    this.commands.push({ type: 'moveTo', to: { x, y } });
  }

  lineTo(x: number, y: number) {
    this.commands.push({ type: 'lineTo', to: { x, y } });
  }

  bezierTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
    this.commands.push({
      type: 'bezierTo',
      cp1: { x: cp1x, y: cp1y },
      cp2: { x: cp2x, y: cp2y },
      to: { x, y }
    });
  }

  closePath() {
    this.commands.push({ type: 'closePath' });
  }
}
