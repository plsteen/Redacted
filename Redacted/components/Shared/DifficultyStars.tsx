interface DifficultyStarsProps {
  difficulty: number; // 1-4: easy, medium, hard, very hard
  size?: "sm" | "md" | "lg";
  maxStars?: number;
}

export function DifficultyStars({ difficulty, size = "md", maxStars = 4 }: DifficultyStarsProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <span className={`tracking-wider ${sizeClasses[size]}`}>
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
        <span
          key={star}
          className={star <= difficulty ? "text-[var(--color-gold)]" : "text-[var(--color-muted)]/30"}
        >
          ★
        </span>
      ))}
    </span>
  );
}
