document.addEventListener("DOMContentLoaded", () => {
    const nodes = [...document.querySelectorAll(".floating-node")];
    const canvas = document.querySelector("#trail-layer");
    const context = canvas.getContext("2d");
    const speedSlider = document.querySelector("#speed-slider");
    const deviceScale = window.devicePixelRatio || 1;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const trailColor = "#00f";
    const maxTrailPoints = 12000;
    const titleGlyphs = "✢✦✧✩✪✫✬✭✮✯✰✶✷✹✺✻✼✽❂❈❉❋❖";
    let speedMultiplier = Number(speedSlider?.value || 1);

    const randomTitle = () =>
        Array.from({ length: 7 }, () => titleGlyphs[Math.floor(Math.random() * titleGlyphs.length)]).join("");

    document.title = randomTitle();
    window.setInterval(() => {
        document.title = randomTitle();
    }, 333);

    const resizeCanvas = () => {
        canvas.width = Math.floor(window.innerWidth * deviceScale);
        canvas.height = Math.floor(window.innerHeight * deviceScale);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
        context.strokeStyle = trailColor;
        context.lineWidth = 1.25;
        context.lineCap = "round";
        context.lineJoin = "round";
    };

    const getNodeCenter = (node) => {
        const rect = node.getBoundingClientRect();

        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    };

    const buildState = () => {
        const rects = nodes.map((node) => node.getBoundingClientRect());

        return nodes.map((node, index) => {
            const rect = rects[index];
            const center = getNodeCenter(node);
            const width = rect.width;
            const height = rect.height;
            const speed = 8 + Math.random() * 8;
            const angle = Math.random() * Math.PI * 2;
            const turnRate = 0.25 + Math.random() * 0.4;
            const driftSeed = Math.random() * Math.PI * 2;
            const driftRate = 0.3 + Math.random() * 0.45;
            const driftAmount = 0.35 + Math.random() * 0.35;

            node.style.position = "fixed";
            node.style.margin = "0";
            node.style.left = `${rect.left}px`;
            node.style.top = `${rect.top}px`;

            return {
                node,
                width,
                height,
                x: rect.left,
                y: rect.top,
                trail: [
                    {
                        x: center.x,
                        y: center.y,
                    },
                ],
                speed,
                heading: angle,
                turnRate,
                driftSeed,
                driftRate,
                driftAmount,
            };
        });
    };

    let items = buildState();
    let lastTime = performance.now();

    const repositionWithinViewport = () => {
        items.forEach((item) => {
            item.width = item.node.offsetWidth;
            item.height = item.node.offsetHeight;
            item.x = clamp(item.x, 0, window.innerWidth - item.width);
            item.y = clamp(item.y, 0, window.innerHeight - item.height);
            item.node.style.left = `${item.x}px`;
            item.node.style.top = `${item.y}px`;

            const center = getNodeCenter(item.node);
            item.trail = [
                {
                    x: center.x,
                    y: center.y,
                },
            ];
        });
    };

    const drawTrails = () => {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);

        items.forEach((item) => {
            if (item.trail.length < 2) {
                return;
            }

            context.beginPath();
            context.moveTo(item.trail[0].x, item.trail[0].y);

            for (let index = 1; index < item.trail.length; index += 1) {
                const point = item.trail[index];
                context.lineTo(point.x, point.y);
            }

            context.globalAlpha = 0.7;
            context.stroke();
        });

        context.globalAlpha = 1;
    };

    const bounceHeadingHorizontally = (heading) => Math.PI - heading;
    const bounceHeadingVertically = (heading) => -heading;

    const tick = (time) => {
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        const elapsed = time / 1000;

        items.forEach((item) => {
            const wander =
                Math.sin(elapsed * item.driftRate + item.driftSeed) * item.driftAmount +
                Math.cos(elapsed * (item.driftRate * 0.61) + item.driftSeed * 1.7) * item.driftAmount * 0.5;
            item.heading += wander * item.turnRate * delta;

            item.x += Math.cos(item.heading) * item.speed * speedMultiplier * delta;
            item.y += Math.sin(item.heading) * item.speed * speedMultiplier * delta;

            if (item.x <= 0 || item.x >= window.innerWidth - item.width) {
                item.x = clamp(item.x, 0, window.innerWidth - item.width);
                item.heading = bounceHeadingHorizontally(item.heading);
            }

            if (item.y <= 0 || item.y >= window.innerHeight - item.height) {
                item.y = clamp(item.y, 0, window.innerHeight - item.height);
                item.heading = bounceHeadingVertically(item.heading);
            }

            item.node.style.left = `${item.x}px`;
            item.node.style.top = `${item.y}px`;

            const center = getNodeCenter(item.node);
            item.trail.push({
                x: center.x,
                y: center.y,
            });

            if (item.trail.length > maxTrailPoints) {
                item.trail.shift();
            }
        });

        drawTrails();
        window.requestAnimationFrame(tick);
    };

    resizeCanvas();
    repositionWithinViewport();
    speedSlider?.addEventListener("input", (event) => {
        speedMultiplier = Number(event.target.value);
    });
    window.addEventListener("resize", () => {
        resizeCanvas();
        repositionWithinViewport();
    });
    window.requestAnimationFrame(tick);
});
