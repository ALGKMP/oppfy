import Image from "next/image";

export const CTAButtons = () => {
  return (
    <div className="flex flex-col items-center gap-6 text-center md:items-start md:gap-8 md:text-left">
      <div>
        {/* Logo */}
        <Image
          src="/icon.png"
          alt="Oppfy logo"
          width={56}
          height={56}
          className="mx-auto mb-3 md:mx-0"
        />
        <h1
          className="mb-4 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl"
          style={{ letterSpacing: "-0.04em" }}
        >
          Real moments,
          <br />
          <span className="text-white">captured by friends</span>
        </h1>
      </div>

      {/* Pre-Order on the App Store Button */}
      <a
        href="https://apps.apple.com/ca/app/oppfy/id6746730960"
        className="flex w-full max-w-sm items-center justify-start gap-3 rounded-full bg-white px-6 py-3 text-base font-semibold text-black shadow-md transition hover:bg-gray-100 md:max-w-xs md:py-2 md:text-lg"
        style={{ textDecoration: "none" }}
      >
        <svg
          fill="#000000"
          width="20"
          height="20"
          viewBox="0 0 22.773 22.773"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <g>
            <g>
              <path d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573 c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z"></path>
              <path d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334 c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0 c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019 c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464 c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648 c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z"></path>
            </g>
          </g>
        </svg>
        <span className="whitespace-nowrap">Pre-Order on the App Store</span>
      </a>

      {/* Join Beta Button */}
      <a
        href="https://testflight.apple.com/join/3SnDTsgF"
        className="flex w-full max-w-sm items-center justify-start gap-3 rounded-full border border-white/20 bg-gray-500/20 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-gray-600/40 md:max-w-xs md:py-2 md:text-lg"
        style={{ textDecoration: "none" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 512 512"
          fill="currentColor"
          className="flex-shrink-0"
        >
          <path d="M452.32,365,327.4,167.12A48.07,48.07,0,0,1,320,141.48V64h15.56c8.61,0,16-6.62,16.43-15.23A16,16,0,0,0,336,32H176.45c-8.61,0-16,6.62-16.43,15.23A16,16,0,0,0,176,64h16v77.48a47.92,47.92,0,0,1-7.41,25.63L59.68,365a74,74,0,0,0-2.5,75.84C70.44,465.19,96.36,480,124.13,480H387.87c27.77,0,53.69-14.81,66.95-39.21A74,74,0,0,0,452.32,365ZM211.66,184.2A79.94,79.94,0,0,0,224,141.48V68a4,4,0,0,1,4-4h56a4,4,0,0,1,4,4v73.48a79.94,79.94,0,0,0,12.35,42.72l57.8,91.53A8,8,0,0,1,351.37,288H160.63a8,8,0,0,1-6.77-12.27Z" />
        </svg>
        <span className="whitespace-nowrap">
          Try the iOS Beta on TestFlight
        </span>
      </a>

      {/* Join our Discord Community Button */}
      <a
        href="https://discord.gg/ZEcskPJuDc"
        className="flex w-full max-w-sm items-center justify-start gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-white/20 md:max-w-xs md:py-2 md:text-lg"
        style={{ textDecoration: "none" }}
      >
        <svg
          viewBox="0 -28.5 256 256"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          className="flex-shrink-0"
        >
          <g>
            <path
              d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
              fill="#FFFF"
              fill-rule="nonzero"
            ></path>
          </g>
        </svg>
        <span className="whitespace-nowrap">Join our Discord community</span>
      </a>
    </div>
  );
};
