import React from 'react';

interface HomeCityBoardProps {
  cities: string[];
  counts: Record<string, number>;
  selectedCity: string;
  isLoading: boolean;
  onSelectCity: (city: string) => void;
}

/** Bảng nút thành phố lấy từ cơ sở thật. Không gắn thành phố nào khi API không trả về. */
export const HomeCityBoard: React.FC<HomeCityBoardProps> = ({
  cities,
  counts,
  selectedCity,
  isLoading,
  onSelectCity,
}) => {
  return (
    <section aria-label="Bảng thành phố" className="space-y-4">
      <div>
        <h3 className="text-base font-extrabold text-[#0a1614] tracking-tight">Chọn thành phố</h3>
        <p className="mt-1 text-sm text-slate-600">
          Chỉ hiện thành phố đang có cơ sở. Bấm một ô để lọc danh sách bên dưới.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-none">
        {isLoading ? (
          <p className="text-sm text-slate-500">Đang tải khu vực...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => {
              const selected = selectedCity === city;
              const count = counts[city] ?? 0;
              return (
                <button
                  key={city}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectCity(city)}
                  className={`min-w-[9.5rem] rounded-xl border px-4 py-3 text-left cursor-pointer ${
                    selected
                      ? 'border-[#5b1a20] bg-[#5b1a20] text-white'
                      : 'border-slate-200 bg-white text-[#1a1a1a] hover:border-[#5b1a20]'
                  }`}
                >
                  <span className="block text-sm font-bold">{city}</span>
                  <span className={`mt-0.5 block text-xs tabular-nums ${selected ? 'text-[#f8d5d1]' : 'text-slate-500'}`}>
                    {count} cơ sở
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
