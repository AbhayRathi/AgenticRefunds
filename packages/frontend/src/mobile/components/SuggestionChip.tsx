interface SuggestionChipProps {
  text: string;
  onClick: () => void;
}

export function SuggestionChip({ text, onClick }: SuggestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-white border-2 border-doordash-red text-doordash-red rounded-full text-sm font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
    >
      {text}
    </button>
  );
}
