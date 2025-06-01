import React, { useEffect, useState } from 'react'
import {
  ConstructionIcon,
  CodeIcon,
  CoffeeIcon,
  BugIcon,
  RocketIcon,
  KeyboardIcon,
  MonitorIcon,
  DatabaseIcon,
} from 'lucide-react'
const UnderDevelopment = () => {
  const [dots, setDots] = useState('.')
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((dots) => (dots.length >= 3 ? '.' : dots + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])
  const handleRocketClick = () => {
    setClickCount((prev) => prev + 1)
    if (clickCount >= 4) {
      setShowEasterEgg(true)
    }
  }
  const floatingIcons = [
    <CodeIcon key="code" className="w-6 h-6 text-blue-500" />,
    <BugIcon key="bug" className="w-6 h-6 text-green-500" />,
    <KeyboardIcon key="keyboard" className="w-6 h-6 text-purple-500" />,
    <MonitorIcon key="monitor" className="w-6 h-6 text-yellow-500" />,
    <DatabaseIcon key="database" className="w-6 h-6 text-red-500" />,
    <CoffeeIcon key="coffee" className="w-6 h-6 text-orange-500" />,
  ]
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        {/* Main Content */}
        <div className="relative">
          <ConstructionIcon className="mx-auto h-24 w-24 text-yellow-500 animate-bounce" />
          {floatingIcons.map((icon, index) => (
            <div
              key={index}
              className="absolute animate-float"
              style={{
                top: `${Math.sin(index) * 60}px`,
                left: `${Math.cos(index) * 60 + 150}px`,
                animation: `float 3s ease-in-out infinite`,
                animationDelay: `${index * 0.5}s`,
              }}
            >
              {icon}
            </div>
          ))}
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          Under Development{dots}
        </h1>
        <p className="text-xl text-gray-600">
          Our team of coding wizards is brewing something amazing!
        </p>
        {/* Fun Interactive Element */}
        <div className="mt-8 space-y-4">
          <button
            onClick={handleRocketClick}
            className="transform transition-transform duration-200 hover:scale-110 focus:outline-none"
          >
            <RocketIcon className="h-12 w-12 text-blue-500 animate-pulse" />
          </button>
          <p className="text-sm text-gray-500">
            {clickCount === 0 && 'Psst... try clicking the rocket!'}
            {clickCount > 0 &&
              clickCount < 5 &&
              `${5 - clickCount} more clicks for a surprise!`}
          </p>
        </div>
        {/* Easter Egg */}
        {showEasterEgg && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg animate-fadeIn">
            <p className="text-blue-600">
              🎉 You found the easter egg! Here's a dad joke:
            </p>
            <p className="text-gray-800 mt-2">
              Why do programmers prefer dark mode?
              <br />
              Because light attracts bugs! 🪲
            </p>
          </div>
        )}
        {/* Progress Bar */}
        <div className="mt-8 w-full max-w-md mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full animate-progress"
              style={{
                width: '70%',
              }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Approximately 70% complete
          </p>
        </div>
        {/* Fun Facts */}
        <div className="mt-8 text-sm text-gray-600">
          <p>While you wait, did you know?</p>
          <p className="mt-2">
            The first computer bug was an actual bug - a moth found in the Mark
            II computer in 1947! 🐛
          </p>
        </div>
      </div>
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 70%;
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-progress {
          animation: progress 2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
export default UnderDevelopment
