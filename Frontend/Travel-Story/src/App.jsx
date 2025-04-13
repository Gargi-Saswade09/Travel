import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Home from './pages/Home/Home.jsx'
import Login from './pages/Auth/Login.jsx'
import SignUp from './pages/Auth/Signup.jsx';

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path='/' exact element={<Root />} />
          <Route path='/dashboard' exact element={<Home />} />
          <Route path='/login' exact element={<Login />} />
          <Route path='/signup' exact element={<SignUp />} />
        </Routes>
      </Router>
    </>
  )
}

const Root = () => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? (
    // <Navigate to="/dashboard" />
    <Navigate to="/login" />
  ) : (
    <Navigate to="/login" />
  )
}

export default App
