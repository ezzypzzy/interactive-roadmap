"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// SAMPLE lessons data (title, description, and the URL to navigate to).
// We'll later store each lesson's progress in localStorage by its index.
const lessonsData = [
  {
    id: 1,
    title: "Introduction to Python",
    description: "How to Learn Python Step by Step",
    url: "/courses/python-intro",
  },
  {
    id: 2,
    title: "Complete Tutorial: Learn Data Python from Scratch",
    description: "Advanced tutorial for data science with Python",
    url: "/courses/python-data",
  },
  {
    id: 3,
    title: "More content",
    description: "Lorem ipsum dolor sit amet",
    url: "/courses/more",
  },
];

// Helper hook for localStorage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item =
        typeof window !== "undefined" && window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
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

export default function HomePage() {
  const router = useRouter();

  // Each lesson is either completed (true) or not (false).
  // Initialize all to 'false' unless we already have something in localStorage.
  const [progress, setProgress] = useLocalStorage(
    "roadmapProgress",
    lessonsData.map(() => false)
  );

  // The avatar’s position is based on how many lessons are completed.
  const completedCount = progress.filter(Boolean).length;

  // Animate the avatar from step to step
  const avatarVariants = {
    initial: { y: 0 },
    animate: {
      // Example offset: 120px between steps
      y: completedCount * 120,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  // When a user clicks a lesson node:
  // 1. Mark that lesson as completed
  // 2. Show a toast message
  // 3. Navigate to the lesson page
  const handleLessonClick = (index) => {
    const updated = [...progress];
    updated[index] = true; // Mark this lesson as completed
    setProgress(updated);

    toast.success(`Navigating to ${lessonsData[index].title}...`);

    // Navigate to that lesson’s URL
    router.push(lessonsData[index].url);
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">Interactive Roadmap</h1>

      <div className="relative mx-auto max-w-xl">
        {/* A vertical line down the middle (we can style or replace with an SVG path later) */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-full bg-gray-700" />

        {/* The “avatar” that moves according to completed steps */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center z-10"
          variants={avatarVariants}
          initial="initial"
          animate="animate"
        >
          {/* Could replace with an actual image */}
          <span className="text-xl">👤</span>
        </motion.div>

        {/* Lesson circles */}
        <div className="flex flex-col items-center space-y-20 pt-4">
          {lessonsData.map((lesson, index) => (
            <div
              key={lesson.id}
              className="relative flex flex-col items-center"
            >
              {/* The circle for the node */}
              <button
                onClick={() => handleLessonClick(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${
                    progress[index]
                      ? "bg-green-600"
                      : "bg-blue-600 hover:bg-blue-500"
                  }
                `}
                aria-label={`Lesson ${lesson.title}`}
              >
                {/* If completed, show a checkmark; otherwise show the step number */}
                {progress[index] ? "✓" : index + 1}
              </button>

              {/* Lesson info text */}
              <div className="mt-3 text-center px-2">
                <h2 className="font-semibold text-lg">{lesson.title}</h2>
                <p className="text-gray-400 text-sm">{lesson.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
