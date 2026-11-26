import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import BeeKeeping from "./pages/BeeKeeping";
import BeeKeeping2 from "./pages/BeeKeeping2";
import Register from "./pages/Register";
import Intro from "./pages/intro";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import RequireAuth from "./auth/RequireAuth";

// Access rules:
//   public      : /, /intro, /register, /login
//   any user    : /beekeeping, /beekeeping2, /checkout
//   admin only  : /admin
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/intro" element={<Intro />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/beekeeping"
        element={
          <RequireAuth>
            <BeeKeeping />
          </RequireAuth>
        }
      />
      <Route
        path="/beekeeping2"
        element={
          <RequireAuth>
            <BeeKeeping2 />
          </RequireAuth>
        }
      />
      <Route
        path="/checkout"
        element={
          <RequireAuth>
            <Checkout />
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth role="admin">
            <Admin />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
