export default function Background() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <svg className="w-[140vmax] h-[1400] opacity-10 translate-x-20 translate-y-8" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="50" r="48" stroke="#0a441d" strokeWidth="0.6" fill="none" />
        <circle cx="62" cy="32" r="36" stroke="#0a441d" strokeWidth="0.6" fill="none" />
        <circle cx="92" cy="66" r="24" stroke="#0a441d" strokeWidth="0.6" fill="none" />
      </svg>
    </div>
  )
}

