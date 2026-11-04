import React from 'react'

interface CountdownRingProps {
  secondsRemaining: number
  totalSeconds: number
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  secondsRemaining,
  totalSeconds,
}) => {
  const size = 90
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (totalSeconds - secondsRemaining) / totalSeconds
  const strokeDashoffset = circumference * progress
  const isUrgent = secondsRemaining <= 3

  return (
    <div className={`relative flex items-center justify-center ${isUrgent ? 'scale-105 transition-transform duration-150' : ''}`}>
      <svg
        width={size}
        height={size}
        aria-hidden="true"
        className="transform -rotate-90"
      >
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={strokeWidth}
          fill="rgba(10, 10, 14, 0.65)"
        />
        {/* Animated countdown progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isUrgent ? '#FF385C' : '#FF6680'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>
      {/* Center number */}
      <span
        data-testid="countdown-number"
        className={`absolute text-3xl font-black font-mono tracking-tight ${isUrgent ? 'text-[#FF385C] animate-pulse' : 'text-white'}`}
      >
        {secondsRemaining}
      </span>
    </div>
  )
}
