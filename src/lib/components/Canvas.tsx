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
  color: `#${string}`;
};

type Ring = {
  radius: number;
  beads: Bead[];
};

const Canvas = ({ height = 400, width = 400, scale }: CanvasProps) => {
  // Create a ref so we can interact with the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationStart = useRef(performance.now());

  // Stateful params all get controlled by Leva
  // Lets us update params live in the browser, but locks us into React
  const {
    spacing,
    outerRingRadius,
    numRings,
    beadRadius,
    drawCenterBead,
    animationRunning,
    rotation,
    color1,
    color2,
  } = useControls({
    spacing: 20 * scale,
    outerRingRadius: width,
    numRings: 5,
    beadRadius: 15,
    drawCenterBead: true,
    animationRunning: true,
    rotation: 0,
    color1: "#000",
    color2: "#080593",
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
  const generateMovement = useCallback(
    (r: number, i: number, x?: number, y?: number, ring?: number) =>
      (t: number) => {
        const { abs, cos, sin, sqrt, tan, min, log } = Math;

        const level = sin(log(i + 2) * t);

        return {
          radius: abs(level * r),
          color: level < 0 ? color2 : color1,
        } as Partial<Bead>;
      },
    [color1, color2]
  );

  // Creates each Bead for a given Ring. "useCallback" keeps this in sync with Leva values
  const createBeadRing = useCallback(
    (ringRadius: number, ringIndex: number) => {
      const ringPoints = [] as Bead[];

      // Gives us angle in radians between two arbitrary points with the given spacing on our Ring
      const angle = 2 * Math.asin(spacing / (2 * ringRadius));
      // Gives us the number of points that fit on the Ring's edge
      const numPoints = Math.floor((2 * Math.PI) / angle);
      // Changes where we start drawing on the Ring
      const startingAngle = rotation * (2 * Math.PI) * ringIndex;

      for (let i = 0 + startingAngle; i < numPoints + startingAngle; i++) {
        const position = [
          canvasCenterX + ringRadius * Math.cos((i * 2 * Math.PI) / numPoints),
          canvasCenterY + ringRadius * Math.sin((i * 2 * Math.PI) / numPoints),
        ];

        ringPoints.push({
          x: position[0],
          y: position[1],
          radius: beadRadius,
          // Movement function is defined at Bead creation, to be invoked later
          move: generateMovement(
            beadRadius,
            i,
            position[0],
            position[1],
            ringIndex
          ),
          color: beadColor,
        });
      }
      return ringPoints;
    },
    [
      beadColor,
      beadRadius,
      canvasCenterX,
      canvasCenterY,
      generateMovement,
      rotation,
      spacing,
    ]
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
    (t: number) => {
      if (!canvasRef.current) return;

      const context = canvasRef.current.getContext("2d");

      // Wipe the canvas on every frame update
      context.clearRect(0, 0, height * scale, width * scale);

      // Iterate over each layer, and draw each bead within that layer
      for (const { beads } of ringLayers) {
        for (const { x, y, radius: defaultRadius, move } of beads) {
          const { radius, color } = animationRunning
            ? move(t)
            : { radius: defaultRadius, color: beadColor };

          // const radius = animationRunning ? move(t).radius : defaultRadius;

          context.beginPath();
          context.arc(x, y, radius, 0, 2 * Math.PI);
          context.fillStyle = color;
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
        context.fillStyle = generateMovement(beadRadius, 0)(t).color;
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
      generateMovement,
      beadRadius,
      canvasCenterX,
      canvasCenterY,
      beadColor,
    ]
  );

  useAnimationFrame((time) => {
    draw((time - animationStart.current) / 1000);
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
