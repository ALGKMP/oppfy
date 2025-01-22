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

    // Calculate dimensions maintaining aspect ratio with max height of 1200px for vertical images
    // and max width of 1200px for horizontal images
    const maxDimension = 1200;
    const aspectRatio =
      post.height && post.width ? post.height / post.width : 1;

    let width: number;
    let height: number;

    if (aspectRatio > 1) {
      // Vertical image
      height = maxDimension;
      width = Math.round(height / aspectRatio);
    } else {
      // Horizontal or square image
      width = maxDimension;
      height = Math.round(width * aspectRatio);
    }

    // Ensure minimum dimensions for social media
    width = Math.max(width, 600);
    height = Math.max(height, 600);

    return {
      title: `${post.authorUsername} opped ${post.recipientUsername} | Oppfy`,
      description: post.caption.length === 0 ? "No caption" : post.caption,
      themeColor: "#F214FF",
      openGraph: {
        title: `${post.authorUsername} opped ${post.recipientUsername}`,
        description: post.caption,
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
        description: post.caption,
        images: [
          {
            url: post.imageUrl,
            width,
            height,
            alt: `${post.authorUsername} opped ${post.recipientUsername}`,
          },
        ],
        site: "@oppfyapp",
        creator: "@oppfyapp",
      },
      applicationName: "Oppfy",
      appleWebApp: {
        title: "Oppfy",
        statusBarStyle: "black",
        startupImage: [
          {
            url: "/icon.png",
            media:
              "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
          },
          {
            url: "/icon.png",
            media:
              "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
          },
          {
            url: "/icon.png",
            media:
              "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
          },
        ],
        capable: true,
      },
      viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
        viewportFit: "cover",
      },
      formatDetection: {
        telephone: false,
      },
      manifest: "/manifest.json",
      icons: {
        icon: "/icon.png",
        apple: "/apple-touch-icon.png",
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
