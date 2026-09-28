import React from 'react';

interface YLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'burgundy';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const YLogo: React.FC<YLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showText = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    xs: { mark: 'w-5 h-5', text: 'text-sm font-semibold tracking-wider' },
    sm: { mark: 'w-6 h-6', text: 'text-base font-semibold tracking-wider' },
    md: { mark: 'w-8 h-8', text: 'text-lg font-bold tracking-tight' },
    lg: { mark: 'w-10 h-10', text: 'text-xl font-bold tracking-tight' },
    xl: { mark: 'w-14 h-14', text: 'text-2xl font-bold tracking-tight' },
  };

  const markFill = {
    dark: '#191816',
    light: '#FAF8F5',
    burgundy: '#581825',
  }[variant];

  const textColor = {
    dark: 'text-[#191816]',
    light: 'text-[#FAF8F5]',
    burgundy: 'text-[#581825]',
  }[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`inline-flex items-center gap-2.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#581825] rounded transition-opacity ${
        onClick ? 'cursor-pointer hover:opacity-85' : ''
      } ${className}`}
      aria-label="YAAWP Services Home"
    >
      {/* Distinctive Architectural Y Symbol */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeMap[size].mark} shrink-0`}
        aria-hidden="true"
      >
        {/* Crisp, authoritative Y geometry: split angled arms meeting a solid vertical trunk */}
        <path
          d="M7 6H11.5L16 14.5L20.5 6H25L18 17.5V26H14V17.5L7 6Z"
          fill={markFill}
        />
        {/* Subtle horizontal baseline & top-arm anchor hairline */}
        <rect x="13.5" y="25" width="5" height="1.5" fill={markFill} />
        <rect x="6.5" y="5.5" width="5.5" height="1.2" fill={markFill} />
        <rect x="20" y="5.5" width="5.5" height="1.2" fill={markFill} />
      </svg>

      {showText && (
        <span className={`font-serif tracking-tight leading-none ${textColor} ${sizeMap[size].text}`}>
          YAAWP<span className="font-sans text-[0.65em] uppercase font-semibold tracking-widest ml-1 opacity-75">Services</span>
        </span>
      )}
    </div>
  );
};
