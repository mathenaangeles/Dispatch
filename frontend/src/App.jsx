import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
      <div className="flex items-center justify-center h-screen">
      <h1 className="text-4xl font-bold text-blue-600">
        Tailwind is working 🚀
      </h1>
    </div>
    </BrowserRouter>
  );
}