export const BackgroundVideo = () => {
  return (
    <div className="absolute inset-0 md:hidden">
      <video
        className="h-full w-full object-cover"
        src="/vid.mp4"
        playsInline
        muted
        autoPlay
        loop
      />
      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F214FF]/80 via-[#F214FF]/85 to-[#F214FF]/90" />
    </div>
  );
};
