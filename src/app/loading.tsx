export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center font-mono">
      <div className="space-y-4 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#888888]">
          LOADING GOATED NATION...
        </p>
      </div>
    </div>
  );
}
