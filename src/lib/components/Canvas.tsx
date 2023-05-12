import React, { useCallback, useMemo, useRef, useState } from "react";
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
  move: (t: number) => Partial<Bead>;
};

type Ring = {
  radius: number;
  beads: Bead[];
};

const Canvas = ({ height = 400, width = 400, scale }: CanvasProps) => {
  // Create a ref so we can interact with the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationStart = useRef(performance.now());
  const lastAnimationTimestamp = useRef<number>(null);
  const elapsedTime = useRef<number>(0);

  // Stateful params all get controlled by Leva
  // Lets us update params live in the browser, but locks us into React
  const {
    spacing,
    outerRingRadius,
    numRings,
    beadRadius,
    drawCenterBead,
    animationRunning,
  } = useControls({
    spacing: 10 * scale,
    outerRingRadius: width,
    numRings: 3,
    beadRadius: 5,
    drawCenterBead: true,
    animationRunning: true,
  });

  // Get center coordinates
  const canvasCenterX = (scale * width) / 2;
  const canvasCenterY = (scale * height) / 2;

  const beadColor =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "#fff"
      : "#000";

  // Ensures smooth animation
  // Define Bead updates here as a function of time
  // From the greatest StackOverflow answer of all time: https://stackoverflow.com/questions/66802877/change-speed-of-request-animation-frame
  const generateMovement = (r: number, i: number) => (t: number) => {
    return {
      radius: Math.abs(Math.sin(t - (i % 31)) * r),
    };
  };

  // Creates each Bead for a given Ring. "useCallback" keeps this in sync with Leva values
  const createBeadRing = useCallback(
    (ringRadius: number, ringIndex: number) => {
      const ringPoints = [] as Bead[];

      // Gives us angle in radians between two arbitrary points with the given spacing on our Ring
      const angle = 2 * Math.asin(spacing / (2 * ringRadius));
      // Gives us the number of points that fit on the Ring's edge
      const numPoints = Math.floor((2 * Math.PI) / angle);
      // Changes where we start drawing on the Ring
      const startingAngle = 0.25 * (2 * Math.PI) * ringIndex;

      for (let i = 0 + startingAngle; i < numPoints + startingAngle; i++) {
        ringPoints.push({
          x:
            canvasCenterX +
            ringRadius * Math.cos((i * 2 * Math.PI) / numPoints),
          y:
            canvasCenterY +
            ringRadius * Math.sin((i * 2 * Math.PI) / numPoints),
          radius: beadRadius,
          // Movement function is defined at Bead creation, to be invoked later
          move: generateMovement(beadRadius, i),
        });
      }
      return ringPoints;
    },
    [beadRadius, canvasCenterX, canvasCenterY, spacing]
  );

  // Creates each Ring that will be rendered to the Canvas. "useMemo" keeps this in sync with Leva values
  const ringLayers = useMemo(() => {
    const rings = [] as Ring[];

    for (let i = 0; i < numRings; i++) {
      const radius = outerRingRadius - i * (outerRingRadius / numRings);
      rings.push({ radius, beads: createBeadRing(radius, i + 1) });
    }

    return rings;
  }, [createBeadRing, numRings, outerRingRadius]);

  const draw = useCallback(
    (t) => {
      if (!canvasRef.current) return;

      const context = canvasRef.current.getContext("2d");

      // Wipe the canvas on every frame update
      context.clearRect(0, 0, height * scale, width * scale);

      // Iterate over each layer, and draw each bead within that layer
      for (const { beads } of ringLayers) {
        for (const { x, y, radius: defaultRadius, move } of beads) {
          const radius = animationRunning ? move(t).radius : defaultRadius;

          context.beginPath();
          context.arc(x, y, radius, 0, 2 * Math.PI);
          context.fillStyle = beadColor;
          context.fill();
        }
      }

      if (drawCenterBead) {
        const centerBeadRadius = animationRunning
          ? generateMovement(beadRadius, 0)(t).radius
          : beadRadius;

        context.beginPath();
        context.arc(
          canvasCenterX,
          canvasCenterY,
          centerBeadRadius,
          0,
          2 * Math.PI
        );
        context.fillStyle = beadColor;
        context.fill();
      }
    },
    [
      height,
      scale,
      width,
      drawCenterBead,
      ringLayers,
      animationRunning,
      beadColor,
      canvasCenterX,
      canvasCenterY,
      beadRadius,
    ]
  );

  useAnimationFrame((time) => {
    if (!lastAnimationTimestamp.current) {
      lastAnimationTimestamp.current = time;
    }

    draw((time - animationStart.current) / 1000);
    lastAnimationTimestamp.current = time;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <canvas
        ref={canvasRef}
        height={height * scale}
        width={width * scale}
        style={{ height, width }}
      ></canvas>
    </div>
  );
};

export default Canvas;
