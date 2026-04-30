export default function LegalLayout({ children }) {
  return (
    <>
      <div className="bg-gray-100 border-b">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <nav className="flex gap-4 text-sm">
            <a href="/legal/privacy" className="text-gray-600 hover:text-gray-900">Privacy</a>
            <a href="/legal/terms" className="text-gray-600 hover:text-gray-900">Termini</a>
            <a href="/legal/security" className="text-gray-600 hover:text-gray-900">Sicurezza</a>
          </nav>
        </div>
      </div>
      {children}
    </>
  );
}