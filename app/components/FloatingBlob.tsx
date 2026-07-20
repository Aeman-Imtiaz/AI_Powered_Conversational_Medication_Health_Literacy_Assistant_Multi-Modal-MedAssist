export default function FloatingBlob({
  color,
  size = 400,
  top,
  left,
  right,
  bottom,
  delay = 0,
}: {
  color: string;
  size?: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: number;
}) {
  return (
    <div
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        background: color,
        opacity: 0.12,
        animation: `blob 8s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}