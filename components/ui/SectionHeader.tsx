type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  className = "",
}: Props) {
  return (
    <div className={className}>
      {eyebrow ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--fc-accent)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}
