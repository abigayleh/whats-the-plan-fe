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
