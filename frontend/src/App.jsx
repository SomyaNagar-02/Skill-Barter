import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Community from './pages/Community';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<Home />} />
          <Route path='signup' element={<SignUp />} />
          <Route path='signin' element={<SignIn />} />
          <Route
            path='dashboard'
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path='chat'
            element={<ProtectedRoute><Chat /></ProtectedRoute>}
          />
          <Route
            path='community'
            element={<ProtectedRoute><Community /></ProtectedRoute>}
          />
          <Route
            path='profile'
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />
          <Route
            path='profile/edit'
            element={<ProtectedRoute><EditProfile /></ProtectedRoute>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
