type OptionChoiceProps = {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
};

export function OptionChoice({
  name,
  value,
  label,
  checked,
  onChange,
}: OptionChoiceProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors duration-150 ${
        checked
          ? "border-p5-teal bg-p5-teal/5"
          : "border-p5-border bg-p5-surface hover:border-p5-teal/50"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-0.5 accent-p5-teal"
      />
      <span className="text-p5-ink leading-snug">{label}</span>
    </label>
  );
}
