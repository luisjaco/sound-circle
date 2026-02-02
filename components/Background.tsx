export default function Background() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
      <svg className="w-[1200px] h-[1200px] opacity-5" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="50" r="45" stroke="#0b3514" strokeWidth="0.7" fill="none"/>
        <circle cx="65" cy="50" r="35" stroke="#05260c" strokeWidth="0.7" fill="none"/>
        <circle cx="82" cy="64" r="24" stroke="#083010" strokeWidth="0.7" fill="none"/>
      </svg>
    </div>
  )
}

