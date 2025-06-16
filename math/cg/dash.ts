import { Path, PathElement } from "./path"



export function dash_path(dash: Dash, path: Path) {
    if ((dash.data == null) || (dash.size <= 0))
        return path.clone();

    let toggle = true;
    let offset = 0;
    let phase = dash.offset;
    while (phase >= dash.data[offset]) {
        toggle = !toggle;
        phase -= dash.data[offset];
        offset += 1;
        if (offset == dash.size)
            offset = 0;
    }

    let flat = path.cloneFlat()
    let result = Path.create();


    let elements, elementsIndex = 0;
    let end = flat.elements.length;
    let points, pointsIndex = 0;
    while (elementsIndex < end) {
        points = flat.points[pointsIndex];
        elements = flat.elements[elementsIndex];
        let itoggle = toggle;
        let ioffset = offset;
        let iphase = phase;
        let x0 = points.x;
        let y0 = points.y;
        if (itoggle) {
            result.moveTo(x0, y0)
        }
        ++elementsIndex;
        ++pointsIndex;
        points = flat.points[pointsIndex];
        elements = flat.elements[elementsIndex];
        while ((elementsIndex < end) && (elements == PathElement.LINE_TO)) {
            points = flat.points[pointsIndex];
            elements = flat.elements[elementsIndex];
            let dx = points.x - x0;
            let dy = points.y - y0;
            let dist0 = Math.sqrt(dx * dx + dy * dy);
            let dist1 = 0;
            while (dist0 - dist1 > dash.data[ioffset] - iphase) {
                dist1 += dash.data[ioffset] - iphase;
                let a = dist1 / dist0;
                let x = x0 + a * dx;
                let y = y0 + a * dy;
                if (itoggle) {
                    result.lineTo(x, y);
                }
                else {
                    result.moveTo(x, y);
                }
                itoggle = !itoggle;
                iphase = 0;
                ioffset += 1;
                if (ioffset == dash.size)
                  {
                    ioffset = 0;
                  }
            }
            iphase += dist0 - dist1;
            x0 = points.x;
            y0 = points.y;
            if (itoggle) {
                result.lineTo(x0, y0)
            }
            ++elementsIndex;
            ++pointsIndex;
        }
    }

    return result;
}
export class Dash {
    static create(dashes: float64[], offset: float64 = 0): Dash {
        const dash = new Dash()
        dash.data = dashes.slice()
        dash.offset = offset
        return dash
    }
    offset: float64 = 0
    data: float64[] = []
    get size() {
        return this.data.length
    }
    clone() {
        return new Dash().copy(this)
    }
    copy(source: Dash) {
        this.offset = source.offset
        this.data = source.data.slice()
        return this
    }
}