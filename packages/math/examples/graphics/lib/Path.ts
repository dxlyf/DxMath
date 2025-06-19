export enum PathVerb {
    MOVE_TO = "M",
    LINE_TO = "L",
    QUADRATIC_BEZIER_TO = "Q",
    CUBIC_BEZIER_TO = "C",
    CLOSE_PATH = "Z",
}


export class PathBuilder {
    public points: number[] = [];
    public verbs: PathVerb[] = [];
    private needInjectMove = true;

    private get lastVerb() {
        return this.verbs[this.verbs.length - 1];
    }
    private get size() {
        return this.verbs.length;
    }
    private injectMove() {
        if (this.needInjectMove) {
            if (this.size === 0) {
                this.moveTo(0, 0);
            } else {
                this.moveTo(
                    this.points[this.points.length - 2],
                    this.points[this.points.length - 1]
                );
            }
        }
    }

    moveTo(x: number, y: number) {
        if (this.lastVerb === PathVerb.MOVE_TO) {
            const len = this.points.length;
            this.points[len - 2] = x;
            this.points[len - 1] = y;
        } else {
            this.points.push(x, y);
            this.verbs.push(PathVerb.MOVE_TO);
        }
        this.needInjectMove = false;
        return this;
    }

    lineTo(x: number, y: number) {
        this.injectMove();
        this.points.push(x, y);
        this.verbs.push(PathVerb.LINE_TO);
        return this;
    }

    quadraticBezierTo(cx: number, cy: number, x: number, y: number) {
        this.injectMove();
        this.points.push(cx, cy, x, y);
        this.verbs.push(PathVerb.QUADRATIC_BEZIER_TO);
        return this;
    }

    cubicBezierTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) {
        this.injectMove();
        this.points.push(cx1, cy1, cx2, cy2, x, y);
        this.verbs.push(PathVerb.CUBIC_BEZIER_TO);
        return this;
    }

    closePath() {
        if (this.size > 0 && this.lastVerb !== PathVerb.CLOSE_PATH) {
            this.verbs.push(PathVerb.CLOSE_PATH);
        }
        this.needInjectMove = true;
        return this;
    }
}
