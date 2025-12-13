export const Sponsors = () => {
  const sponsors = [
    { name: 'Hochschule Schmalkalden', abbreviation: 'HSM' },
    { name: 'WORT', abbreviation: 'WORT' },
    { name: 'Thüringen', abbreviation: 'TH' },
    { name: 'European Union', abbreviation: 'EU' },
  ];

  return (
    <section className="py-12 border-t border-b border-border bg-muted/30">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Funded and supported by
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.name}
              className="flex items-center justify-center px-6 py-3 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">
                    {sponsor.abbreviation}
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                  {sponsor.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
