type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  className = "",
  eyebrowClassName = "",
  titleClassName = "",
  descriptionClassName = "",
}: Props) {
  return (
    <div className={className}>
      {eyebrow ? (
        <p
          className={`text-[10px] font-black uppercase tracking-[0.24em] text-[var(--fc-accent)] ${eyebrowClassName}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-2 text-lg font-black tracking-[-0.02em] text-white sm:text-xl ${titleClassName}`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-2 max-w-2xl text-sm leading-7 text-[var(--fc-muted)] ${descriptionClassName}`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
