import {
    ClipboardList,
    KeyRound,
    BarChart3,
    Settings2
} from 'lucide-react'; // pastikan sudah install lucide-react

const features = [
    {
        title: 'Create Voting Room',
        description: 'Launch decentralized voting in seconds.',
        icon: ClipboardList,
        color: 'bg-orange-100 text-orange-600',
    },
    {
        title: 'Join as Voter',
        description: 'Cast votes securely with wallet access.',
        icon: KeyRound,
        color: 'bg-green-100 text-green-600',
    },
    {
        title: 'View Results',
        description: 'See real-time results anytime.',
        icon: BarChart3,
        color: 'bg-indigo-100 text-indigo-600',
    },
    {
        title: 'Admin Control',
        description: 'Manage voters, candidates, and reset.',
        icon: Settings2,
        color: 'bg-pink-100 text-pink-600',
    },
];

export default function FeaturesSection() {
    return (
        <section className="bg-gray-50 py-16">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold mb-12">What You Can Do with Voting DApp</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition text-left"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
