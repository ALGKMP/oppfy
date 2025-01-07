import { Metadata } from "next";
import Image from "next/image";
import { motion } from "framer-motion";

import AnimatedPostErrorPage from "~/components/AnimatedPostErrorPage";
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

    // Calculate dimensions that maintain aspect ratio within 1200x630 bounds
    const targetWidth = 1200;
    const targetHeight = 630;
    const aspectRatio =
      post.height && post.width ? post.height / post.width : 1;

    let finalWidth = targetWidth;
    let finalHeight = Math.round(targetWidth * aspectRatio);

    // If height exceeds target, scale down from height instead
    if (finalHeight > targetHeight) {
      finalHeight = targetHeight;
      finalWidth = Math.round(targetHeight / aspectRatio);
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
            width: finalWidth,
            height: finalHeight,
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
        <AnimatedPostErrorPage />
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
