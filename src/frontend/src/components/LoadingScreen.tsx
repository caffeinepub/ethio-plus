export default function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <img
          src="/assets/generated/ethioplus-logo-transparent.dim_200x200.png"
          alt="Ethio+"
          className="w-20 h-20 animate-pulse"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="ethio-brand text-3xl gold-gradient">Ethio+</h1>
        <p className="text-muted-foreground text-sm animate-pulse">
          Loading...
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-accent"
            style={{
              animationDelay: `${i * 0.15}s`,
              animation: "pulse 1.2s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}
