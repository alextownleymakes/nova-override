const MINIMAP_SIZE = 200;
const MINIMAP_HALF = MINIMAP_SIZE / 2;

// helper
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// map world (base) coords -> minimap pixel coords

function worldToMiniZ0(x, y, centerX, centerY, halfSpan) {
    const dx = x - centerX;
    const dy = y - centerY;

    const px = MINIMAP_HALF + (dx / halfSpan) * MINIMAP_HALF;
    const py = MINIMAP_HALF + (dy / halfSpan) * MINIMAP_HALF;

    const result = { x: px, y: py }
    return result;
}

function worldToMiniZ1(x, y, centerX, centerY, halfSpan) {
    const dx = x - (centerX * 4);
    const dy = y - (centerY * 4);

    const px = MINIMAP_HALF + (dx / 100) * MINIMAP_HALF;
    const py = MINIMAP_HALF + (dy / 100) * MINIMAP_HALF;

    const result = { x: px, y: py }
    // console.log('worldToMiniZ1:', x, y, '->', result.x, result.y);
    return result;
}

function drawDot(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f00';
}

const minimap = {
    canvas: null,
    ctx: null,

    init() {
        if (this.canvas) return;
        this.canvas = document.getElementById("minimap");
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");
    },

    draw(universe, ship, mainCanvas) {
        this.init();
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // background + border (in-canvas, so it looks nice even if CSS changes)
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.strokeRect(0.5, 0.5, MINIMAP_SIZE, MINIMAP_SIZE);

        // --- Mode selection ---
        if (universe.zoomLevel === 0) {
            // zoom 0: ship centered, stars shown, span = 10x normal FOV
            const z = zoomFactors[0]; // = 1
            const viewW = mainCanvas.width / z;
            const viewH = mainCanvas.height / z;

            // want the system radius to take ~80% of the minimap radius
            const halfSpan = Math.max(viewW, viewH) * 5; // 10× FOV
            const cx = ship.x;
            const cy = ship.y;

            // stars
            for (const b of universe.bodies) {
                if (!b || b.type !== "Star") continue;

                const bx = b.coords?.[0]?.x ?? b.x;
                const by = b.coords?.[0]?.y ?? b.y;
                if (!Number.isFinite(bx) || !Number.isFinite(by)) continue;

                // quick cull
                if (Math.abs(bx - cx) > halfSpan * 100 || Math.abs(by - cy) > halfSpan * 100) continue;

                const p = worldToMiniZ0(bx, by, cx, cy, halfSpan);
                // if (p.x < 0 || p.x > MINIMAP_SIZE || p.y < 0 || p.y > MINIMAP_SIZE) continue;

                ctx.fillStyle = "rgba(255,255,255,0.8)";
                drawDot(ctx, p.x, p.y, 1.2);
            }

            // ship (center)
            ctx.fillStyle = "rgba(0,255,140,1)";
            drawDot(ctx, MINIMAP_HALF, MINIMAP_HALF, 2.2);

            // optional: label
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "10px monospace";
            ctx.fillText("Z0", 6, 14);

            return;
        }

        // zoom 1: parent star centered, show planets + ship
        if (universe.zoomLevel === 1 && ship.bodyLock) {
            const star = ship.bodyLock;

            const sx = star.coords?.[0]?.x ?? star.x;
            const sy = star.coords?.[0]?.y ?? star.y;

            // Span: based on star system size (gravitylock is AU)
            // show ~3× max planet orbit radius, minimum sane span
            const sysRadiusIGU = 100;
            const halfSpan = 100;

            // center star
            ctx.fillStyle = "rgba(255,220,0,1)";
            drawDot(ctx, MINIMAP_HALF, MINIMAP_HALF, 2.6);

            // planets (works whether you store them in universe.bodies or on star.bodies)
            const candidates = [];

            // if you put planets in universe.bodies
            for (const b of universe.bodies) {
                if (!b || b.body !== "Planet") continue;

                // parent match (supports different property names)
                const parentId = b.starId ?? b.parentStarId ?? b.parentId ?? b.star?.id;
                if (parentId != null && parentId !== star.id) continue;

                candidates.push(b);
            }

            // if you put planets on the star itself
            if (Array.isArray(star.bodies)) {
                for (const b of star.bodies) {
                    if (b && b.body === "Planet") candidates.push(b);
                }
            }

            // de-dupe
            const seen = new Set();
            const planets = candidates.filter(p => {
                const id = p.id ?? p.name ?? Math.random();
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            // draw planets
            for (const p of planets) {
                const pxW = (p.coords?.[0]?.x ?? p.x) * 4;
                const pyW = (p.coords?.[0]?.y ?? p.y) * 4;
                if (!Number.isFinite(pxW) || !Number.isFinite(pyW)) continue;

                const mp = worldToMiniZ1(pxW, pyW, sx, sy, 50);
                if (mp.x < 0 || mp.x > MINIMAP_SIZE || mp.y < 0 || mp.y > MINIMAP_SIZE) continue;

                ctx.fillStyle = "rgba(70,170,255,0.95)";
                drawDot(ctx, mp.x, mp.y, 1.8);
            }

            // ship
            const shipP = worldToMiniZ1(ship.x * 4, ship.y * 4, sx, sy, 50);
            ctx.fillStyle = "rgba(0,255,140,1)";
            drawDot(ctx, shipP.x, shipP.y, 2.2);

            // optional: system ring (max orbit radius)
            ctx.beginPath();
            const rPx = (sysRadiusIGU / halfSpan) * MINIMAP_HALF;
            ctx.arc(MINIMAP_HALF, MINIMAP_HALF, clamp(rPx, 4, MINIMAP_HALF - 20), 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(0,140,255,0.35)";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "10px monospace";
            ctx.fillText("Z1", 6, 14);

            return;
        }
    }
};
