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
