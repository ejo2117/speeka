import React, { useCallback, useMemo, useRef } from "react";
import { useControls } from "leva";
import { useAnimationFrame } from "../hooks/useAnimationFrame";

type CanvasProps = JSX.IntrinsicElements["canvas"] & {
  height: number;
  width: number;
  scale: number;
};

type Bead = {
  x: number;
  y: number;
  radius: number;
};

const Canvas = ({ height = 400, width = 400, scale }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { spacing, ringRadius } = useControls({
    spacing: 10,
    ringRadius: width,
  });

  const canvasCenterX = (scale * width) / 2;
  const canvasCenterY = (scale * height) / 2;

  const angle = 2 * Math.asin(spacing / (2 * ringRadius));
  const numPoints = Math.floor((2 * Math.PI) / angle);

  const beadRing = useMemo(() => {
    const ringPoints = [] as Bead[];
    for (let i = 0; i < numPoints; i++) {
      ringPoints.push({
        x: canvasCenterX + ringRadius * Math.cos((i * 2 * Math.PI) / numPoints),
        y: canvasCenterY + ringRadius * Math.sin((i * 2 * Math.PI) / numPoints),
        radius: 5,
      });
    }
    return ringPoints;
  }, [canvasCenterX, canvasCenterY, numPoints, ringRadius]);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;

    const context = canvasRef.current.getContext("2d")!;
    context.clearRect(0, 0, height * scale, width * scale);

    for (const { x, y, radius: r } of beadRing) {
      context.beginPath();
      context.arc(x + r, y + r, r, 0, 2 * Math.PI);
      context.fillStyle = "#fff";
      context.fill();
    }
  }, [beadRing]);

  useAnimationFrame((time) => {
    draw();
  });

  return (
    <canvas
      ref={canvasRef}
      height={height * scale}
      width={width * scale}
      style={{ height, width }}
    ></canvas>
  );
};

export default Canvas;
