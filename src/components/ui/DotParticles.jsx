import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function DotParticles({ theme = "light" }) {
    const particlesInit = useCallback(async (engine) => {
        await loadFull(engine);
    }, []);

    const getDotColor = () => {
        switch (theme) {
            case "dark":
                return "#ffffff";
            case "noir":
                return "#f4f4f4";
            default:
                return "#0a1f33";
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: -10,
                pointerEvents: "none"
            }}
        >
            <Particles
                id="subtleParticles"
                init={particlesInit}
                options={{
                    fullScreen: { enable: false },
                    background: { color: { value: "transparent" } },
                    particles: {
                        number: {
                            value: 100,
                            density: {
                                enable: true,
                                area: 1000
                            }
                        },
                        color: {
                            value: getDotColor()
                        },
                        shape: {
                            type: "circle"
                        },
                        opacity: {
                            value: 0.1,
                            random: { enable: true, minimumValue: 0.05 }
                        },
                        size: {
                            value: { min: 1, max: 4 }
                        },
                        move: {
                            enable: true,
                            speed: 0.2,
                            direction: "none",
                            outModes: {
                                default: "out"
                            }
                        }
                    },
                    detectRetina: true
                }}
            />
        </div>
    );
}
