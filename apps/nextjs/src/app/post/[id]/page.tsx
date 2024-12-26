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
      url: `https://oppfy.app/post/${post.postId}`,
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
          className="w-40 h-40 rounded-xl shadow-lg"
        />
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-center text-white">
          Join the <span className="text-[#F214FF]">Oppfy</span> Beta
        </h1>

        <div className="flex items-center gap-4 my-4">
          <div className="flex flex-col items-center">
            <img 
              src={post?.authorProfilePicture ?? "/default-profile-picture.jpg"}
              alt={`${post?.authorUsername}'s profile`}
              className="w-16 h-16 rounded-full border-2 border-[#F214FF]"
            />
            <p className="text-white text-sm mt-2">@{post?.authorUsername}</p>
          </div>
          
          <div className="flex flex-col items-center mx-2">
            <span className="text-2xl mb-1">📸</span>
            <span className="text-[#F214FF] text-sm font-medium">took a pic of</span>
          </div>
          
          <div className="flex flex-col items-center">
            <img 
              src={post?.recipientProfilePicture ?? "/default-profile-picture.jpg"}
              alt={`${post?.recipientUsername}'s profile`}
              className="w-16 h-16 rounded-full border-2 border-[#F214FF]"
            />
            <p className="text-white text-sm mt-2">@{post?.recipientUsername}</p>
          </div>
        </div>

        <p className="text-xl text-gray-400 text-center max-w-md">
          Where your friends capture your most authentic moments. Join our exclusive beta and be part of something special.
        </p>

        <p className="text-xl text-gray-400 text-center max-w-md">
          Join the beta to see <span className="text-[#F214FF]">{post?.authorUsername}</span>'s post for <span className="text-[#F214FF]">{post?.recipientUsername}</span>
        </p>

        <div className="flex flex-col items-center gap-6">
          <a
            href="https://testflight.apple.com/join/EHMR7AxB"
            className="px-8 py-4 bg-[#F214FF] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Get Early Access on TestFlight
          </a>
          
          <p className="text-sm text-gray-500 text-center">
            Currently available for iOS users
          </p>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl">
          <div className="text-center">
            <span className="text-3xl mb-2 block">🤝</span>
            <h3 className="text-[#F214FF] font-bold mb-1">Friend-Powered</h3>
            <p className="text-gray-400 text-sm">Let your friends be your photographers</p>
          </div>
          <div className="text-center">
            <span className="text-3xl mb-2 block">📸</span>
            <h3 className="text-[#F214FF] font-bold mb-1">Real Moments</h3>
            <p className="text-gray-400 text-sm">Capture life as it happens</p>
          </div>
          <div className="text-center">
            <span className="text-3xl mb-2 block">✨</span>
            <h3 className="text-[#F214FF] font-bold mb-1">Be Yourself</h3>
            <p className="text-gray-400 text-sm">No filters, just fun</p>
          </div>
        </div>
      </div>
    </main>
  );
}
