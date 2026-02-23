interface VinylIconProps {
  filled?: boolean;
  className?: string;
}

export function VinylIcon({ filled = false, className = "w-5 h-5" }: VinylIconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rim */}
      <circle 
        cx="12" 
        cy="12" 
        r="11" 
        stroke={filled ? "#1DB954" : "#4B5563"}
        strokeWidth="0.5"
        fill={filled ? "#1DB954" : "transparent"}
        opacity={filled ? "0.2" : "1"}
      />
      
      {/* Grooves */}
      <circle 
        cx="12" 
        cy="12" 
        r="9" 
        stroke={filled ? "#1DB954" : "#4B5563"}
        strokeWidth="0.3"
        fill="none"
        opacity="0.6"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="7.5" 
        stroke={filled ? "#1DB954" : "#4B5563"}
        strokeWidth="0.3"
        fill="none"
        opacity="0.5"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="6" 
        stroke={filled ? "#1DB954" : "#4B5563"}
        strokeWidth="0.3"
        fill="none"
        opacity="0.4"
      />
      
      {/* Label area */}
      <circle 
        cx="12" 
        cy="12" 
        r="4.5" 
        fill={filled ? "#1DB954" : "#1F2937"}
        stroke={filled ? "#1DB954" : "#4B5563"}
        strokeWidth="0.5"
      />
      
      {/* Center hole */}
      <circle 
        cx="12" 
        cy="12" 
        r="1.5" 
        fill="#000000"
        stroke={filled ? "#1DB954" : "#6B7280"}
        strokeWidth="0.3"
      />
      
      {/* Small center dot */}
      <circle 
        cx="12" 
        cy="12" 
        r="0.5" 
        fill={filled ? "#1DB954" : "#9CA3AF"}
      />
    </svg>
  );
}
