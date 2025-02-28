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

export default function HomePage() {
  const router = useRouter();

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

  // Calculate completed lessons count for avatar positioning
  const completedCount = progress.filter(Boolean).length;

  // Define avatar animation variants based on completedCount
  const avatarVariants = {
    initial: { y: 0 },
    animate: {
      y: completedCount * 120, // 120px per completed lesson
      transition: { type: "spring", stiffness: 100 },
    },
  };

  // Handle lesson click: update progress, show toast, then navigate
  const handleLessonClick = (index) => {
    const updated = [...progress];
    updated[index] = true;
    setProgress(updated);

    toast.success(`Navigating to ${roadmapData[index].moduleTitle}...`);

    // Use the dynamic slug to navigate
    router.push(`/courses/${roadmapData[index].slug}`);
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">Interactive Roadmap</h1>

      <div className="relative mx-auto max-w-xl">
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-full bg-gray-700" />

        {/* Animated avatar */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center z-10"
          variants={avatarVariants}
          initial="initial"
          animate="animate"
        >
          <span className="text-xl">👤</span>
        </motion.div>

        {/* Lesson nodes */}
        <div className="flex flex-col items-center space-y-20 pt-4">
          {roadmapData.map((lesson, index) => (
            <div
              key={lesson.id}
              className="relative flex flex-col items-center"
            >
              <button
                onClick={() => handleLessonClick(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  progress[index]
                    ? "bg-green-600"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
                aria-label={`Lesson ${lesson.moduleTitle}`}
              >
                {progress[index] ? "✓" : index + 1}
              </button>

              <div className="mt-3 text-center px-2">
                <h2 className="font-semibold text-lg">{lesson.moduleTitle}</h2>
                <p className="text-gray-400 text-sm">{lesson.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
