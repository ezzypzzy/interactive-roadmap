import Link from "next/link";
import { roadmapData } from "@/data/roadmapData";

export default async function CoursePage({ params }) {
  const { slug } = await params;

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
    <main className="my-8 px-8 sm:px-16 text-center sm:text-left">
      <h1 className="text-gray-500">{lesson.courseName}</h1>
      <h2 className="text-3xl font-bold text-gray-300">{lesson.moduleTitle}</h2>
      <h3 className="mt-4">{lesson.description}</h3>
      <p className="mt-4 p-4 rounded bg-[rgba(30,30,30,0.75)]">
        <span>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur at
          faucibus leo. Aliquam iaculis, sem et suscipit fermentum, est lorem
          ultricies urna, ac vulputate turpis enim ut sapien. Nunc efficitur,
          nulla eu consectetur laoreet, odio sapien eleifend nisi, eu volutpat
          turpis nisi in sapien. Morbi at erat maximus diam auctor scelerisque
          ac id mi. Sed porta lacinia pretium. Lorem ipsum dolor sit amet,
          consectetur adipiscing elit. Nunc euismod a metus quis molestie.
          Vivamus sagittis sapien in urna sagittis aliquam. Nam ornare nunc ut
          odio condimentum maximus. Ut nunc dolor, malesuada vitae eros vitae,
          tempus eleifend leo.
        </span>
        <br />
        <span>
          Nulla non quam nisl. Nullam sit amet iaculis nibh, et pulvinar arcu.
          Etiam placerat semper elit, vel laoreet felis blandit eget. Nulla
          laoreet id sem sed gravida. Nulla ultrices justo vel orci volutpat
          rutrum. Cras ut ultrices elit, eget bibendum urna. Ut dignissim sapien
          vitae nulla sagittis, sed euismod velit aliquet. Vivamus non lorem
          eget lorem placerat dictum. Pellentesque molestie bibendum placerat.
          Vivamus fringilla, nibh ornare laoreet convallis, lectus est malesuada
          augue, et maximus dui mi quis nisl. Mauris mauris eros, lobortis sed
          nibh vel, porta faucibus velit. Aliquam erat volutpat. Aliquam sed dui
          lacinia, eleifend metus a, blandit dolor. Cras vulputate rhoncus
          maximus. Sed pharetra sem a sapien sodales facilisis. Vestibulum ante
          ipsum primis in faucibus orci luctus et ultrices posuere cubilia
          curae; Sed porttitor gravida mauris, nec pretium nulla efficitur
          finibus.
        </span>
      </p>
      <Link href="/">
        <button className="my-4 px-4 py-2 cursor-pointer bg-[rgba(80,108,240,1)] text-black rounded hover:bg-[rgba(80,108,240,0.8)]">
          ⬅ Back
        </button>
      </Link>
    </main>
  );
}
