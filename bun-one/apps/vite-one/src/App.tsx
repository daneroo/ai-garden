import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Layout from "./components/Layout";
import "./index.css";

/**
 * Route handle metadata for layout configuration.
 * Extend this interface to add more route-level metadata.
 */
export interface RouteHandle {
  layoutMode?: "contained" | "fullBleed";
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} handle={{ layoutMode: "fullBleed" }} />
      <Route path="/about" element={<About />} /> {/* default: contained */}
    </Route>,
  ),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
