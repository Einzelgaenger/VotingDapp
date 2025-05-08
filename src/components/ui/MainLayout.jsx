// components/ui/MainLayout.jsx
import bg from '../../assets/bg1.jpg'; // pastikan path sesuai!

// export default function MainLayout({ children }) {
//     return (
//         <div
//             style={{
//                 backgroundImage: `url(${bg})`,
//                 backgroundRepeat: 'repeat',
//                 backgroundSize: '300px 300px', // ✅ buat kecil dan repetitif
//                 backgroundAttachment: 'fixed', // agar tetap saat scroll
//                 minHeight: '100vh',
//             }}
//         >
//             {children}
//         </div>
//     );
// }

export default function MainLayout({ children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-[#f0f7ff] to-[#e6f0ff] text-gray-900 font-sans">
            {children}
        </div>
    );
}



