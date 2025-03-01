"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { motion, animate, useMotionValue } from "framer-motion";
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

/**
 * Helper function to build a single continuous path string from the start (index 0)
 * to the current checkpoint (avatarIndex) by concatenating each segment's path.
 */
function getFullPath(positions, avatarIndex, radius = 8) {
  if (avatarIndex === 0) return "";
  let fullPath = "";
  for (let i = 0; i < avatarIndex; i++) {
    let segment = getRoundedZigZagPath(positions[i], positions[i + 1], radius);
    if (i > 0) {
      const firstL = segment.indexOf("L");
      if (firstL !== -1) {
        segment = segment.substring(firstL);
      }
    }
    fullPath += segment + " ";
  }
  return fullPath.trim();
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

  const lastCompletedIndex = progress.lastIndexOf(true);
  const avatarIndex =
    lastCompletedIndex === -1
      ? 0
      : Math.min(lastCompletedIndex + 1, roadmapData.length - 1);
  const avatarPosition = stepPositions[avatarIndex];

  // Determine which step is the next step after the avatar
  const nextStepIndex = avatarIndex < totalSteps - 1 ? avatarIndex : -1;

  // Motion values for avatar animation along the SVG path
  const pathProgress = useMotionValue(0);
  const avatarX = useMotionValue(avatarPosition.x);
  const avatarY = useMotionValue(avatarPosition.y);
  const avatarPathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  // Store previous avatar index to animate only new segments
  const [prevAvatarIndex, setPrevAvatarIndex] = useState(0);
  // Ref to detect the first animation (page refresh scenario)

  // Effect to animate the avatar along the appropriate path.
  useEffect(() => {
    let animPathString = "";
    if (prevAvatarIndex === 0 && avatarIndex > 0) {
      // On initial mount with progress, animate full path from start to current checkpoint.
      animPathString = getFullPath(stepPositions, avatarIndex, 8);
    } else if (avatarIndex > prevAvatarIndex) {
      // New lesson clicked: animate only from previous checkpoint to new checkpoint.
      animPathString = getRoundedZigZagPath(
        stepPositions[prevAvatarIndex],
        stepPositions[avatarIndex],
        8
      );
    } else {
      return; // No new animation needed.
    }

    if (animPathString && avatarPathRef.current) {
      // Update the invisible path's "d" attribute.
      avatarPathRef.current.setAttribute("d", animPathString);
      const length = avatarPathRef.current.getTotalLength();
      setPathLength(length);
      pathProgress.set(0);
      const controls = animate(pathProgress, 1, {
        duration: 1,
        ease: "easeInOut",
      });
      return () => controls.stop();
    }
  }, [avatarIndex, stepPositions, prevAvatarIndex, pathProgress]);

  // Sync avatar motion values with computed avatarPosition when container dimensions update.
  useEffect(() => {
    avatarX.set(avatarPosition.x);
    avatarY.set(avatarPosition.y);
  }, [avatarPosition, avatarX, avatarY]);

  // Update avatar position and update prevAvatarIndex when animation completes.
  useEffect(() => {
    const unsubscribe = pathProgress.on("change", (latest) => {
      if (avatarPathRef.current && pathLength) {
        const point = avatarPathRef.current.getPointAtLength(
          latest * pathLength
        );
        avatarX.set(point.x);
        avatarY.set(point.y);
      }
      // When the animation completes, update prevAvatarIndex
      if (latest === 1 && avatarIndex > prevAvatarIndex) {
        setPrevAvatarIndex(avatarIndex);
      }
    });
    return unsubscribe;
  }, [
    pathProgress,
    pathLength,
    avatarX,
    avatarY,
    avatarIndex,
    prevAvatarIndex,
  ]);

  // Convert a coordinate to percentage for node positioning.
  const toPercentage = (point) => ({
    left: `${(point.x / actualWidth) * 100}%`,
    top: `${(point.y / computedHeight) * 100}%`,
  });

  // Handle lesson click: mark progress, animate avatar, and then navigate.
  const handleLessonClick = (index) => {
    if (progress[index]) {
      toast.success(`Navigating to ${roadmapData[index].moduleTitle}...`);
      setTimeout(() => {
        router.push(`/courses/${roadmapData[index].slug}`);
      }, 1000);
      return;
    }

    const updated = [...progress];
    updated[index] = true;
    setProgress(updated);

    // Create a promise that resolves after 1 second to mimic avatar animation completion.
    const animationPromise = new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    toast.promise(animationPromise, {
      loading: `Completing ${roadmapData[index].moduleTitle}`,
      success: `Navigating to ${roadmapData[index].moduleTitle}...`,
      error: `Failed to complete ${roadmapData[index].moduleTitle}`,
    });

    // Once the animation completes, wait another second before navigating.
    animationPromise.then(() => {
      setTimeout(() => {
        router.push(`/courses/${roadmapData[index].slug}`);
      }, 1000);
    });
  };

  return mounted ? (
    <main className="min-h-screen my-8">
      <h1 className="text-3xl font-bold text-gray-300 px-8 sm:px-16 text-center sm:text-left">
        Interactive Roadmap
      </h1>

      <div className="text-center sm:text-left px-8 sm:px-16 mt-4">
        <button
          onClick={() => {
            // Reset the progress for all lessons
            setProgress(roadmapData.map(() => false));
            // Reset the animation state for the avatar
            setPrevAvatarIndex(0);
            pathProgress.set(0);
            // Immediately reset the avatar's position to the first node
            avatarX.set(stepPositions[0].x);
            avatarY.set(stepPositions[0].y);
          }}
          className="px-2 py-1 text-xs border border-[rgba(220,38,38,1)] text-[rgba(220,38,38,1)] hover:border-[rgba(220,38,38,0.8)] hover:text-[rgba(220,38,38,0.8)] rounded-full cursor-pointer"
        >
          Reset Progress
        </button>
      </div>

      {/* Outer container: position relative so we can absolutely position SVG + nodes.
          The container now uses full available width but is capped by maxWidth based on device type,
          and overflow is visible so info cards aren't clipped. */}
      <div
        ref={containerRef}
        className="relative mx-auto w-full overflow-visible mt-24 sm:mt-16"
        style={{
          height: computedHeight,
          maxWidth: isMobile ? "300px" : "480px",
        }}
      >
        {/* SVG: renders the road paths and an invisible path for avatar animation */}
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
            {/* Neon glow filter */}
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
          {/* Invisible path for avatar motion */}
          <path
            ref={avatarPathRef}
            fill="none"
            stroke="none"
            style={{ opacity: 0 }}
          />
        </svg>

        {/* Animated avatar following the curved road */}
        <motion.div
          className="absolute z-30 flex flex-col items-center"
          style={{
            left: avatarX,
            top: avatarY,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden flex items-center justify-center">
            <img
              src="/images/user.jpg"
              alt="User avatar"
              className="object-cover w-full h-full"
            />
          </div>
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
              ? pos.x > actualWidth / 2
                ? "-ml-32"
                : "ml-32"
              : pos.x > actualWidth / 2
              ? "-ml-32"
              : "ml-32";

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
  ) : null;
}
