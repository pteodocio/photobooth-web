import React from 'react'

interface CountdownRingProps {
  secondsRemaining: number
  totalSeconds: number
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  secondsRemaining,
  totalSeconds,
}) => {
  const size = 96
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (totalSeconds - secondsRemaining) / totalSeconds
  const strokeDashoffset = circumference * progress

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated countdown progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FF5252"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="rgba(0, 0, 0, 0.45)"
          className="transition-all duration-300 ease-linear"
        />
      </svg>
      {/* Center number */}
      <span className="absolute text-4xl font-black text-white font-mono tracking-tight drop-shadow-md">
        {secondsRemaining}
      </span>
    </div>
  )
}
