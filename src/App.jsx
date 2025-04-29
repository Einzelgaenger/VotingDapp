import { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import CreateRoom from './components/CreateRoom';
import MyRooms from './components/MyRooms';
import JoinRoom from './components/JoinRoom';
import RoomDetail from './components/RoomDetail';
import RoomInteract from './components/RoomInteract';
import RoomMember from './components/RoomMember';
import AdminPanel from './components/AdminPanel';
import HomePage from './components/HomePage';


function App() {
  const [page, setPage] = useState('landing');
  const [activeRoomAddress, setActiveRoomAddress] = useState(null);
  const [returnPage, setReturnPage] = useState('roomdetail');

  const showNavbar = page !== 'landing'; // ✅ kalau bukan landing, baru tampil Navbar

  return (
    <>
      {showNavbar && <Navbar setPage={setPage} />} {/* ✅ hanya muncul kalau bukan di landing */}

      {page === 'landing' && (
        <LandingPage setPage={setPage} />
      )}

      {page === 'create' && (
        <CreateRoom
          setPage={setPage}
          setActiveRoomAddress={setActiveRoomAddress}
        />
      )}

      {page === 'myrooms' && (
        <MyRooms
          setPage={setPage}
          setActiveRoomAddress={setActiveRoomAddress}
        />
      )}

      {page === 'join' && (
        <JoinRoom
          setActiveRoomAddress={setActiveRoomAddress}
          setPage={setPage}
        />
      )}

      {page === 'roomdetail' && activeRoomAddress && (
        <RoomDetail
          activeRoomAddress={activeRoomAddress}
          setPage={setPage}
          setReturnPage={setReturnPage}
        />
      )}

      {page === 'roominteract' && activeRoomAddress && (
        <RoomInteract
          activeRoomAddress={activeRoomAddress}
          setPage={setPage}
          setReturnPage={setReturnPage}
        />
      )}

      {page === 'roommembers' && activeRoomAddress && (
        <RoomMember
          activeRoomAddress={activeRoomAddress}
          setPage={setPage}
          returnPage={returnPage}
        />
      )}

      {page === 'adminpanel' && (
        <AdminPanel setPage={setPage} />
      )}

      {page === 'home' && (
        <HomePage setPage={setPage} />
      )}

    </>
  );
}

export default App;
