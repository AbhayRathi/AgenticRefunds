interface ProactiveCreditBannerProps {
  amount: number;
}

export function ProactiveCreditBanner({ amount }: ProactiveCreditBannerProps) {
  return (
    <div className="mx-4 my-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg animate-slide-down">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
          🎁
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">Instant Credit Granted</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Proactive Trust Repair
            </span>
          </div>
          <div className="text-2xl font-bold mt-1">${amount} DoorDash Credit</div>
          <p className="text-sm text-white/80 mt-1">
            Applied automatically to your next order
          </p>
        </div>
      </div>
    </div>
  );
}
