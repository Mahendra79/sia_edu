import { useEffect, useRef } from "react";
import "./QuantumBackground.css";

export default function QuantumBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let time = 0;

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Define 3 wave lines with different settings
    const waves = [
      {
        centerXRatio: 0.15, // Left background wave
        zigZagAmp: 45,
        zigZagFreq: 0.002,
        flucAmp: 15,
        flucFreq: 0.015,
        speed: 1.2,
        phase: 0,
        lineWidth: 1.5,
        colorStart: "rgba(139, 92, 246, 0.15)", // Purple
        colorEnd: "rgba(59, 130, 246, 0.05)",
        glowColor: "rgba(139, 92, 246, 0.3)",
      },
      {
        centerXRatio: 0.5, // Center/Background wave
        zigZagAmp: 60,
        zigZagFreq: 0.0015,
        flucAmp: 20,
        flucFreq: 0.01,
        speed: 0.8,
        phase: Math.PI / 2,
        lineWidth: 2,
        colorStart: "rgba(59, 130, 246, 0.2)", // Blue
        colorEnd: "rgba(6, 182, 212, 0.05)",
        glowColor: "rgba(59, 130, 246, 0.4)",
      },
      {
        centerXRatio: 0.85, // Right foreground wave
        zigZagAmp: 50,
        zigZagFreq: 0.0025,
        flucAmp: 25,
        flucFreq: 0.02,
        speed: 1.6,
        phase: Math.PI,
        lineWidth: 2.5,
        colorStart: "rgba(6, 182, 212, 0.3)", // Cyan
        colorEnd: "rgba(16, 185, 129, 0.08)",
        glowColor: "rgba(6, 182, 212, 0.6)",
      },
    ];

    // Particles following the wave paths
    const particles = [];
    const maxParticles = 36;

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        y: Math.random() * canvas.height,
        speed: 0.8 + Math.random() * 1.5,
        size: 1 + Math.random() * 3,
        alpha: 0.1 + Math.random() * 0.6,
        waveIndex: i % waves.length,
      });
    }

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle background glow overlays
      const radialGlow = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        10,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8
      );
      radialGlow.addColorStop(0, "rgba(8, 12, 24, 0.4)");
      radialGlow.addColorStop(1, "rgba(0, 0, 0, 0.9)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waves
      waves.forEach((wave) => {
        const centerX = canvas.width * wave.centerXRatio;
        
        ctx.beginPath();
        ctx.lineWidth = wave.lineWidth;
        
        // Gradient stroke
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, wave.colorEnd);
        grad.addColorStop(0.5, wave.colorStart);
        grad.addColorStop(1, wave.colorEnd);
        
        ctx.strokeStyle = grad;
        ctx.shadowBlur = 10;
        ctx.shadowColor = wave.glowColor;

        for (let y = canvas.height + 20; y >= -20; y -= 15) {
          const zigZag = Math.sin(y * wave.zigZagFreq + wave.phase) * wave.zigZagAmp;
          const fluctuation = Math.sin(y * wave.flucFreq - time * wave.speed) * wave.flucAmp;
          // Random quantum jitter
          const jitter = Math.sin(time * 2 + y * 0.05) * 2;
          const x = centerX + zigZag + fluctuation + jitter;

          if (y === canvas.height + 20) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // Draw particles rising along the waves
      ctx.shadowBlur = 8;
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.speed = 0.8 + Math.random() * 1.5;
        }

        const wave = waves[p.waveIndex];
        const centerX = canvas.width * wave.centerXRatio;
        const zigZag = Math.sin(p.y * wave.zigZagFreq + wave.phase) * wave.zigZagAmp;
        const fluctuation = Math.sin(p.y * wave.flucFreq - time * wave.speed) * wave.flucAmp;
        const jitter = Math.sin(time * 2 + p.y * 0.05) * 2;
        const x = centerX + zigZag + fluctuation + jitter;

        ctx.beginPath();
        ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = wave.glowColor.replace(/[\d.]+\)$/, `${p.alpha})`);
        ctx.shadowColor = wave.glowColor;
        ctx.fill();
      });

      // Reset shadow for performance
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="quantum-bg-canvas" />;
}
