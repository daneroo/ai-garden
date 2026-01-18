import "../index.css";

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/70 to-secondary/70 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-accent-content mb-8">
        About Page
      </h1>

      <div className="bg-base-100/90 backdrop-blur rounded-2xl shadow-xl p-8 max-w-md">
        <p className="text-base-content text-lg mb-4">
          This is the second page of the application.
        </p>
        <p className="text-base-content/70 mb-6">
          Routing is being handled by React Router DOM.
        </p>

        <h3 className="text-xl font-bold text-base-content mb-2">Tech Stack</h3>
        <ul className="list-disc list-inside text-base-content/80 space-y-1">
          <li>Bun: Runtime (used in a monorepo / workspaces context)</li>
          <li>
            React: Component runtime
            <ul className="list-disc list-inside ml-6 text-base-content/60">
              <li>Including shared components</li>
            </ul>
          </li>
          <li>Vite: Bundler</li>
          <li>Tailwind CSS: Styling</li>
          <li>DaisyUI: Tailwind component classes</li>
          <li>React Router DOM: Routing</li>
        </ul>
      </div>
    </div>
  );
}

export default About;
