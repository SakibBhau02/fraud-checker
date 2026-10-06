export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-900 py-5 text-center text-sm text-slate-400">
      <p className="flex items-center justify-center gap-2">
        Powered by{" "}
        <a href="https://www.zoolyum.com/" target="_blank" rel="noopener noreferrer" title="Zoolyum — zoolyum.com">
          <img src="/zoolyum-logo.svg" alt="Zoolyum" className="h-6 w-auto opacity-90 transition hover:opacity-100" />
        </a>
      </p>
    </footer>
  );
}
