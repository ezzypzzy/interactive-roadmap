import { roadmapData } from "@/data/roadmapData";

export default function CoursePage({ params }) {
  const { slug } = params;

  // Find the lesson/module that matches the slug
  const lesson = roadmapData.find((item) => item.slug === slug);

  if (!lesson) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold">Lesson Not Found</h1>
        <p className="mt-4">The requested lesson could not be found.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">{lesson.moduleTitle}</h1>
      <p className="mt-4">{lesson.description}</p>
      <p className="mt-4 text-gray-500">Course: {lesson.courseName}</p>
    </main>
  );
}
