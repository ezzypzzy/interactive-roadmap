"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { roadmapData } from "../data/roadmapData";
import { CheckIcon } from "./components/Icons";

// Helper hook for managing localStorage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error("useLocalStorage error:", error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error("useLocalStorage error:", error);
    }
  };

  return [storedValue, setValue];
}

// Hook to detect if the screen width is < 640px
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}

/**
 * Helper function to get direction of a segment (vertical/horizontal).
 * Returns "up", "down", "left", or "right" for 90° lines, or null otherwise.
 */
function getDirection(p0, p1) {
  if (p1.x === p0.x) {
    return p1.y > p0.y ? "down" : "up";
  } else if (p1.y === p0.y) {
    return p1.x > p0.x ? "right" : "left";
  }
  return null; // for non-90° lines
}

/**
 * For two directions (e.g., "down" -> "right"), returns the geometry needed
 * to draw a 90° arc at the corner point. The `lineStart` is where we finish
 * the straight segment before the corner, and `arcEnd` is where the arc finishes,
 * so that we can continue the next line from there.
 *
 * The `sweep` flag (0 or 1) tells SVG which way to draw the arc.
 */
function cornerArc(d1, d2, corner, r) {
  if (!d1 || !d2 || d1 === d2) return null;

  const map = {
    "down->right": {
      lineStart: { x: corner.x, y: corner.y - r },
      arcEnd: { x: corner.x + r, y: corner.y },
      sweep: 0,
    },
    "down->left": {
      lineStart: { x: corner.x, y: corner.y - r },
      arcEnd: { x: corner.x - r, y: corner.y },
      sweep: 1,
    },
    "up->right": {
      lineStart: { x: corner.x, y: corner.y + r },
      arcEnd: { x: corner.x + r, y: corner.y },
      sweep: 1,
    },
    "up->left": {
      lineStart: { x: corner.x, y: corner.y + r },
      arcEnd: { x: corner.x - r, y: corner.y },
      sweep: 0,
    },
    "left->down": {
      lineStart: { x: corner.x + r, y: corner.y },
      arcEnd: { x: corner.x, y: corner.y + r },
      sweep: 0,
    },
    "left->up": {
      lineStart: { x: corner.x + r, y: corner.y },
      arcEnd: { x: corner.x, y: corner.y - r },
      sweep: 1,
    },
    "right->down": {
      lineStart: { x: corner.x - r, y: corner.y },
      arcEnd: { x: corner.x, y: corner.y + r },
      sweep: 1,
    },
    "right->up": {
      lineStart: { x: corner.x - r, y: corner.y },
      arcEnd: { x: corner.x, y: corner.y - r },
      sweep: 0,
    },
  };

  const key = `${d1}->${d2}`;
  return map[key] || null;
}

/**
 * Return a path string with three 90-degree turns (four segments total), but
 * each corner is drawn with an arc instead of a sharp turn.
 */
function getRoundedZigZagPath(start, end, radius = 8) {
  // mid1 & mid2 define intermediate y-coordinates to create the zig-zag
  const mid1 = (start.y + end.y) / 2 - 40;
  const mid2 = (start.y + end.y) / 2 + 40;

  // The 5 key points in the path
  const p0 = { x: start.x, y: start.y };
  const p1 = { x: start.x, y: mid1 };
  const p2 = { x: end.x, y: mid1 };
  const p3 = { x: end.x, y: mid2 };
  const p4 = { x: end.x, y: end.y };

  // Directions for each segment
  const d1 = getDirection(p0, p1);
  const d2 = getDirection(p1, p2);
  const d3 = getDirection(p2, p3);
  const d4 = getDirection(p3, p4);

  // Start building the path
  let path = `M ${p0.x},${p0.y}`;

  // Corner 1 (between segments 1 and 2) at p1
  const c1 = cornerArc(d1, d2, p1, radius);
  if (c1) {
    path += ` L ${c1.lineStart.x},${c1.lineStart.y}`;
    path += ` A ${radius} ${radius} 0 0 ${c1.sweep} ${c1.arcEnd.x},${c1.arcEnd.y}`;
  } else {
    path += ` L ${p1.x},${p1.y}`;
  }

  // Corner 2 (between segments 2 and 3) at p2
  const c2 = cornerArc(d2, d3, p2, radius);
  if (c2) {
    path += ` L ${c2.lineStart.x},${c2.lineStart.y}`;
    path += ` A ${radius} ${radius} 0 0 ${c2.sweep} ${c2.arcEnd.x},${c2.arcEnd.y}`;
  } else {
    path += ` L ${p2.x},${p2.y}`;
  }

  // Corner 3 (between segments 3 and 4) at p3
  // For typical zig-zag, p3 -> p4 might be the same direction (both vertical),
  // so there's no corner. But we handle it generally:
  const c3 = cornerArc(d3, d4, p3, radius);
  if (c3) {
    path += ` L ${c3.lineStart.x},${c3.lineStart.y}`;
    path += ` A ${radius} ${radius} 0 0 ${c3.sweep} ${c3.arcEnd.x},${c3.arcEnd.y}`;
  } else {
    path += ` L ${p3.x},${p3.y}`;
  }

  // Finally line to p4
  path += ` L ${p4.x},${p4.y}`;

  return path;
}

export default function HomePage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  // Ref and state to measure the container's width for responsive calculations
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Set fallback width based on device type
  const fallbackWidth = isMobile ? 300 : 480;
  // actualWidth is the measured width or fallback width
  const actualWidth = containerWidth || fallbackWidth;

  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Initialize progress for each lesson (all false by default)
  const [progress, setProgress] = useLocalStorage(
    "roadmapProgress",
    roadmapData.map(() => false)
  );

  // Prevent hydration mismatches by waiting until the component mounts
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  // Define layout parameters based on device type
  const totalSteps = roadmapData.length;
  const verticalSpacing = isMobile ? 200 : 150; // vertical gap between nodes
  const topMargin = isMobile ? 0 : 0;
  const bottomMargin = isMobile ? 0 : 0;

  // Compute the dynamic height of the roadmap based on number of lessons
  const computedHeight =
    topMargin + bottomMargin + verticalSpacing * (totalSteps - 1);

  // Dynamically calculate the positions for each lesson/node
  // For the first and last nodes, we center them horizontally.
  // For the intermediate nodes, alternate between left and right.
  const horizontalPadding = 24; // a small padding from the edge
  const stepPositions = roadmapData.map((_, index) => {
    let x;
    if (index === 0 || index === totalSteps - 1) {
      x = actualWidth / 2;
    } else {
      x = index % 2 === 1 ? actualWidth - horizontalPadding : horizontalPadding;
    }
    let y = topMargin + verticalSpacing * index;
    return { x, y };
  });

  // Number of lessons completed
  const completedCount = progress.filter(Boolean).length;

  // The avatar jumps to the position of the last completed step.
  // If no steps are completed, it stays at step 0.
  const avatarIndex = Math.min(completedCount, roadmapData.length - 1);
  const avatarPosition = stepPositions[avatarIndex];

  // Determine which step is the next step after the avatar
  const nextStepIndex = avatarIndex < totalSteps - 1 ? avatarIndex : -1;

  // Convert a coordinate to percentage relative to the dynamic SVG viewBox
  const toPercentage = (point) => ({
    left: `${(point.x / actualWidth) * 100}%`,
    top: `${(point.y / computedHeight) * 100}%`,
  });

  // Animate the avatar from its previous position to the new one using percentages
  const avatarVariants = {
    initial: toPercentage(stepPositions[0]),
    animate: {
      ...toPercentage(avatarPosition),
      transition: { type: "spring", stiffness: 100 },
    },
  };

  // Handle lesson click: update progress, show toast, then navigate
  const handleLessonClick = (index) => {
    const updated = [...progress];
    updated[index] = true;
    setProgress(updated);

    toast.success(`Navigating to ${roadmapData[index].moduleTitle}...`);
    router.push(`/courses/${roadmapData[index].slug}`);
  };

  return (
    <main className="min-h-screen my-8">
      <h1 className="text-3xl font-bold text-gray-300 px-8 sm:px-16 text-center sm:text-left">
        Interactive Roadmap
      </h1>

      {/* Outer container: position relative so we can absolutely position SVG + nodes.
          The container now uses full available width but is capped by maxWidth based on device type,
          and overflow is visible so info cards aren't clipped. */}
      <div
        ref={containerRef}
        className="relative mx-auto w-full overflow-visible mt-16"
        style={{
          height: computedHeight,
          maxWidth: isMobile ? "300px" : "480px",
        }}
      >
        {/* Render the paths for each segment from step i to step i+1 */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${actualWidth} ${computedHeight}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Define a linear gradient for completed segments */}
            <linearGradient id="pathGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#D22D1E" />
              <stop offset="50%" stopColor="#963AB1" />
              <stop offset="100%" stopColor="#20469B" />
            </linearGradient>

            {/* Define a neon glow filter */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {roadmapData.map((_, index) => {
            if (index === roadmapData.length - 1) return null;
            const start = stepPositions[index];
            const end = stepPositions[index + 1];

            // If user has completed step index, consider the segment "completed"
            const isSegmentComplete = progress[index];

            // Build the arc-based path
            const d = getRoundedZigZagPath(start, end, 8);

            return (
              <path
                key={index}
                d={d}
                stroke={isSegmentComplete ? "url(#pathGradient)" : "#40373C"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                filter={isSegmentComplete ? "url(#neonGlow)" : undefined}
              />
            );
          })}
        </svg>

        {/* Animated avatar (location-marker style) that moves to the last completed step */}
        <motion.div
          className="absolute z-30 flex flex-col items-center"
          variants={avatarVariants}
          initial="initial"
          animate="animate"
          style={{
            // Shift left by 50% to center horizontally, shift up by 100% so the tip is the anchor
            transform: "translate(-50%, -100%)",
          }}
        >
          {/* Circular top with white border and user image inside */}
          <div className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden flex items-center justify-center">
            <img
              src="/images/user.jpg"
              alt="User avatar"
              className="object-cover w-full h-full"
            />
          </div>

          {/* Triangular pointer below the circle */}
          <div className="w-0 h-0 border-l-4 border-r-4 border-l-transparent border-r-transparent border-t-6 border-t-white bg-cover" />
        </motion.div>

        {/* Render each node + info card at the specified positions */}
        {roadmapData.map((lesson, index) => {
          const pos = stepPositions[index];
          const isCompleted = progress[index];

          // Decide whether to place the card to the left or right based on node position
          // For the first and last checkpoints, we don't apply the offset margin.
          const marginClass =
            index === 0 || index === roadmapData.length - 1
              ? ""
              : isMobile
              ? isRightSide(pos, actualWidth)
                ? "-ml-32"
                : "ml-32"
              : isRightSide(pos, actualWidth)
              ? "-ml-32"
              : "ml-32";

          function isRightSide(position, width) {
            return position.x > width / 2;
          }

          // Convert absolute coordinates to percentages for responsiveness
          const posPercent = {
            left: `${(pos.x / actualWidth) * 100}%`,
            top: `${(pos.y / computedHeight) * 100}%`,
          };

          // Determine the node styling
          let nodeStyleClasses;
          if (isCompleted) {
            nodeStyleClasses =
              "bg-gradient-to-r from-[#D22D1E] via-[#963AB1] to-[#20469B] border-[#EDEDED]";
          } else if (index === nextStepIndex) {
            nodeStyleClasses = "bg-[#232328] border-[#EDEDED]";
          } else {
            nodeStyleClasses = "bg-[#232328] border-[#40373C]";
          }

          return (
            <div
              key={lesson.id}
              className="absolute flex flex-col items-center z-20"
              style={{
                top: posPercent.top,
                left: posPercent.left,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* The clickable circle (step node) */}
              <button
                onClick={() => handleLessonClick(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors border-4 ${nodeStyleClasses}`}
                aria-label={`Lesson ${lesson.moduleTitle}`}
              >
                {isCompleted ? "✓" : ""}
              </button>

              {/* Info card offset to the side (only applied on intermediate checkpoints) */}
              <div
                className={`absolute top-10 w-64 bg-[rgba(30,30,30,0.75)] rounded-lg p-4 shadow-lg ${marginClass} sm:ml-0`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-[rgb(68,62,50,1)] text-[rgb(226,171,64,1)] text-xs font-bold px-2 rounded">
                    {lesson.moduleTitle}
                  </span>

                  {isCompleted && <CheckIcon />}
                </div>
                <p className="mt-2 text-gray-300 text-sm">
                  {lesson.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
