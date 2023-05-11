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

type Ring = {
  radius: number;
  beads: Bead[];
};

const Canvas = ({ height = 400, width = 400, scale }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { spacing, outerRingRadius, numRings, beadRadius } = useControls({
    spacing: 10 * scale,
    outerRingRadius: width,
    numRings: 3,
    beadRadius: 5,
  });

  const canvasCenterX = (scale * width) / 2;
  const canvasCenterY = (scale * height) / 2;

  const createBeadRing = useCallback(
    (ringRadius: number) => {
      const ringPoints = [] as Bead[];
      const angle = 2 * Math.asin(spacing / (2 * ringRadius));
      const numPoints = Math.floor((2 * Math.PI) / angle);
      for (let i = 0; i < numPoints; i++) {
        ringPoints.push({
          x:
            canvasCenterX +
            ringRadius * Math.cos((i * 2 * Math.PI) / numPoints),
          y:
            canvasCenterY +
            ringRadius * Math.sin((i * 2 * Math.PI) / numPoints),
          radius: beadRadius,
        });
      }
      return ringPoints;
    },
    [canvasCenterX, canvasCenterY, spacing, beadRadius]
  );

  const ringLayers = useMemo(() => {
    const rings = [] as Ring[];

    for (let i = 0; i < numRings; i++) {
      const radius = outerRingRadius - i * (outerRingRadius / numRings);
      rings.push({ radius, beads: createBeadRing(radius) });
    }

    return rings;
  }, [createBeadRing, numRings, outerRingRadius]);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");

    // Wipe the canvas on every frame update
    context.clearRect(0, 0, height * scale, width * scale);

    // Iterate over each layer, and draw each bead within that layer
    for (const { beads } of ringLayers) {
      for (const { x, y, radius: r } of beads) {
        context.beginPath();
        context.arc(x + r, y + r, r, 0, 2 * Math.PI);
        context.fillStyle = "#fff";
        context.fill();
      }
    }
  }, [height, ringLayers, scale, width]);

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
