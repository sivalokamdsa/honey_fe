import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import BeeKeeping from "./pages/BeeKeeping";
import BeeKeeping2 from "./pages/BeeKeeping2";
import Register from "./pages/Register";
import Intro from "./pages/intro";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/intro" element={<Intro />} />

      <Route path="/beekeeping" element={<BeeKeeping />} />
      <Route path="/beekeeping2" element={<BeeKeeping2 />} />
      <Route path="/register" element={<Register />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
