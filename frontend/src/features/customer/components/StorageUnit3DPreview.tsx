import React, { useMemo } from 'react';
import {
  packItemsIntoUnit,
  sumItemCounts,
  type EstimatorItemCounts,
} from '../utils/storageEstimator';

export interface UnitSpec3D {
  code: 'XS' | 'S' | 'M' | 'L' | 'XL';
  widthM: number;
  lengthM: number;
  heightM: number;
  areaM2: number;
  volumeM3: number;
}

interface StorageUnit3DPreviewProps {
  spec: UnitSpec3D;
  environment: 'STANDARD' | 'CLIMATE_CONTROLLED';
  itemCounts: EstimatorItemCounts;
  recommendedSize?: UnitSpec3D['code'];
  onSelectSize?: (code: UnitSpec3D['code']) => void;
}

const COS30 = 0.8660254;
const SIN30 = 0.5;

/**
 * Mô hình 3D Isometric tỉ lệ thực tế (V16), tự căn zoom rộng thoáng theo cỡ ô XS..XL,
 * phân biệt rõ màu sắc & ký hiệu từng cỡ thùng carton S / M / L.
 */
export const StorageUnit3DPreview: React.FC<StorageUnit3DPreviewProps> = ({
  spec,
  environment,
  itemCounts,
  recommendedSize,
  onSelectSize,
}) => {
  const { widthM: W, lengthM: L, heightM: H } = spec;

  const hasCustomItems = sumItemCounts(itemCounts) > 0;

  const packResult = useMemo(() => {
    return packItemsIntoUnit(spec, itemCounts);
  }, [spec, itemCounts]);

  const fillPercent = useMemo(() => {
    if (!hasCustomItems) return 0;
    const practicalVol = spec.areaM2 * 1.55;
    return Math.max(1, Math.min(100, Math.round((packResult.totalVolumeM3 / practicalVol) * 100)));
  }, [hasCustomItems, packResult.totalVolumeM3, spec.areaM2]);

  // Tự động phóng to khung 3D lấp đầy sân khấu 360×236, cân đối cho cả ô nhỏ lẫn ô lớn
  const unitIsoW = (L + W) * COS30;
  const unitIsoH = H + (L + W) * SIN30;
  const scale = Math.min(296 / unitIsoW, 186 / unitIsoH);

  const rawMinX = -W * scale * COS30;
  const rawMaxX = L * scale * COS30;
  const rawMinY = -H * scale;
  const rawMaxY = (L + W) * scale * SIN30;

  const originX = 180 - (rawMinX + rawMaxX) / 2;
  const originY = 120 - (rawMinY + rawMaxY) / 2;

  const p = (u: number, v: number, z: number): [number, number] => [
    originX + (u - v) * scale * COS30,
    originY + (u + v) * scale * SIN30 - z * scale,
  ];

  const pts = (coords: [number, number][]) =>
    coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Các đỉnh sàn & tường
  const floorPts = pts([p(0, 0, 0), p(L, 0, 0), p(L, W, 0), p(0, W, 0)]);
  const leftWallPts = pts([p(0, 0, 0), p(0, W, 0), p(0, W, H), p(0, 0, H)]);
  const rightWallPts = pts([p(0, 0, 0), p(L, 0, 0), p(L, 0, H), p(0, 0, H)]);

  // Lưới ô sàn từng 1 mét để khách nhìn trực quan số m²
  const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let u = 1; u < L; u += 1) {
    const [x1, y1] = p(u, 0, 0);
    const [x2, y2] = p(u, W, 0);
    gridLines.push({ x1, y1, x2, y2 });
  }
  for (let v = 1; v < W; v += 1) {
    const [x1, y1] = p(0, v, 0);
    const [x2, y2] = p(L, v, 0);
    gridLines.push({ x1, y1, x2, y2 });
  }

  // Điểm đo kích thước
  const [lStartX, lStartY] = p(0, W, 0);
  const [lEndX, lEndY] = p(L, W, 0);
  const [wEndX, wEndY] = p(L, 0, 0);
  const [hBotX, hBotY] = p(L, 0, 0);
  const [, hTopY] = p(L, 0, H);

  const isClimate = environment === 'CLIMATE_CONTROLLED';
  const acCenter = p(L * 0.45, 0.04, H - 0.42);
  const isOverflow = hasCustomItems && packResult.overflowCount > 0;

  return (
    <div className="relative w-full bg-[#f3f8fc] rounded-2xl border border-sky-200/80 overflow-hidden">
      {/* Thông số góc trên trái */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <span className="px-2.5 py-1 rounded-lg bg-white/95 border border-sky-200 text-xs font-bold text-[#0c5a8a] shadow-2xs">
          {spec.areaM2} m² · {spec.volumeM3} m³
        </span>
        {isClimate && (
          <span className="px-2.5 py-1 rounded-lg bg-sky-100/90 border border-sky-200 text-xs font-semibold text-sky-900">
            20–25°C
          </span>
        )}
      </div>

      {/* Độ lấp đầy hoặc cảnh báo vượt cỡ nếu có món đồ */}
      {hasCustomItems && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {isOverflow ? (
            <>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-amber-50 border-amber-300 text-amber-900">
                Chưa vừa hết (+{packResult.overflowCount})
              </span>
              {recommendedSize && recommendedSize !== spec.code && onSelectSize && (
                <button
                  type="button"
                  onClick={() => onSelectSize(recommendedSize)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0c5a8a] text-white hover:bg-[#084369] cursor-pointer shadow-2xs"
                >
                  Đổi sang {recommendedSize}
                </button>
              )}
            </>
          ) : (
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                fillPercent > 78
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-sky-50 border-sky-200 text-[#0c5a8a]'
              }`}
            >
              Lấp đầy ~{fillPercent}%
            </span>
          )}
        </div>
      )}

      <svg
        viewBox="0 0 360 236"
        className="w-full h-[250px] sm:h-[296px] select-none"
        role="img"
        data-item-count={packResult.boxes.length}
        aria-label={`Mô hình 3D kho cỡ ${spec.code} kích thước ${L}m x ${W}m x ${H}m`}
      >
        {/* Sàn kho */}
        <polygon
          points={floorPts}
          fill={isClimate ? '#dbeafe' : '#e0f0fb'}
          stroke="#3898cf"
          strokeWidth="1.2"
        />

        {/* Lưới ô 1m² trên sàn */}
        {gridLines.map((ln, idx) => (
          <line
            key={idx}
            x1={ln.x1}
            y1={ln.y1}
            x2={ln.x2}
            y2={ln.y2}
            stroke={isClimate ? '#bfdbfe' : '#c5e2f8'}
            strokeWidth="0.9"
          />
        ))}

        {/* Tường sau bên trái */}
        <polygon
          points={leftWallPts}
          fill={isClimate ? '#eff6ff' : '#f7fbff'}
          stroke="#60aad8"
          strokeWidth="1.1"
        />

        {/* Tường sau bên phải */}
        <polygon
          points={rightWallPts}
          fill={isClimate ? '#e5f0fd' : '#edf6fc'}
          stroke="#60aad8"
          strokeWidth="1.1"
        />

        {/* Cục lạnh điều hòa gắn tường khi chọn Kho Máy Lạnh */}
        {isClimate && (
          <g transform={`translate(${acCenter[0] - 14}, ${acCenter[1] - 5})`}>
            <rect width="28" height="10" rx="2" fill="#0284c7" opacity="0.85" />
            <line x1="4" y1="7" x2="24" y2="7" stroke="#bae6fd" strokeWidth="1.2" />
          </g>
        )}

        {/* Các vật dụng 3D xếp bên trong theo thứ tự Topological Sort */}
        {packResult.boxes.map((b, i) => {
          const topFace = pts([
            p(b.u, b.v, b.z + b.dz),
            p(b.u + b.du, b.v, b.z + b.dz),
            p(b.u + b.du, b.v + b.dv, b.z + b.dz),
            p(b.u, b.v + b.dv, b.z + b.dz),
          ]);
          const leftFace = pts([
            p(b.u, b.v + b.dv, b.z),
            p(b.u + b.du, b.v + b.dv, b.z),
            p(b.u + b.du, b.v + b.dv, b.z + b.dz),
            p(b.u, b.v + b.dv, b.z + b.dz),
          ]);
          const rightFace = pts([
            p(b.u + b.du, b.v, b.z),
            p(b.u + b.du, b.v + b.dv, b.z),
            p(b.u + b.du, b.v + b.dv, b.z + b.dz),
            p(b.u + b.du, b.v, b.z + b.dz),
          ]);

          // Nét băng keo dán nắp thùng carton để phân biệt rõ thùng S/M/L
          const tapeStart =
            b.renderType === 'carton' ? p(b.u, b.v + b.dv * 0.5, b.z + b.dz) : null;
          const tapeEnd =
            b.renderType === 'carton' ? p(b.u + b.du, b.v + b.dv * 0.5, b.z + b.dz) : null;

          // Đường chia ngăn tủ lạnh/máy giặt
          const doorL1 =
            b.renderType === 'appliance' ? p(b.u, b.v + b.dv, b.z + b.dz * 0.62) : null;
          const doorL2 =
            b.renderType === 'appliance' ? p(b.u + b.du, b.v + b.dv, b.z + b.dz * 0.62) : null;
          const doorR2 =
            b.renderType === 'appliance' ? p(b.u + b.du, b.v, b.z + b.dz * 0.62) : null;

          // Quai kéo nhỏ trên đầu vali
          const handleL =
            b.renderType === 'suitcase'
              ? p(b.u + b.du * 0.35, b.v + b.dv * 0.5, b.z + b.dz + 0.06)
              : null;
          const handleR =
            b.renderType === 'suitcase'
              ? p(b.u + b.du * 0.65, b.v + b.dv * 0.5, b.z + b.dz + 0.06)
              : null;
          const badgeCenter =
            b.badge ? p(b.u + b.du * 0.5, b.v + b.dv * 0.5, b.z + b.dz) : null;

          return (
            <g key={`${b.renderType}-${i}`} className="pixel-drop-in">
              <polygon
                points={leftFace}
                fill={b.left}
                stroke="#1e293b"
                strokeWidth="0.45"
                strokeOpacity="0.32"
              />
              <polygon
                points={rightFace}
                fill={b.right}
                stroke="#1e293b"
                strokeWidth="0.45"
                strokeOpacity="0.32"
              />
              <polygon
                points={topFace}
                fill={b.top}
                stroke="#1e293b"
                strokeWidth="0.45"
                strokeOpacity="0.32"
              />
              {tapeStart && tapeEnd && (
                <line
                  x1={tapeStart[0]}
                  y1={tapeStart[1]}
                  x2={tapeEnd[0]}
                  y2={tapeEnd[1]}
                  stroke="#334155"
                  strokeWidth="1.1"
                  strokeOpacity="0.25"
                />
              )}
              {badgeCenter && b.badge && (
                <text
                  x={badgeCenter[0]}
                  y={badgeCenter[1] + 2.1}
                  textAnchor="middle"
                  fontSize={b.badge === 'S' ? 6 : b.badge === 'M' ? 7 : 8}
                  fontWeight="800"
                  fill="#0f172a"
                  opacity="0.78"
                >
                  {b.badge}
                </text>
              )}
              {doorL1 && doorL2 && doorR2 && (
                <polyline
                  points={`${doorL1[0]},${doorL1[1]} ${doorL2[0]},${doorL2[1]} ${doorR2[0]},${doorR2[1]}`}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="0.7"
                  strokeOpacity="0.55"
                />
              )}
              {handleL && handleR && (
                <line
                  x1={handleL[0]}
                  y1={handleL[1]}
                  x2={handleR[0]}
                  y2={handleR[1]}
                  stroke="#0c5a8a"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}

        {/* Khung nét đứt mặt trước hoàn thiện khối không gian 3D */}
        <line
          x1={p(0, W, H)[0]}
          y1={p(0, W, H)[1]}
          x2={p(L, W, H)[0]}
          y2={p(L, W, H)[1]}
          stroke="#3898cf"
          strokeWidth="0.9"
          strokeDasharray="3 3"
          opacity="0.7"
        />
        <line
          x1={p(L, 0, H)[0]}
          y1={p(L, 0, H)[1]}
          x2={p(L, W, H)[0]}
          y2={p(L, W, H)[1]}
          stroke="#3898cf"
          strokeWidth="0.9"
          strokeDasharray="3 3"
          opacity="0.7"
        />
        <line
          x1={p(L, W, 0)[0]}
          y1={p(L, W, 0)[1]}
          x2={p(L, W, H)[0]}
          y2={p(L, W, H)[1]}
          stroke="#3898cf"
          strokeWidth="0.9"
          strokeDasharray="3 3"
          opacity="0.7"
        />

        {/* Nhãn đo kích thước thực tế Dài × Rộng × Cao */}
        <text
          x={(lStartX + lEndX) / 2 - 4}
          y={(lStartY + lEndY) / 2 + 13}
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill="#0c5a8a"
        >
          {L.toFixed(1)}m
        </text>
        <text
          x={(lEndX + wEndX) / 2 + 10}
          y={(lEndY + wEndY) / 2 + 12}
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill="#0c5a8a"
        >
          {W.toFixed(1)}m
        </text>
        <text
          x={hBotX + 14}
          y={(hBotY + hTopY) / 2 + 3}
          textAnchor="start"
          fontSize="9.5"
          fontWeight="700"
          fill="#0284c7"
        >
          ↕ {H.toFixed(1)}m
        </text>
      </svg>

      {/* Chú thích phân biệt cỡ thùng ngay dưới đáy mô hình */}
      <div className="px-3.5 pb-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#facc15] border border-black/15" />
          Thùng S
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#fb923c] border border-black/15" />
          Thùng M
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#38bdf8] border border-black/15" />
          Thùng L
        </span>
      </div>
    </div>
  );
};
