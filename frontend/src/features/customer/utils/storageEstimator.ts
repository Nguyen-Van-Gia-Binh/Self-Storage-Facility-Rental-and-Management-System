import type { UnitSpec3D } from '../components/StorageUnit3DPreview';

export type EstimatorItemKey =
  | 'boxS'
  | 'boxM'
  | 'boxL'
  | 'suitcase'
  | 'appliance'
  | 'sofa';

export type EstimatorItemCounts = Record<EstimatorItemKey, number>;

export const EMPTY_ESTIMATOR_COUNTS: EstimatorItemCounts = {
  boxS: 0,
  boxM: 0,
  boxL: 0,
  suitcase: 0,
  appliance: 0,
  sofa: 0,
};

export interface EstimatorItemMeta {
  key: EstimatorItemKey;
  label: string;
  sizeLabel: string;
  du: number; // mét
  dv: number; // mét
  dz: number; // mét
  volM3: number;
  kind: 'carton' | 'suitcase' | 'appliance' | 'sofa';
  maxStackM: number;
  colors: {
    top: string;
    left: string;
    right: string;
  };
}

export const STORAGE_ESTIMATOR_ITEMS: EstimatorItemMeta[] = [
  {
    key: 'boxS',
    label: 'Thùng nhỏ (S)',
    sizeLabel: '40×30×30 cm',
    du: 0.4,
    dv: 0.3,
    dz: 0.3,
    volM3: 0.036,
    kind: 'carton',
    maxStackM: 1.8,
    colors: { top: '#f8e3ba', left: '#e6c281', right: '#cca154' },
  },
  {
    key: 'boxM',
    label: 'Thùng vừa (M)',
    sizeLabel: '50×40×40 cm',
    du: 0.5,
    dv: 0.4,
    dz: 0.4,
    volM3: 0.08,
    kind: 'carton',
    maxStackM: 1.8,
    colors: { top: '#f0c784', left: '#d8a454', right: '#b88233' },
  },
  {
    key: 'boxL',
    label: 'Thùng lớn (L)',
    sizeLabel: '60×50×50 cm',
    du: 0.6,
    dv: 0.5,
    dz: 0.5,
    volM3: 0.15,
    kind: 'carton',
    maxStackM: 1.8,
    colors: { top: '#e2ab62', left: '#c4893b', right: '#9f6820' },
  },
  {
    key: 'suitcase',
    label: 'Vali du lịch',
    sizeLabel: '45×30×70 cm',
    du: 0.45,
    dv: 0.3,
    dz: 0.7,
    volM3: 0.095,
    kind: 'suitcase',
    maxStackM: 1.45,
    colors: { top: '#75beaa', left: '#439782', right: '#2c6155' },
  },
  {
    key: 'appliance',
    label: 'Tủ lạnh / Giặt',
    sizeLabel: '65×65×145 cm',
    du: 0.65,
    dv: 0.65,
    dz: 1.45,
    volM3: 0.613,
    kind: 'appliance',
    maxStackM: 1.8,
    colors: { top: '#e2e8f0', left: '#cbd5e1', right: '#94a3b8' },
  },
  {
    key: 'sofa',
    label: 'Sofa / Nệm',
    sizeLabel: '150×80×75 cm',
    du: 1.5,
    dv: 0.8,
    dz: 0.75,
    volM3: 0.9,
    kind: 'sofa',
    maxStackM: 1.8,
    colors: { top: '#9cc7bb', left: '#6ea394', right: '#4d7c6f' },
  },
];

export const ITEM_META_BY_KEY: Record<EstimatorItemKey, EstimatorItemMeta> =
  STORAGE_ESTIMATOR_ITEMS.reduce(
    (acc, item) => {
      acc[item.key] = item;
      return acc;
    },
    {} as Record<EstimatorItemKey, EstimatorItemMeta>
  );

// Bộ đồ mẫu khởi tạo đồng bộ 1:1 với bộ đếm trên Hero (khớp mặc định cỡ M)
export const INITIAL_SAMPLE_COUNTS: EstimatorItemCounts = {
  boxS: 2,
  boxM: 3,
  boxL: 2,
  suitcase: 1,
  appliance: 1,
  sofa: 1,
};

export interface PlacedIsoBox {
  u: number;
  v: number;
  z: number;
  du: number;
  dv: number;
  dz: number;
  top: string;
  left: string;
  right: string;
  renderType: 'carton' | 'suitcase' | 'appliance' | 'sofa-base' | 'sofa-back';
}

export interface PackResult {
  boxes: PlacedIsoBox[];
  overflowCount: number;
  usedFloorRatio: number;
  totalVolumeM3: number;
}

const CELL_SCALE = 20; // 1 ô = 0.05m -> mọi kích thước đồ & kho đều là bội nguyên chính xác
const SURF_FLOOR = 0;
const SURF_BOX = 1;
const SURF_SUITCASE = 2;
const SURF_BLOCKED = 3;

const PACK_PRIORITY: EstimatorItemKey[] = [
  'sofa',
  'appliance',
  'boxL',
  'boxM',
  'boxS',
  'suitcase',
];

function isSurfaceCompatible(kind: EstimatorItemMeta['kind'], surf: number, zCells: number): boolean {
  if (kind === 'sofa' || kind === 'appliance') {
    return surf === SURF_FLOOR && zCells === 0;
  }
  if (kind === 'carton') {
    return surf === SURF_FLOOR || surf === SURF_BOX;
  }
  return surf === SURF_FLOOR || surf === SURF_SUITCASE;
}

function getNextSurface(kind: EstimatorItemMeta['kind']): number {
  if (kind === 'carton') return SURF_BOX;
  if (kind === 'suitcase') return SURF_SUITCASE;
  return SURF_BLOCKED;
}

export function sumItemCounts(counts: EstimatorItemCounts): number {
  return (
    counts.boxS +
    counts.boxM +
    counts.boxL +
    counts.suitcase +
    counts.appliance +
    counts.sofa
  );
}

export function computeTotalSelectedVolume(counts: EstimatorItemCounts): number {
  return STORAGE_ESTIMATOR_ITEMS.reduce(
    (sum, item) => sum + (counts[item.key] || 0) * item.volM3,
    0
  );
}

/**
 * Xếp các món đồ vào kho theo lưới vật lý 5cm, không chồng chéo và kiểm tra giới hạn thực tế.
 */
export function packItemsIntoUnit(spec: UnitSpec3D, counts: EstimatorItemCounts): PackResult {
  const maxU = Math.max(1, Math.round(spec.lengthM * CELL_SCALE));
  const maxV = Math.max(1, Math.round(spec.widthM * CELL_SCALE));
  const unitHeightCells = Math.max(1, Math.round(spec.heightM * CELL_SCALE));

  const zGrid = new Uint16Array(maxU * maxV);
  const surfGrid = new Uint8Array(maxU * maxV);

  const boxes: PlacedIsoBox[] = [];
  let overflowCount = 0;

  for (const key of PACK_PRIORITY) {
    const count = Math.min(Math.max(0, counts[key] || 0), 60);
    if (count === 0) continue;

    const meta = ITEM_META_BY_KEY[key];
    const cU = Math.round(meta.du * CELL_SCALE);
    const cV = Math.round(meta.dv * CELL_SCALE);
    const cZ = Math.round(meta.dz * CELL_SCALE);
    const maxTopCells = Math.min(
      unitHeightCells - 1,
      Math.round(meta.maxStackM * CELL_SCALE)
    );

    const orientations: Array<[number, number]> =
      cU === cV ? [[cU, cV]] : [[cU, cV], [cV, cU]];

    for (let n = 0; n < count; n++) {
      let bestScore = Infinity;
      let bestPlacement: { gu: number; gv: number; baseZ: number; duCells: number; dvCells: number } | null =
        null;

      for (const [duCells, dvCells] of orientations) {
        if (duCells > maxU || dvCells > maxV) continue;
        const rotPenalty = duCells === cU ? 0 : 0.25;

        for (let gu = 0; gu <= maxU - duCells; gu++) {
          if (gu >= bestScore) break;
          for (let gv = 0; gv <= maxV - dvCells; gv++) {
            if (gu + gv >= bestScore) break;
            const idx0 = gu * maxV + gv;
            const baseZ = zGrid[idx0];
            if (baseZ + cZ > maxTopCells) continue;
            if (!isSurfaceCompatible(meta.kind, surfGrid[idx0], baseZ)) continue;

            // Ưu tiên sát tường sau (u=0, v=0) và xếp chồng vừa phải (1.4 * chiều cao)
            const score = baseZ * 1.4 + gu + gv + rotPenalty;
            if (score >= bestScore) continue;

            let valid = true;
            for (let du = 0; du < duCells && valid; du++) {
              const rowOffset = (gu + du) * maxV + gv;
              for (let dv = 0; dv < dvCells; dv++) {
                const idx = rowOffset + dv;
                if (
                  zGrid[idx] !== baseZ ||
                  !isSurfaceCompatible(meta.kind, surfGrid[idx], baseZ)
                ) {
                  valid = false;
                  break;
                }
              }
            }

            if (valid) {
              bestScore = score;
              bestPlacement = { gu, gv, baseZ, duCells, dvCells };
            }
          }
        }
      }

      if (!bestPlacement) {
        overflowCount += 1;
        continue;
      }

      const { gu, gv, baseZ, duCells, dvCells } = bestPlacement;
      const nextSurf = getNextSurface(meta.kind);
      const nextZ = baseZ + cZ;
      for (let du = 0; du < duCells; du++) {
        const rowOffset = (gu + du) * maxV + gv;
        for (let dv = 0; dv < dvCells; dv++) {
          zGrid[rowOffset + dv] = nextZ;
          surfGrid[rowOffset + dv] = nextSurf;
        }
      }

      const u = gu / CELL_SCALE;
      const v = gv / CELL_SCALE;
      const z = baseZ / CELL_SCALE;
      const du = duCells / CELL_SCALE;
      const dv = dvCells / CELL_SCALE;
      const dz = cZ / CELL_SCALE;

      if (meta.kind === 'sofa') {
        const seatH = 0.38;
        boxes.push({
          u,
          v,
          z,
          du,
          dv,
          dz: seatH,
          ...meta.colors,
          renderType: 'sofa-base',
        });
        // Tựa lưng áp vào tường sau gần nhất
        const alignAlongUWall = gu <= 1 && dv > du;
        boxes.push({
          u,
          v,
          z: z + seatH,
          du: alignAlongUWall ? 0.22 : du,
          dv: alignAlongUWall ? dv : 0.22,
          dz: dz - seatH,
          top: '#8abdb0',
          left: '#5b9485',
          right: '#437165',
          renderType: 'sofa-back',
        });
      } else {
        boxes.push({
          u,
          v,
          z,
          du,
          dv,
          dz,
          ...meta.colors,
          renderType: meta.kind,
        });
      }
    }
  }

  let occupiedCells = 0;
  for (let i = 0; i < zGrid.length; i++) {
    if (zGrid[i] > 0) occupiedCells += 1;
  }

  return {
    boxes: sortBoxesIsometric(boxes),
    overflowCount,
    usedFloorRatio: occupiedCells / (maxU * maxV),
    totalVolumeM3: computeTotalSelectedVolume(counts),
  };
}

/**
 * Sắp xếp thứ tự vẽ 3D Isometric chính xác theo Kahn Topological Sort + kiểm tra chồng lấp màn hình.
 */
function sortBoxesIsometric(boxes: PlacedIsoBox[]): PlacedIsoBox[] {
  const n = boxes.length;
  if (n <= 1) return boxes;

  const EPS = 1e-4;
  const bounds = boxes.map((b) => ({
    sxMin: b.u - (b.v + b.dv),
    sxMax: b.u + b.du - b.v,
    syMin: 0.5 * (b.u + b.v) - (b.z + b.dz),
    syMax: 0.5 * (b.u + b.du + b.v + b.dv) - b.z,
  }));

  const adj: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array<number>(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const si = bounds[i];
      const sj = bounds[j];
      const overlapsScreen =
        si.sxMax > sj.sxMin + EPS &&
        sj.sxMax > si.sxMin + EPS &&
        si.syMax > sj.syMin + EPS &&
        sj.syMax > si.syMin + EPS;

      if (!overlapsScreen) continue;

      const a = boxes[i];
      const b = boxes[j];
      const bHidesA =
        b.u + b.du > a.u + EPS &&
        b.v + b.dv > a.v + EPS &&
        b.z + b.dz > a.z + EPS;
      const aHidesB =
        a.u + a.du > b.u + EPS &&
        a.v + a.dv > b.v + EPS &&
        a.z + a.dz > b.z + EPS;

      if (bHidesA && !aHidesB) {
        adj[i].push(j);
        indeg[j] += 1;
      } else if (aHidesB && !bHidesA) {
        adj[j].push(i);
        indeg[i] += 1;
      }
    }
  }

  const placed = new Array<boolean>(n).fill(false);
  const result: PlacedIsoBox[] = [];
  const depthKey = (b: PlacedIsoBox) => b.u + b.du * 0.5 + b.v + b.dv * 0.5 + b.z;

  while (result.length < n) {
    let pick = -1;
    for (let i = 0; i < n; i++) {
      if (!placed[i] && indeg[i] === 0) {
        if (pick === -1 || depthKey(boxes[i]) < depthKey(boxes[pick])) {
          pick = i;
        }
      }
    }

    // Fallback an toàn nếu phát sinh vòng lặp giả
    if (pick === -1) {
      for (let i = 0; i < n; i++) {
        if (!placed[i] && (pick === -1 || depthKey(boxes[i]) < depthKey(boxes[pick]))) {
          pick = i;
        }
      }
    }

    placed[pick] = true;
    result.push(boxes[pick]);
    for (const next of adj[pick]) {
      indeg[next] -= 1;
    }
  }

  return result;
}

const SIZE_ORDER: Array<UnitSpec3D['code']> = ['XS', 'S', 'M', 'L', 'XL'];

/**
 * Chọn cỡ kho nhỏ nhất chứa gọn toàn bộ đồ đạc đã chọn (chừa ~22% lối đi cho cỡ S..XL).
 */
export function recommendUnitSize(
  specs: Record<UnitSpec3D['code'], UnitSpec3D>,
  counts: EstimatorItemCounts
): UnitSpec3D['code'] {
  if (sumItemCounts(counts) === 0) return 'M';

  for (const code of SIZE_ORDER) {
    if (code === 'XL') return 'XL';
    const spec = specs[code];
    const pack = packItemsIntoUnit(spec, counts);
    if (pack.overflowCount > 0) continue;

    const practicalVol = spec.areaM2 * 1.55;
    const maxFloor = code === 'XS' ? 0.92 : 0.78;
    if (pack.usedFloorRatio <= maxFloor && pack.totalVolumeM3 <= practicalVol * 0.85) {
      return code;
    }
  }

  return 'XL';
}

