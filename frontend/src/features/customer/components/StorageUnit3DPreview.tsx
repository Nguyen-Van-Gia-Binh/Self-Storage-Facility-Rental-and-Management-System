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
const SCALE = 25; // 25px = 1 mét thực tế

/**
 * Mô hình 3D Isometric tỉ lệ 1:1 theo kích thước thực tế trong CSDL (V16):
 * XS (1×1×2.5m) → S (1.5×2×2.5m) → M (2×3×2.5m) → L (2.5×4×2.5m) → XL (3×5×3m).
 * Hiển thị đa kích thước thùng carton (S/M/L), vali, tủ lạnh và sofa xếp không chồng chéo.
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

  // Căn giữa mô hình tự động trong viewBox 340×214 theo tỉ lệ kích thước thật
  const originX = 185 - ((L - W) / 2) * SCALE * COS30;
  const originY = 112 - ((L + W) / 2) * SCALE * SIN30 + (H / 2) * SCALE;

  const p = (u: number, v: number, z: number): [number, number] => [
    originX + (u - v) * SCALE * COS30,
    originY + (u + v) * SCALE * SIN30 - z * SCALE,
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

  // Vị trí bóng người tham chiếu cao 1.7m đứng phía trước bên trái
  const [hx, hy] = p(0.15, W + 0.45, 0);
  const humanH = 1.7 * SCALE;

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
    <div className="relative w-full bg-[#f4faf8] rounded-xl border border-teal-200/70 overflow-hidden">
      {/* Thông số góc trên trái */}
      <div className="absolute top-2.5 left-3 z-10 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-md bg-white/95 border border-teal-200 text-[11px] font-bold text-[#125449] shadow-2xs">
          {spec.areaM2} m² · {spec.volumeM3} m³
        </span>
        {isClimate && (
          <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-[10px] font-semibold text-sky-700">
            20–25°C
          </span>
        )}
      </div>

      {/* Độ lấp đầy hoặc cảnh báo vượt cỡ nếu có món đồ */}
      {hasCustomItems && (
        <div className="absolute top-2.5 right-3 z-10 flex items-center gap-1">
          {isOverflow ? (
            <>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-amber-50 border-amber-300 text-amber-800">
                Chưa vừa hết (+{packResult.overflowCount})
              </span>
              {recommendedSize && recommendedSize !== spec.code && onSelectSize && (
                <button
                  type="button"
                  onClick={() => onSelectSize(recommendedSize)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#125449] text-white hover:bg-[#0e4239] cursor-pointer shadow-2xs"
                >
                  Đổi sang {recommendedSize}
                </button>
              )}
            </>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                fillPercent > 78
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              Lấp đầy ~{fillPercent}%
            </span>
          )}
        </div>
      )}

      <svg
        viewBox="0 0 340 214"
        className="w-full h-[188px] sm:h-[204px] select-none"
        role="img"
        data-item-count={packResult.boxes.length}
        aria-label={`Mô hình 3D kho cỡ ${spec.code} kích thước ${L}m x ${W}m x ${H}m`}
      >
        {/* Sàn kho */}
        <polygon
          points={floorPts}
          fill={isClimate ? '#e0f2fe' : '#e1f2ed'}
          stroke="#57b29a"
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
            stroke={isClimate ? '#bae6fd' : '#bce3d7'}
            strokeWidth="0.9"
          />
        ))}

        {/* Tường sau bên trái */}
        <polygon
          points={leftWallPts}
          fill={isClimate ? '#f0f9ff' : '#f8fbfa'}
          stroke="#75beaa"
          strokeWidth="1.1"
        />

        {/* Tường sau bên phải */}
        <polygon
          points={rightWallPts}
          fill={isClimate ? '#e6f4fe' : '#eef7f4'}
          stroke="#75beaa"
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

          return (
            <g key={i}>
              <polygon
                points={leftFace}
                fill={b.left}
                stroke="#0f3d35"
                strokeWidth="0.45"
                strokeOpacity="0.35"
              />
              <polygon
                points={rightFace}
                fill={b.right}
                stroke="#0f3d35"
                strokeWidth="0.45"
                strokeOpacity="0.35"
              />
              <polygon
                points={topFace}
                fill={b.top}
                stroke="#0f3d35"
                strokeWidth="0.45"
                strokeOpacity="0.35"
              />
              {tapeStart && tapeEnd && (
                <line
                  x1={tapeStart[0]}
                  y1={tapeStart[1]}
                  x2={tapeEnd[0]}
                  y2={tapeEnd[1]}
                  stroke="#925b19"
                  strokeWidth="1.2"
                  strokeOpacity="0.45"
                />
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
                  stroke="#125449"
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
          stroke="#57b29a"
          strokeWidth="0.9"
          strokeDasharray="3 3"
          opacity="0.7"
        />
        <line
          x1={p(L, 0, H)[0]}
          y1={p(L, 0, H)[1]}
          x2={p(L, W, H)[0]}
          y2={p(L, W, H)[1]}
          stroke="#57b29a"
          strokeWidth="0.9"
          strokeDasharray="3 3"
          opacity="0.7"
        />
        <line
          x1={p(L, W, 0)[0]}
          y1={p(L, W, 0)[1]}
          x2={p(L, W, H)[0]}
          y2={p(L, W, H)[1]}
          stroke="#57b29a"
          strokeWidth="0.9"
          strokeDasharray="3 3"
          opacity="0.7"
        />

        {/* Bóng người 1.7m làm thước đo tỷ lệ thật */}
        <g transform={`translate(${hx}, ${hy})`} opacity="0.65">
          <circle cx="0" cy={-humanH + 5} r="4" fill="#125449" />
          <path
            d={`M -4 ${-humanH + 10} L 4 ${-humanH + 10} L 3 -14 L 4 0 L 1.2 0 L 0 -13 L -1.2 0 L -4 0 L -3 -14 Z`}
            fill="#125449"
          />
          <text
            x="0"
            y="10"
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="600"
            fill="#367969"
          >
            1.7m
          </text>
        </g>

        {/* Nhãn đo kích thước thực tế Dài × Rộng × Cao */}
        <text
          x={(lStartX + lEndX) / 2 - 4}
          y={(lStartY + lEndY) / 2 + 12}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="#125449"
        >
          {L.toFixed(1)}m
        </text>
        <text
          x={(lEndX + wEndX) / 2 + 10}
          y={(lEndY + wEndY) / 2 + 11}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="#125449"
        >
          {W.toFixed(1)}m
        </text>
        <text
          x={hBotX + 14}
          y={(hBotY + hTopY) / 2 + 3}
          textAnchor="start"
          fontSize="9"
          fontWeight="700"
          fill="#367969"
        >
          ↕ {H.toFixed(1)}m
        </text>
      </svg>
    </div>
  );
};
