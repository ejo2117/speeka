import React, { useCallback, useMemo, useRef, useState } from "react";
import { useControls } from "leva";
import { useAnimationFrame } from "../hooks/useAnimationFrame";
import Noise from "../utils/noise";

type CanvasProps = JSX.IntrinsicElements["canvas"] & {
  height: number;
  width: number;
  scale: number;
};

type Point = {
  x: number;
  y: number;
  radius: number;
  move: (t: number) => Partial<Point>;
  color: `#${string}`;
};

const NoiseMap = ({ height = 400, width = 400, scale }: CanvasProps) => {
  // Create a ref so we can interact with the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationStart = useRef(performance.now());

  // Stateful params all get controlled by Leva
  // Lets us update params live in the browser, but locks us into React
  const { nodes, seed } = useControls({
    nodes: { value: 256, step: 4 },
    seed: { value: Math.random(), step: 0.1 },
  });

  // Get center coordinates
  const canvasCenterX = (scale * width) / 2;
  const canvasCenterY = (scale * height) / 2;

  const color =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "#fff"
      : "#000";

  // Ensures smooth animation
  // Define Point updates here as a function of time
  // From the greatest StackOverflow answer of all time: https://stackoverflow.com/questions/66802877/change-speed-of-request-animation-frame
  const generateMovement = useCallback(
    () => (t: number) => {
      const { abs, cos, sin, sqrt, tan, min, log } = Math;

      const level = sin(t);

      return {} as Partial<Point>;
    },
    []
  );

  const noise = useMemo(() => new Noise(seed), [seed]);

  const draw = useCallback(
    (t: number) => {
      if (!canvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d");
      const realPixel = (width * scale) / nodes;

      // Wipe the canvas on every frame update
      ctx.clearRect(0, 0, height * scale, width * scale);

      for (let y = 0; y < width * scale; y += realPixel) {
        for (let x = 0; x < width * scale; x += realPixel) {
          const v = Math.abs(noise.perlin2(x / 100, y / 100));
          ctx.fillStyle = `rgba(0,0,0, ${Math.abs(v)})`;
          ctx.fillRect(x, y, realPixel, realPixel);
        }
      }
    },
    [height, nodes, noise, scale, width]
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

export default NoiseMap;
