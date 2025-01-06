import { Metadata } from "next";
import Image from "next/image";
import { motion } from "framer-motion";

import AnimatedPostPage from "~/components/AnimatedPostPage";
import { api } from "~/trpc/server";

interface Props {
  params: {
    id: string;
  };
}

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await api.post.getPostForNextJs({ postId: params.id });

    if (!post) {
      return {
        title: "Post Not Found | Oppfy",
        description: "The requested post could not be found",
      };
    }

    return {
      title: `${post.authorUsername} opped ${post.recipientUsername} | Oppfy`,
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
  } catch (error) {
    return {
      title: "Post Not Found | Oppfy",
      description: "The requested post could not be found",
    };
  }
}

// Main page component
export default async function PostPage({ params }: Props) {
  let post;

  try {
    post = await api.post.getPostForNextJs({ postId: params.id });
  } catch (error) {
    post = null;
  }

  if (!post) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <img
            src="/icon.png"
            alt="Oppfy Logo"
            className="h-40 w-40 rounded-xl shadow-lg"
          />

          <h1 className="text-center text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Oops! Post Not Found
          </h1>

          <p className="max-w-md text-center text-xl text-gray-400">
            We couldn't find the post you're looking for. But don't worry -
            there are plenty more amazing moments waiting to be captured on
            Oppfy!
          </p>

          <div className="flex flex-col items-center gap-6">
            <a
              href="https://testflight.apple.com/join/EHMR7AxB"
              className="rounded-xl bg-[#F214FF] px-8 py-4 font-bold text-white transition-opacity hover:opacity-90"
            >
              Join Our Beta on TestFlight
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
              <p className="text-sm text-gray-400">
                Capture life as it happens
              </p>
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

  const aspectRatio = post.height && post.width ? post.height / post.width : 1;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <AnimatedPostPage post={post} aspectRatio={aspectRatio} />
    </main>
  );
}
