import type { Metadata } from "next";

import AnimatedProfileErrorPage from "~/components/AnimatedProfileErrorPage";
import AnimatedProfilePage from "~/components/AnimatedProfilePage";
import { api } from "~/trpc/server";

interface Props {
  params: {
    username: string;
  };
}

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const profile = await api.profile.getProfileForNextJs({
      username: params.username,
    });

    console.log("profile", profile);

    if (!profile) {
      return {
        title: "Profile Not Found | Oppfy",
        description: "The requested profile could not be found",
        themeColor: "#F214FF",
      };
    }

    return {
      title: `${profile.name ?? profile.username} (@${profile.username}) | Oppfy`,
      description:
        profile.bio ??
        `Check out ${profile.name ?? profile.username}'s profile on Oppfy`,
      themeColor: "#F214FF",
      openGraph: {
        title: `${profile.name ?? profile.username} (@${profile.username})`,
        description:
          profile.bio ??
          `Check out ${profile.name ?? profile.username}'s profile on Oppfy`,
        images: [
          {
            url: profile.profilePictureUrl ?? "/default-profile-picture.jpg",
            width: 800,
            height: 800,
            alt: `${profile.name ?? profile.username}'s profile picture`,
          },
        ],
        type: "profile",
        url: `https://www.oppfy.app/profile/${profile.id}`,
        siteName: "Oppfy",
      },
      twitter: {
        card: "summary",
        title: `${profile.name ?? profile.username} (@${profile.username})`,
        description:
          profile.bio ??
          `Check out ${profile.name ?? profile.username}'s profile on Oppfy`,
        images: [profile.profilePictureUrl ?? "/default-profile-picture.jpg"],
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
      title: "Profile Not Found | Oppfy",
      description: "The requested profile could not be found",
      themeColor: "#F214FF",
    };
  }
}

// Main page component
export default async function ProfilePage({ params }: Props) {
  let profile;

  try {
    profile = await api.profile.getProfileForNextJs({
      username: params.username,
    });
  } catch (error) {
    profile = null;
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black">
        <AnimatedProfileErrorPage />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <AnimatedProfilePage profile={profile} />
    </main>
  );
}
