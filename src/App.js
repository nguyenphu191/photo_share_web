import Register from "./pages/Register";
import Login from "./pages/Login"; 
import Home from "./pages/Home";
import TopBar from "./components/TopBar";
import Profile from "./pages/Profile";
import AddFriend from "./pages/AddFriend";
import AddFriends from "./pages/AddFriends";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import "./styles.css";
function App() {
  return (
    <Router>
      <TopBar/>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/home" element={<Home/>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/add-friend/:userId" element={<AddFriend/>} />
        <Route path="/add-friends" element={<AddFriends/>} />

      </Routes>
    </Router>
  );
}

export default App;
