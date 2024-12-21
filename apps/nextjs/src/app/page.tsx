export default async function HomePage() {
  return (
    <main className="flex h-screen flex-col items-center justify-center bg-black">
      <div className="container flex flex-col items-center justify-center gap-6 px-4">
        <img
          src="/icon.png"
          alt="Oppfy Logo"
          className="h-32 w-32 rounded-xl shadow-lg"
        />

        <h1 className="text-center text-4xl font-extrabold tracking-tight text-white">
          Join the <span className="text-[#F214FF]">Oppfy</span> Beta
        </h1>

        <p className="max-w-md text-center text-lg text-gray-400">
          Where your friends capture your most authentic moments. Join our
          exclusive beta and be part of something special.
        </p>

        <div className="flex flex-col items-center gap-4">
          <a
            href="https://testflight.apple.com/join/EHMR7AxB"
            className="rounded-xl bg-[#F214FF] px-8 py-3 font-bold text-white transition-opacity hover:opacity-90"
          >
            Get Early Access on TestFlight
          </a>

          <p className="text-center text-sm text-gray-500">
            Currently available for iOS users
          </p>
        </div>

        <div className="mt-8 grid max-w-2xl grid-cols-3 gap-6">
          <div className="text-center">
            <span className="mb-1 block text-2xl">🤝</span>
            <h3 className="mb-1 font-bold text-[#F214FF]">Friend-Powered</h3>
            <p className="text-sm text-gray-400">
              Let your friends be your photographers
            </p>
          </div>
          <div className="text-center">
            <span className="mb-1 block text-2xl">📸</span>
            <h3 className="mb-1 font-bold text-[#F214FF]">Real Moments</h3>
            <p className="text-sm text-gray-400">Capture life as it happens</p>
          </div>
          <div className="text-center">
            <span className="mb-1 block text-2xl">✨</span>
            <h3 className="mb-1 font-bold text-[#F214FF]">Be Yourself</h3>
            <p className="text-sm text-gray-400">No filters, just fun</p>
          </div>
        </div>
      </div>
    </main>
  );
}
