"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { roadmapData } from "../data/roadmapData";

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

// Return a polyline string with three 90-degree turns (four segments total).
function getZigZagPoints(start, end) {
  // mid1 & mid2 define intermediate y-coordinates to create the zig-zag
  const mid1 = (start.y + end.y) / 2 - 40; // tweak these offsets
  const mid2 = (start.y + end.y) / 2 + 40; // to get the desired shape

  return [
    `${start.x},${start.y}`, // start
    `${start.x},${mid1}`, // vertical
    `${end.x},${mid1}`, // horizontal
    `${end.x},${mid2}`, // vertical
    `${end.x},${end.y}`, // final horizontal
  ].join(" ");
}

// Desktop coordinates (x,y) for each step in a 500x900 viewBox
const stepPositionsDesktop = [
  { x: 250, y: 50 }, // Step 0 (center top)
  { x: 500, y: 200 }, // Step 1 (far right)
  { x: 0, y: 350 }, // Step 2 (far left)
  { x: 500, y: 500 }, // Step 3 (far right)
  { x: 250, y: 650 }, // Step 4 (center bottom)
];

// Mobile coordinates: same pattern, but with more vertical space
const stepPositionsMobile = [
  { x: 250, y: 100 }, // Step 0
  { x: 500, y: 300 }, // Step 1
  { x: 0, y: 500 }, // Step 2
  { x: 500, y: 700 }, // Step 3
  { x: 250, y: 900 }, // Step 4
];

export default function HomePage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  // Pick which array of positions to use
  const stepPositions = isMobile ? stepPositionsMobile : stepPositionsDesktop;

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

  // Number of lessons completed
  const completedCount = progress.filter(Boolean).length;

  // The avatar will jump to the position of the last completed step
  // If no steps are completed, it stays at step 0
  const avatarIndex = Math.min(completedCount, roadmapData.length - 1);
  const avatarPosition = stepPositions[avatarIndex];

  // Convert a coordinate to percentage relative to the SVG viewBox (500x900)
  const toPercentage = (point) => ({
    left: `${(point.x / 500) * 100}%`,
    top: `${(point.y / 900) * 100}%`,
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
    <main className="min-h-screen bg-[#140f14] text-white px-16">
      <h1 className="text-3xl font-bold mb-8">Interactive Roadmap</h1>

      {/* Outer container: position relative so we can absolutely position SVG + nodes */}
      <div
        className="relative mx-auto w-full max-w-[500px]"
        style={{ aspectRatio: "500 / 900" }}
      >
        {/* SVG for the zig-zag path */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 500 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Define a linear gradient for completed segments */}
            <linearGradient
              id="pathGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#8A2BE2" /> {/* violet */}
              <stop offset="50%" stopColor="#FF00FF" /> {/* magenta */}
              <stop offset="100%" stopColor="#FF1493" /> {/* pink/red */}
            </linearGradient>
          </defs>

          {/* Draw polylines from step i to step i+1 */}
          {roadmapData.map((_, index) => {
            if (index === roadmapData.length - 1) return null;
            const start = stepPositions[index];
            const end = stepPositions[index + 1];

            // If user has completed step index, we consider the segment "completed"
            const isSegmentComplete = progress[index];

            return (
              <polyline
                key={index}
                points={getZigZagPoints(start, end)}
                stroke={isSegmentComplete ? "url(#pathGradient)" : "#4a4a4a"}
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Animated avatar that moves to the last completed step */}
        <motion.div
          className="absolute w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center z-30"
          variants={avatarVariants}
          initial="initial"
          animate="animate"
          style={{
            transform: "translate(-50%, -50%)", // center the avatar over the point
          }}
        >
          <span className="text-xl">👤</span>
        </motion.div>

        {/* Render each node + info card at the specified positions */}
        {roadmapData.map((lesson, index) => {
          const pos = stepPositions[index];
          const isCompleted = progress[index];

          // Decide whether to place the card to the left or right
          // (so it doesn't overlay the path)
          const isRightSide = pos.x > 200;

          // Convert absolute coordinates to percentages for responsiveness
          const posPercent = {
            left: `${(pos.x / 500) * 100}%`,
            top: `${(pos.y / 900) * 100}%`,
          };

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
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors border-4 ${
                  isCompleted
                    ? "bg-gradient-to-r from-[#D22D1E] via-[#963AB1] to-[#20469B] border-gray-200"
                    : "bg-[#232328] border-[#40373c]"
                }`}
                aria-label={`Lesson ${lesson.moduleTitle}`}
              >
                {isCompleted ? "✓" : index + 1}
              </button>

              {/* Info card offset to the side */}
              <div
                className={`absolute top-10 w-64 bg-[rgba(30,30,30,0.75)] rounded-lg p-4 shadow-lg 
                  ${isRightSide ? "-ml-32" : "ml-32"} sm:ml-0`}
              >
                <span className="inline-block bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                  {lesson.moduleTitle}
                </span>
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
