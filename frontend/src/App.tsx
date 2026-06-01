import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Editor from '@/pages/Editor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/editor/:sessionId" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  );
}
