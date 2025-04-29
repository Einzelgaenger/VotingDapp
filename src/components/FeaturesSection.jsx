export default function FeaturesSection() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto'
        }}>
            {/* Feature 1 */}
            <FeatureCard
                icon="➕"
                title="Create Room"
                description="Start a new decentralized voting room easily."
            />

            {/* Feature 2 */}
            <FeatureCard
                icon="📋"
                title="My Rooms"
                description="Manage all your created and joined rooms."
            />

            {/* Feature 3 */}
            <FeatureCard
                icon="🔑"
                title="Join Room"
                description="Participate in voting sessions securely."
            />
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div style={{
            flex: '1 1 250px',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            textAlign: 'center',
            transition: 'all 0.2s ease',
        }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ fontSize: '1rem', color: '#6B7280' }}>{description}</p>
        </div>
    );
}
