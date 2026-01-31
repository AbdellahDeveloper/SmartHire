"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

interface ParticlesProps {
    className?: string;
    quantity?: number;
    staticity?: number;
    ease?: number;
    color?: string;
    refresh?: boolean;
}

export const Particles: React.FC<ParticlesProps> = ({
    className = "",
    quantity = 30,
    staticity = 50,
    ease = 50,
    color = "#ffffff",
    refresh = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const context = useRef<CanvasRenderingContext2D | null>(null);
    const circles = useRef<any[]>([]);
    const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

    useEffect(() => {
        if (canvasRef.current) {
            context.current = canvasRef.current.getContext("2d");
        }
        initCanvas();
        animate();
        window.addEventListener("resize", initCanvas);

        return () => {
            window.removeEventListener("resize", initCanvas);
        };
    }, []);

    useEffect(() => {
        initCanvas();
    }, [refresh]);

    const onMouseMove = (e: React.MouseEvent) => {
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const { clientX, clientY } = e;
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            mouse.current.x = x * dpr;
            mouse.current.y = y * dpr;
        }
    };

    const initCanvas = () => {
        resizeCanvas();
        drawParticles();
    };

    const resizeCanvas = () => {
        if (canvasContainerRef.current && canvasRef.current && context.current) {
            canvasSize.current.w = canvasContainerRef.current.offsetWidth;
            canvasSize.current.h = canvasContainerRef.current.offsetHeight;
            canvasRef.current.width = canvasSize.current.w * dpr;
            canvasRef.current.height = canvasSize.current.h * dpr;
            canvasRef.current.style.width = `${canvasSize.current.w}px`;
            canvasRef.current.style.height = `${canvasSize.current.h}px`;
            context.current.scale(dpr, dpr);
        }
    };

    const circleParams = () => {
        const x = Math.floor(Math.random() * canvasSize.current.w);
        const y = Math.floor(Math.random() * canvasSize.current.h);
        const translateX = 0;
        const translateY = 0;
        const size = Math.floor(Math.random() * 2) + 0.1;
        const alpha = 0;
        const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
        const dx = (Math.random() - 0.5) * 0.2;
        const dy = (Math.random() - 0.5) * 0.2;
        const magnetism = 0.1 + Math.random() * 4;
        return {
            x,
            y,
            translateX,
            translateY,
            size,
            alpha,
            targetAlpha,
            dx,
            dy,
            magnetism,
        };
    };

    const hexToRgb = (hex: string): string => {
        hex = hex.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    };

    const drawCircle = (circle: any, update = false) => {
        if (context.current) {
            const { x, y, translateX, translateY, size, alpha } = circle;
            context.current.translate(translateX, translateY);
            context.current.beginPath();
            context.current.arc(x, y, size, 0, 2 * Math.PI);
            context.current.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`;
            context.current.fill();
            context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

            if (!update) {
                circles.current.push(circle);
            }
        }
    };

    const drawParticles = () => {
        circles.current = [];
        for (let i = 0; i < quantity; i++) {
            const circle = circleParams();
            drawCircle(circle);
        }
    };

    const remapValue = (
        value: number,
        start1: number,
        end1: number,
        start2: number,
        end2: number
    ): number => {
        const remapped =
            ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
        return remapped > 0 ? remapped : 0;
    };

    const animate = () => {
        if (context.current) {
            context.current.clearRect(
                0,
                0,
                canvasSize.current.w,
                canvasSize.current.h
            );
            circles.current.forEach((circle: any, i: number) => {
                const edge = [
                    circle.x + circle.translateX - circle.size,
                    canvasSize.current.w - circle.x - circle.translateX - circle.size,
                    circle.y + circle.translateY - circle.size,
                    canvasSize.current.h - circle.y - circle.translateY - circle.size,
                ];
                const closestEdge = edge.reduce((a, b) => Math.min(a, b));
                const remapClosestEdge = parseFloat(
                    remapValue(closestEdge, 0, 20, 0, 1).toFixed(2)
                );
                if (remapClosestEdge > 1) {
                    circle.alpha += 0.02;
                    if (circle.alpha > circle.targetAlpha) {
                        circle.alpha = circle.targetAlpha;
                    }
                } else {
                    circle.alpha = circle.targetAlpha * remapClosestEdge;
                }
                circle.x += circle.dx;
                circle.y += circle.dy;
                circle.translateX +=
                    (mouse.current.x / dpr - circle.translateX) / staticity;
                circle.translateY +=
                    (mouse.current.y / dpr - circle.translateY) / staticity;

                if (
                    circle.x < -circle.size ||
                    circle.x > canvasSize.current.w + circle.size ||
                    circle.y < -circle.size ||
                    circle.y > canvasSize.current.h + circle.size
                ) {
                    circles.current.splice(i, 1);
                    const newCircle = circleParams();
                    drawCircle(newCircle);
                } else {
                    drawCircle(
                        {
                            ...circle,
                            x: circle.x,
                            y: circle.y,
                            translateX: circle.translateX,
                            translateY: circle.translateY,
                            alpha: circle.alpha,
                        },
                        true
                    );
                }
            });
        }
        window.requestAnimationFrame(animate);
    };

    return (
        <div
            className={cn("pointer-events-none", className)}
            ref={canvasContainerRef}
            aria-hidden="true"
            onMouseMove={onMouseMove}
        >
            <canvas ref={canvasRef} />
        </div>
    );
};
