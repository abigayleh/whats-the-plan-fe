const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...strokeProps} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function ListsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...strokeProps} {...props}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
    </svg>
  );
}

export function PollsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...strokeProps} {...props}>
      <path d="M5 21V10M12 21V4M19 21v-7" />
    </svg>
  );
}

export function MapIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...strokeProps} {...props}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...strokeProps} {...props}>
      <path d="M4 5h16v11H8l-4 4z" />
    </svg>
  );
}

export function GroupsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...strokeProps} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 8.5a2.5 2.5 0 1 1 0-5M17 20a6 6 0 0 0-3.5-8.5" />
    </svg>
  );
}

export function PagesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...strokeProps} {...props}>
      <path d="M7 3h7l4 4v14H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4M9.5 12h5M9.5 16h5" />
    </svg>
  );
}

export function TableIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...strokeProps} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M3 15h18M9 4v16M15 4v16" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" {...strokeProps} {...props}>
      <path d="m4 12 6 6L20 6" />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...strokeProps} {...props}>
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...strokeProps} {...props}>
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

export function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...strokeProps} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function RepeatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M17 2l4 4-4 4M3 12V10a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 12v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function ShoppingIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M6 8h12l-1 13H7L6 8ZM9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function GroceriesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M4 9h16l-1.5 10a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2L4 9ZM8 9V7a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

export function TravelIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M10.5 16.5 3 14l1-2 8 1.5 3.5-6.5a1.6 1.6 0 0 1 2.8 1.5L15 15l1.5 6.5-2-1-1.5-3.5-2.5-.5Z" />
    </svg>
  );
}

export function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M4 11 12 4l8 7M6 10v9h12v-9" />
    </svg>
  );
}

export function HealthIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M12 21s-7-4.35-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.65-9.5 9-9.5 9Z" />
    </svg>
  );
}

export function FitnessIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M4 9v6M20 9v6M7 12h10M2 12h2M20 12h2M6 7v10M18 7v10" />
    </svg>
  );
}

export function WorkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </svg>
  );
}

export function CelebrationIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M20 12 4 20l3-8-3-2 8-3 2-5 3 6 6 1-3 3Z" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function SkipForwardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="m5 5 7 7-7 7M12 5l7 7-7 7" />
    </svg>
  );
}

export function FolderIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}

export function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM13.5 8l2.5 2.5" />
    </svg>
  );
}

export function GripIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...strokeProps} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function LayersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5" />
    </svg>
  );
}

export function MoneyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M14.5 9.5a2.5 2.5 0 0 0-2.5-1.5c-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2a2.5 2.5 0 0 1-2.5-1.5" />
    </svg>
  );
}

export function StarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6Z" />
    </svg>
  );
}

export function GameIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M7 8h10a4 4 0 0 1 4 4l1 5a2 2 0 0 1-3.5 1.5L16 16H8l-2.5 2.5A2 2 0 0 1 2 17l1-5a4 4 0 0 1 4-4Z" />
      <path d="M7.5 11v3M6 12.5h3M15 12h.01M17.5 10.5h.01" />
    </svg>
  );
}

export function LaptopIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <rect x="4" y="5" width="16" height="10" rx="1.5" />
      <path d="M2 19h20M9 19l1-2h4l1 2" />
    </svg>
  );
}

export function BookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" />
      <path d="M4 19a2.5 2.5 0 0 1 2.5-2.5H20" />
    </svg>
  );
}

export function CartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h7.7a2 2 0 0 0 2-1.6L21 8H6" />
      <circle cx="9.5" cy="20.5" r="1.2" />
      <circle cx="17.5" cy="20.5" r="1.2" />
    </svg>
  );
}

export function HeartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M12 21S3.5 15.6 3.5 9.9A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 8.5 2.4C20.5 15.6 12 21 12 21Z" />
    </svg>
  );
}

export function MusicIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </svg>
  );
}

export function FoodIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M6 2v8a2 2 0 0 0 4 0V2M8 10v12M18 2c-2 1-3 3-3 6s1 4 3 4M18 2v18" />
    </svg>
  );
}

export function GiftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <rect x="3" y="9" width="18" height="4" />
      <path d="M5 13h14v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8ZM12 9v13" />
      <path d="M12 9c-1-3-3-5-5-5-1.5 0-2.5 1-2.5 2.2C4.5 8 6 9 8 9h4ZM12 9c1-3 3-5 5-5 1.5 0 2.5 1 2.5 2.2C19.5 8 18 9 16 9h-4Z" />
    </svg>
  );
}

export function CameraIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

export function PetsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <circle cx="7" cy="9" r="1.6" />
      <circle cx="12" cy="7.5" r="1.7" />
      <circle cx="17" cy="9" r="1.6" />
      <path d="M12 12c-2.5 0-4.5 1.8-4.5 4 0 1.7 1.5 2.5 3 2.5.7 0 1-.3 1.5-.3s.8.3 1.5.3c1.5 0 3-.8 3-2.5 0-2.2-2-4-4.5-4Z" />
    </svg>
  );
}

export function HobbiesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2s-.5-1.5-.5-2.5S14.5 15 16 15h1a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z" />
      <circle cx="8" cy="9" r="1" />
      <circle cx="12" cy="7" r="1" />
      <circle cx="16" cy="9.5" r="1" />
    </svg>
  );
}

export function VacationIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M12 21V9" />
      <path d="M12 9c-1-3-4-4-8-3M12 9c1-3 4-4 8-3M12 9c-2-2-3-5-2-8M12 9c2-2 3-5 2-8" />
    </svg>
  );
}

export function CoffeeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" />
      <path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M8 3c-.5 1 .5 2 0 3M12 3c-.5 1 .5 2 0 3" />
    </svg>
  );
}

export function PlaneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M22 4 11 15M22 4l-7 18-4-7-7-4 18-7Z" />
    </svg>
  );
}

export function NatureIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <path d="M4 20c0-9 6-15 16-16 1 10-5 16-16 16Z" />
      <path d="M4 20C8 14 12 11 18 9" />
    </svg>
  );
}

export function SportsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3 2-1 4h-4l-1-4 3-2ZM12 7V3M15 9l3.5-1.5M14 13l2.5 3M10 13l-2.5 3M9 9 5.5 7.5" />
    </svg>
  );
}
