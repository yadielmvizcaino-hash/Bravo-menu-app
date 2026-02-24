
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'white' | 'black' | 'amber';
}

const Logo: React.FC<LogoProps> = ({ className = "h-12", variant = 'amber' }) => {
  const colors = {
    white: '#FFFFFF',
    black: '#000000',
    amber: '#F59E0B'
  };

  const color = colors[variant];

  return (
    <svg 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Representación estilizada del Logo Bravo Menú */}
      <path 
        d="M150 100H280C350 100 380 140 380 190C380 230 350 260 310 270V275C360 285 400 320 400 380C400 450 350 490 280 490H150V100ZM220 160V250H270C300 250 320 235 320 205C320 175 300 160 270 160H220ZM220 310V430H280C320 430 340 410 340 370C340 330 320 310 280 310H220Z" 
        fill={color} 
      />
      {/* Cuchara y Tenedor cruzados (Simplificados para SVG de UI) */}
      <path 
        d="M100 350C100 300 150 250 220 200L240 220C170 270 120 320 120 370C120 420 100 450 100 450L80 430C80 430 100 400 100 350Z" 
        fill={color} 
        opacity="0.8"
      />
      <path 
        d="M180 480C230 480 280 430 330 360L310 340C260 410 210 460 160 460C110 460 80 480 80 480L100 500C100 500 130 480 180 480Z" 
        fill={color}
      />
    </svg>
  );
};

export default Logo;
