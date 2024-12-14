export default async function HomePage() {
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

        <p className="text-xl text-gray-400 text-center max-w-md">
          Where your friends capture your most authentic moments. Join our exclusive beta and be part of something special.
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