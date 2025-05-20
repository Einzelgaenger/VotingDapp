import { useState } from 'react';
import SidebarNavbar from './components/SidebarNavbar';
import LandingPage from './components/LandingPage';
import CreateRoom from './components/CreateRoom';
import MyRooms from './components/MyRooms';
import JoinRoom from './components/JoinRoom';
import RoomDetail from './components/RoomDetail';
import RoomInteract from './components/RoomInteract';
import RoomMember from './components/RoomMember';
import AdminPanel from './components/AdminPanel';
import HomePage from './components/HomePage';
import MainLayout from './components/ui/MainLayout';
import { Toaster } from "react-hot-toast";

function App() {
  const [page, setPage] = useState('landing');
  const [activeRoomAddress, setActiveRoomAddress] = useState(null);
  const [returnPage, setReturnPage] = useState('roomdetail');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const showNavbar = page !== 'landing';

  return (
    <MainLayout>
      {/* <div className="min-h-screen bg-gray-50 text-gray-900 font-sans"></div> */}
      <Toaster position="top-right" />
      {showNavbar && (
        <SidebarNavbar
          setPage={setPage}
          currentPage={page}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}

      {/* <div
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #e0e7ff, #f3f4f6, #c7d2fe)',
          backgroundSize: '400% 400%',
          animation: 'gradientBackground 18s ease infinite'
        }}
      ></div> */}

      {/* {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full backdrop-blur-sm pointer-events-none z-0"
          style={{
            backgroundColor: 'rgba(255,255,255,0.7)',
            width: `${6 + Math.random() * 10}px`,
            height: `${6 + Math.random() * 10}px`,
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}px`,
            animation: `snowfall ${12 + Math.random() * 10}s linear infinite`,
            animationDelay: `${Math.random() * 8}s`,
            filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))'
          }}
        />
      ))}

      <style>
        {`
          @keyframes gradientBackground {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes float {
            0% { transform: translateY(0px); opacity: 0.6; }
            50% { transform: translateY(-20px); opacity: 1; }
            100% { transform: translateY(0px); opacity: 0.6; }
          }
        `}
      </style>

      <style>
        {`
    @keyframes snowfall {
      0% {
        transform: translateY(0px) translateX(0px);
        opacity: 0.8;
      }
      100% {
        transform: translateY(100vh) translateX(20px);
        opacity: 0;
      }
    }
  `}
      </style> */}


      <main
        className={
          showNavbar
            ? `transition-all duration-300 ${collapsed ? 'md:pl-20' : 'md:pl-64'}`
            : ''
        }
      >
        {page === 'landing' && <LandingPage setPage={setPage} />}
        {page === 'create' && <CreateRoom setPage={setPage} setActiveRoomAddress={setActiveRoomAddress} />}
        {page === 'myrooms' && <MyRooms setPage={setPage} setActiveRoomAddress={setActiveRoomAddress} />}
        {page === 'join' && <JoinRoom setPage={setPage} setActiveRoomAddress={setActiveRoomAddress} />}
        {page === 'roomdetail' && activeRoomAddress && (
          <RoomDetail activeRoomAddress={activeRoomAddress} setPage={setPage} setReturnPage={setReturnPage} setActiveRoomAddress={setActiveRoomAddress} />
        )}
        {page === 'roominteract' && activeRoomAddress && (
          <RoomInteract activeRoomAddress={activeRoomAddress} setPage={setPage} setReturnPage={setReturnPage} />
        )}
        {page === 'roommembers' && activeRoomAddress && (
          <RoomMember activeRoomAddress={activeRoomAddress} setPage={setPage} returnPage={returnPage} />
        )}
        {page === 'adminpanel' && <AdminPanel setPage={setPage} />}
        {page === 'home' && <HomePage setPage={setPage} />}
      </main>
    </MainLayout>
  );
}

export default App;
