export const PhoneVisual = () => {
  return (
    <div className="relative hidden justify-center md:flex">
      <div className="relative aspect-[9/16] w-full max-w-[340px] rounded-[48px] shadow-2xl">
        <video
          className="h-full w-full rounded-[48px] border-8 border-white object-cover"
          src="/vid.mp4"
          playsInline
          muted
          autoPlay
          loop
        />
      </div>
    </div>
  );
};
