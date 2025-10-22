import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className = '' }: LogoProps) {
  return (
    <div
      style={{ height: size, width: size }}
      className={`relative ${className}`}
    >
      <Image
        src="/logo.svg"
        alt="LunarSwap Logo"
        width={size}
        height={size}
        className="rounded-full object-contain"
      />
    </div>
  );
}
