import { Metadata } from "next";
import Image from "next/image";

import { api } from "~/trpc/server";

interface Props {
  params: {
    id: string;
  };
}

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await api.post.getPostForNextJs({ postId: params.id });
  console.log(post);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found",
    };
  }

  return {
    title: `${post.authorUsername} opped ${post.recipientUsername}`,
    description: post.caption ?? "No caption",
    openGraph: {
      title: `${post.authorUsername} opped ${post.recipientUsername}`,
      description: post.caption ?? "No caption",
      images: [
        {
          url: post.imageUrl,
          width: 1200,
          height: 630,
          alt: `${post.authorUsername} opped ${post.recipientUsername}`,
        },
      ],
      type: "article",
      url: `https://www.oppfy.app/post/${post.postId}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.authorUsername} opped ${post.recipientUsername}`,
      description: post.caption ?? "No caption",
      images: [post.imageUrl],
    },
  };
}

// Main page component
export default async function PostPage({ params }: Props) {
  const post = await api.post.getPostForNextJs({ postId: params.id });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <img
          src="/icon.png"
          alt="Oppfy Logo"
          className="h-40 w-40 rounded-xl shadow-lg"
        />

        <h1 className="text-center text-4xl font-extrabold tracking-tight text-white md:text-6xl">
          Join the <span className="text-[#F214FF]">Oppfy</span> Beta
        </h1>

        <div className="my-4 flex items-center gap-4">
          <div className="flex flex-col items-center">
            <img
              src={post?.authorProfilePicture ?? "/default-profile-picture.jpg"}
              alt={`${post?.authorUsername}'s profile`}
              className="h-16 w-16 rounded-full border-2 border-[#F214FF]"
            />
            <p className="mt-2 text-sm text-white">@{post?.authorUsername}</p>
          </div>

          <div className="mx-2 flex flex-col items-center">
            <span className="mb-1 text-2xl">📸</span>
            <span className="text-sm font-medium text-[#F214FF]">
              took a pic of
            </span>
          </div>

          <div className="flex flex-col items-center">
            <img
              src={
                post?.recipientProfilePicture ?? "/default-profile-picture.jpg"
              }
              alt={`${post?.recipientUsername}'s profile`}
              className="h-16 w-16 rounded-full border-2 border-[#F214FF]"
            />
            <p className="mt-2 text-sm text-white">
              @{post?.recipientUsername}
            </p>
          </div>
        </div>

        <p className="max-w-md text-center text-xl text-gray-400">
          Where your friends capture your most authentic moments. Join our
          exclusive beta and be part of something special.
        </p>

        <p className="max-w-md text-center text-xl text-gray-400">
          Join the beta to see{" "}
          <span className="text-[#F214FF]">{post?.authorUsername}</span>'s post
          for <span className="text-[#F214FF]">{post?.recipientUsername}</span>
        </p>

        <div className="flex flex-col items-center gap-6">
          <a
            href="https://testflight.apple.com/join/EHMR7AxB"
            className="rounded-xl bg-[#F214FF] px-8 py-4 font-bold text-white transition-opacity hover:opacity-90"
          >
            Get Early Access on TestFlight
          </a>

          <p className="text-center text-sm text-gray-500">
            Currently available for iOS users
          </p>
        </div>

        <div className="mt-12 grid max-w-2xl grid-cols-3 gap-8">
          <div className="text-center">
            <span className="mb-2 block text-3xl">🤝</span>
            <h3 className="mb-1 font-bold text-[#F214FF]">Friend-Powered</h3>
            <p className="text-sm text-gray-400">
              Let your friends be your photographers
            </p>
          </div>
          <div className="text-center">
            <span className="mb-2 block text-3xl">📸</span>
            <h3 className="mb-1 font-bold text-[#F214FF]">Real Moments</h3>
            <p className="text-sm text-gray-400">Capture life as it happens</p>
          </div>
          <div className="text-center">
            <span className="mb-2 block text-3xl">✨</span>
            <h3 className="mb-1 font-bold text-[#F214FF]">Be Yourself</h3>
            <p className="text-sm text-gray-400">No filters, just fun</p>
          </div>
        </div>
      </div>
    </main>
  );
}
