import React, { useEffect, useRef, useCallback } from 'react';
import './CustomCursor.css';

const TRAIL_COUNT = 24;
const INTERACTIVE = 'a, button, input, textarea, select, [role="button"], label, [data-cursor]';

/* Generuj rozmiar i styl dla każdej kropki trail */
const getTrailStyle = (i) => {
    const progress = i / (TRAIL_COUNT - 1);  /* 0 → 1 */
    const size = 8 - progress * 6;            /* 8px → 2px */
    const alpha = 0.7 - progress * 0.65;      /* 0.7 → 0.05 */
    const glowAlpha = alpha * 0.5;
    const glowSize = Math.max(1, 6 - progress * 5);

    return {
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        background: `rgba(0, 229, 255, ${alpha})`,
        boxShadow: `0 0 ${glowSize}px ${Math.max(1, glowSize / 2)}px rgba(0, 229, 255, ${glowAlpha})`,
    };
};

const CustomCursor = () => {
    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const trailRefs = useRef([]);

    const mouse = useRef({ x: -100, y: -100 });
    const dotPos = useRef({ x: -100, y: -100 });
    const ringPos = useRef({ x: -100, y: -100 });
    const trails = useRef(
        Array.from({ length: TRAIL_COUNT }, () => ({ x: -100, y: -100 }))
    );

    const ringScale = useRef({ current: 1, target: 1 });
    const isVisible = useRef(false);
    const isHovering = useRef(false);
    const raf = useRef(null);

    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = useCallback(() => {
        const { x: mx, y: my } = mouse.current;

        /* --- Dot: prawie instant --- */
        dotPos.current.x = lerp(dotPos.current.x, mx, 0.55);
        dotPos.current.y = lerp(dotPos.current.y, my, 0.55);

        if (dotRef.current) {
            dotRef.current.style.transform =
                `translate(${dotPos.current.x}px, ${dotPos.current.y}px)`;
        }

        /* --- Ring: smooth follow --- */
        ringPos.current.x = lerp(ringPos.current.x, mx, 0.12);
        ringPos.current.y = lerp(ringPos.current.y, my, 0.12);
        ringScale.current.current = lerp(
            ringScale.current.current,
            ringScale.current.target,
            0.1
        );

        if (ringRef.current) {
            ringRef.current.style.transform =
                `translate(${ringPos.current.x}px, ${ringPos.current.y}px) scale(${ringScale.current.current})`;
        }

        /* --- Trail: kaskadowo za PIERŚCIENIEM (pojawiają się za nim) --- */
        for (let i = 0; i < TRAIL_COUNT; i++) {
            /* Pierwszy trail podąża za ringPos, reszta za poprzednim */
            const prev = i === 0 ? ringPos.current : trails.current[i - 1];

            /* Prędkość maleje z każdym elementem: 0.38 → ~0.06 */
            const speed = 0.38 - (i / (TRAIL_COUNT - 1)) * 0.32;

            trails.current[i].x = lerp(trails.current[i].x, prev.x, speed);
            trails.current[i].y = lerp(trails.current[i].y, prev.y, speed);

            if (trailRefs.current[i]) {
                trailRefs.current[i].style.transform =
                    `translate(${trails.current[i].x}px, ${trails.current[i].y}px)`;
            }
        }

        raf.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        const show = () => {
            if (dotRef.current) dotRef.current.style.opacity = '1';
            if (ringRef.current) ringRef.current.style.opacity = '1';
            trailRefs.current.forEach((t) => {
                if (t) t.style.opacity = '1';
            });
        };

        const hide = () => {
            [dotRef.current, ringRef.current, ...trailRefs.current].forEach((el) => {
                if (el) el.style.opacity = '0';
            });
        };

        const resetPositions = (x, y) => {
            dotPos.current = { x, y };
            ringPos.current = { x, y };
            trails.current = trails.current.map(() => ({ x, y }));
        };

        const onMouseMove = (e) => {
            mouse.current = { x: e.clientX, y: e.clientY };

            if (!isVisible.current) {
                isVisible.current = true;
                resetPositions(e.clientX, e.clientY);
                show();
            }

            const hovering = !!e.target.closest(INTERACTIVE);
            if (hovering !== isHovering.current) {
                isHovering.current = hovering;
                ringScale.current.target = hovering ? 1.15 : 1;
                const method = hovering ? 'add' : 'remove';
                ringRef.current?.classList[method]('hovering');
                dotRef.current?.classList[method]('hovering');
            }
        };

        const onMouseLeave = () => {
            isVisible.current = false;
            isHovering.current = false;
            hide();
        };

        const onMouseEnter = (e) => {
            resetPositions(e.clientX, e.clientY);
        };

        window.addEventListener('mousemove', onMouseMove);
        document.documentElement.addEventListener('mouseleave', onMouseLeave);
        document.documentElement.addEventListener('mouseenter', onMouseEnter);

        raf.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            document.documentElement.removeEventListener('mouseleave', onMouseLeave);
            document.documentElement.removeEventListener('mouseenter', onMouseEnter);
            cancelAnimationFrame(raf.current);
        };
    }, [animate]);

    return (
        <div className="cursor-container">
            {/* Trail — dużo kropek, startują ZA pierścieniem */}
            {Array.from({ length: TRAIL_COUNT }).map((_, i) => {
                const s = getTrailStyle(i);
                return (
                    <div
                        key={i}
                        ref={(el) => (trailRefs.current[i] = el)}
                        className="cursor-trail-dot"
                        style={{
                            width: s.width,
                            height: s.height,
                            marginLeft: s.marginLeft,
                            marginTop: s.marginTop,
                            background: s.background,
                            boxShadow: s.boxShadow,
                        }}
                    />
                );
            })}

            {/* Pierścień — jeden */}
            <div ref={ringRef} className="cursor-ring" />

            {/* Kropka centralna */}
            <div ref={dotRef} className="cursor-dot" />
        </div>
    );
};

export default CustomCursor;