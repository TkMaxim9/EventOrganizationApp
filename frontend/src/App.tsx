import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import EventPage from "./pages/EventPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
// import Profile from "./pages/Profile";
// import CreateEvent from "./pages/CreateEvent";


function App() {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/event/:id" element={<EventPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/*<Route path="/profile" element={<Profile />} />*/}
                {/*<Route path="/create-event" element={<CreateEvent />} />*/}
            </Routes>
        </Router>
    );
}

export default App;
