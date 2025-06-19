
import { Span } from "./span"
import { div255, max, min, sqrt } from "./util";




export class Rle {
    static create() {
        return new Rle()
    }
    static intersection(a: Rle, b: Rle) {

        let result = new Rle()
        let a_spans: Span;
        let a_start = 0
        let a_end = a.spans.length;
        let b_spans: Span;
        let b_start = 0;
        let b_end = b.spans.length;
        while ((a_start < a_end) && (b_start < b_end)) {
            a_spans = a.spans[a_start];
            b_spans = b.spans[b_start];
            if (b_spans.y > a_spans.y) {
                ++a_start;
                continue;
            }
            if (a_spans.y != b_spans.y) {
                ++b_start;
                continue;
            }
            let ax1 = a_spans.x;
            let ax2 = ax1 + a_spans.len;
            let bx1 = b_spans.x;
            let bx2 = bx1 + b_spans.len;
            if (bx1 < ax1 && bx2 < ax1) {
                ++b_start;
                continue;
            }
            else if (ax1 < bx1 && ax2 < bx1) {
                ++a_start;
                continue;
            }
            let x = max(ax1, bx1);
            let len = min(ax2, bx2) - x;
            if (len) {
                let span = new Span();
                span.x = x;
                span.len = len;
                span.y = a_spans.y;
                span.coverage = div255(a_spans.coverage * b_spans.coverage);
                result.spans.push(span)
            }
            if (ax2 < bx2) {
                ++a_start;
            }
            else {
                ++b_start;
            }
        }
        if (result.spans.length == 0) {
            result.x = 0;
            result.y = 0;
            result.w = 0;
            result.h = 0;
            return result;
        }
        let spans = result.spans;
        let x1 = Number.MIN_SAFE_INTEGER;
        let y1 = spans[0].y;
        let x2 = 0;
        let y2 = spans[result.spans.length - 1].y;
        for (let i = 0; i < result.spans.length; i++) {
            if (spans[i].x < x1) {
                x1 = spans[i].x;
            }
            if (spans[i].x + spans[i].len > x2) {
                x2 = spans[i].x + spans[i].len;
            }
        }
        result.x = x1;
        result.y = y1;
        result.w = x2 - x1;
        result.h = y2 - y1 + 1;

        return result;
    }
  
    spans: Span[] = []
    x: int = 0
    y: int = 0
    w: int = 0
    h: int = 0
    clear() {
        this.spans = []
        this.x = 0
        this.y = 0
        this.w = 0
        this.h = 0
    }

    clipPath(clip?: Rle | null) {
        if (clip) {
            let result = Rle.intersection(this, clip)
            this.copy(result)
        }
        return this
    }
    clone() {
        return new Rle().copy(this)
    }
    copy(source: Rle) {
        this.spans = source.spans.map(d => d.clone())
        this.x = source.x
        this.y = source.y
        this.w = source.w
        this.h = source.h
        return this
    }
}