/**
 * Utility to determine whether a storage unit has been specifically assigned
 * to a reservation or contract (as opposed to placeholder/pending assignment).
 */
export const isStorageUnitAssigned = (unitNumber?: string | null): boolean => {
  if (!unitNumber) return false;
  const normalized = unitNumber.trim().toLowerCase();
  return (
    normalized !== '' &&
    normalized !== 'chưa gán ô' &&
    normalized !== 'chưa gán' &&
    normalized !== 'chưa chọn ô' &&
    normalized !== 'chua chon o' &&
    normalized !== 'chua gan o' &&
    normalized !== 'chua gan' &&
    normalized !== 'tba' &&
    normalized !== '---' &&
    normalized !== 'null' &&
    normalized !== 'undefined'
  );
};

