export const Sponsors = () => {
  const sponsors = [
    { name: 'Hochschule Schmalkalden', logo: '/hs Logo2.png' },
    { name: 'WORT', logo: '/Wort Logo 2.png' },
    { name: 'Thüringen', logo: '/Th logo 2.png' },
    { name: 'European Union', logo: '/EU Logo 2.png' },
  ];

  return (
    <section className="py-12 border-t border-b border-border bg-muted/30">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Supported by
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.name}
              className="flex flex-col items-center justify-center px-6 py-3 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            >
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="w-32 h-32 object-contain mb-2"
              />

              <span className="text-sm font-medium text-muted-foreground text-center">
                {sponsor.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
