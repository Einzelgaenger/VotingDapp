import { useState } from 'react';
import Navbar from './components/Navbar';
import CreateRoom from './components/CreateRoom';
import MyRooms from './components/MyRooms';
import JoinRoom from './components/JoinRoom';
import RoomDetail from './components/RoomDetail';
import RoomInteract from './components/RoomInteract'; // 🆕 Tambah

function App() {
  const [page, setPage] = useState('create');
  const [activeRoomAddress, setActiveRoomAddress] = useState(null);

  return (
    <>
      <Navbar setPage={setPage} />
      {page === 'create' && <CreateRoom />}
      {page === 'myrooms' && <MyRooms setPage={setPage} setActiveRoomAddress={setActiveRoomAddress} />}
      {page === 'join' && <JoinRoom setActiveRoomAddress={setActiveRoomAddress} setPage={setPage} />}
      {page === 'roomdetail' && activeRoomAddress && <RoomDetail activeRoomAddress={activeRoomAddress} setPage={setPage} />}
      {page === 'roominteract' && activeRoomAddress && <RoomInteract activeRoomAddress={activeRoomAddress} setPage={setPage} />}
    </>
  );
}

export default App;
