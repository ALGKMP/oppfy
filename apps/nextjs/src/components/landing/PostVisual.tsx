import Image from "next/image";
import MuxPlayer from "@mux/mux-player-react";

interface PostVisualProps {
  mediaType: "image" | "video";
  assetUrl: string;
  width?: number;
  height?: number;
}

export const PostVisual = ({
  mediaType,
  assetUrl,
  width,
  height,
}: PostVisualProps) => {
  const aspectRatio = height && width ? height / width : 1;

  return (
    <div className="hidden w-full max-w-md flex-1 items-center justify-center p-4 md:flex md:p-8 lg:p-12">
      <div className="glow-border relative w-full overflow-hidden rounded-xl border-4 border-[#F214FF]">
        <div
          className="relative w-full"
          style={{
            paddingBottom: `${aspectRatio * 100}%`,
            maxHeight: "80vh",
          }}
        >
          <div
            className="absolute inset-0 opacity-30 blur-xl"
            style={{
              backgroundImage:
                mediaType === "image" ? `url(${assetUrl})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {mediaType === "image" ? (
              <Image
                src={assetUrl}
                alt="Post preview"
                className="h-full w-full object-contain"
                fill
                unoptimized
              />
            ) : (
              <MuxPlayer
                src={assetUrl}
                className="h-full w-full object-contain"
                autoPlay
                loop
                muted
                playsInline
                streamType="on-demand"
                primaryColor="#F214FF"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
