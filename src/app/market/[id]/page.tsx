export default function MarketDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Market Detail</h1>
      <p>Market ID: {params.id}</p>
    </main>
  );
} 