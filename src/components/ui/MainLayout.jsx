// components/ui/MainLayout.jsx
import bg from '../../assets/bg1.jpg'; // pastikan path sesuai!

export default function MainLayout({ children }) {
    return (
        <div
            style={{
                backgroundImage: `url(${bg})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '300px 300px', // ✅ buat kecil dan repetitif
                backgroundAttachment: 'fixed', // agar tetap saat scroll
                minHeight: '100vh',
            }}
        >
            {children}
        </div>
    );
}
