import "../index.css";

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-white mb-8">About Page</h1>

      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 max-w-md">
        <p className="text-gray-800 text-lg mb-4">
          This is the second page of the application.
        </p>
        <p className="text-gray-600 mb-6">
          Routing is being handled by React Router DOM.
        </p>

        <h3 className="text-xl font-bold text-gray-800 mb-2">Tech Stack</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Bun: Runtime (used in a monorepo / workspaces context)</li>
          <li>
            React: Component runtime
            <ul className="list-disc list-inside ml-6 text-gray-600">
              <li>Including shared components</li>
            </ul>
          </li>
          <li>Vite: Bundler</li>
          <li>Tailwind CSS: Styling</li>
          <li>React Router DOM: Routing</li>
        </ul>
      </div>
    </div>
  );
}

export default About;
