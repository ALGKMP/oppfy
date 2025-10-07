import Image from "next/image";
import MuxPlayer from "@mux/mux-player-react";

interface MobilePostVisualProps {
  mediaType: "image" | "video";
  assetUrl: string;
  width?: number;
  height?: number;
}

export const MobilePostVisual = ({
  mediaType,
  assetUrl,
  width,
  height,
}: MobilePostVisualProps) => {
  const aspectRatio = height && width ? height / width : 1;

  return (
    <div className="flex w-full justify-center md:hidden">
      <div className="glow-border relative w-[70%] overflow-hidden rounded-xl border-4 border-[#F214FF]">
        <div
          className="relative w-full"
          style={{
            paddingBottom: `${aspectRatio * 100}%`,
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
