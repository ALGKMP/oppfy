import type { Metadata } from "next";
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
        themeColor: "#F214FF",
      };
    }

    // Calculate dimensions maintaining aspect ratio with max width of 1200px
    const maxWidth = 1200;
    const aspectRatio =
      post.height && post.width ? post.height / post.width : 1;
    const width = maxWidth;
    const height = Math.round(maxWidth * aspectRatio);

    return {
      title: `${post.authorUsername} opped ${post.recipientUsername} | Oppfy`,
      description: post.caption.length === 0 ? "No caption" : post.caption,
      themeColor: "#F214FF",
      openGraph: {
        title: `${post.authorUsername} opped ${post.recipientUsername}`,
        description: post.caption.length === 0 ? "No caption" : post.caption,
        images: [
          {
            url: post.imageUrl,
            width,
            height,
            alt: `${post.authorUsername} opped ${post.recipientUsername}`,
          },
        ],
        type: "article",
        url: `https://www.oppfy.app/post/${post.postId}`,
        siteName: "Oppfy",
      },
      twitter: {
        card: "summary_large_image",
        title: `${post.authorUsername} opped ${post.recipientUsername}`,
        description: post.caption.length === 0 ? "No caption" : post.caption,
        images: [
          {
            url: post.imageUrl,
            width,
            height,
            alt: `${post.authorUsername} opped ${post.recipientUsername}`,
          },
        ],
        site: "@oppfyapp",
      },
      applicationName: "Oppfy",
      appleWebApp: {
        title: "Oppfy",
        statusBarStyle: "black-translucent",
        capable: true,
      },
      viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
      },
    };
  } catch (_) {
    return {
      title: "Post Not Found | Oppfy",
      description: "The requested post could not be found",
      themeColor: "#F214FF",
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
