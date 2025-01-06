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
  let post;
  try {
    post = await api.post.getPostForNextJs({ postId: params.id });
  } catch (error) {
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

  const aspectRatio =
    post?.height && post?.width ? post.height / post.width : 1;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-center md:flex-row">
        {/* Left Side - Content */}
        <div className="flex max-w-xl flex-1 flex-col items-center justify-center p-8 md:p-12">
          <div className="flex w-full flex-col items-center gap-8">
            <img
              src="/icon.png"
              alt="Oppfy Logo"
              className="h-32 w-32 rounded-xl shadow-lg"
            />

            <h1 className="text-center text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Join the <span className="text-[#F214FF]">Oppfy</span> Beta
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <img
                  src={
                    post?.authorProfilePicture ?? "/default-profile-picture.jpg"
                  }
                  alt={`${post?.authorUsername}'s profile`}
                  className="h-16 w-16 rounded-full border-2 border-[#F214FF]"
                />
                <p className="mt-2 text-sm text-white">
                  @{post?.authorUsername}
                </p>
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
                    post?.recipientProfilePicture ??
                    "/default-profile-picture.jpg"
                  }
                  alt={`${post?.recipientUsername}'s profile`}
                  className="h-16 w-16 rounded-full border-2 border-[#F214FF]"
                />
                <p className="mt-2 text-sm text-white">
                  @{post?.recipientUsername}
                </p>
              </div>
            </div>

            <p className="text-center text-lg text-gray-400">
              Where your friends capture your most authentic moments. Join our
              exclusive beta and be part of something special.
            </p>

            <div className="flex flex-col items-center gap-4">
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

            <div className="grid w-full grid-cols-3 gap-4">
              <div className="text-center">
                <span className="mb-2 block text-2xl">🤝</span>
                <h3 className="mb-1 font-bold text-[#F214FF]">
                  Friend-Powered
                </h3>
                <p className="text-xs text-gray-400">
                  Let your friends be your photographers
                </p>
              </div>
              <div className="text-center">
                <span className="mb-2 block text-2xl">📸</span>
                <h3 className="mb-1 font-bold text-[#F214FF]">Real Moments</h3>
                <p className="text-xs text-gray-400">
                  Capture life as it happens
                </p>
              </div>
              <div className="text-center">
                <span className="mb-2 block text-2xl">✨</span>
                <h3 className="mb-1 font-bold text-[#F214FF]">Be Yourself</h3>
                <p className="text-xs text-gray-400">No filters, just fun</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Image (hidden on mobile) */}
        <div className="hidden max-w-md flex-1 items-center justify-center p-8 md:flex md:p-12">
          <div className="relative w-full overflow-hidden rounded-xl border-4 border-[#F214FF]">
            <div
              className="relative w-full"
              style={{
                paddingBottom: `${aspectRatio * 100}%`,
                maxHeight: "70vh",
              }}
            >
              {/* Blurred background */}
              <div
                className="absolute inset-0 opacity-30 blur-xl"
                style={{
                  backgroundImage: `url(${post?.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              {/* Main image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={post?.imageUrl}
                  alt="Post preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
