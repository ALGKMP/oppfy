export default function FooterLayout(props: { children: React.ReactNode }) {
  return (
    <>
      {props.children}
      <footer className="mt-auto border-t border-gray-800 py-4">
        <div className="container mx-auto flex justify-center gap-8">
          <a
            href="/privacy"
            className="text-sm text-gray-400 transition-colors hover:text-[#F214FF]"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-sm text-gray-400 transition-colors hover:text-[#F214FF]"
          >
            Terms of Service
          </a>
          <a
            href="/contact"
            className="text-sm text-gray-400 transition-colors hover:text-[#F214FF]"
          >
            Contact
          </a>
        </div>
      </footer>
    </>
  );
}
