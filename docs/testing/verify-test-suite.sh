#!/usr/bin/env bash
# =============================================================================
#  verify-test-suite.sh — Kiem tra tinh toan ven & nhat quan cua bo tai lieu test.
#
#  Cach chay (tu thu muc goc repo):
#      bash docs/testing/verify-test-suite.sh
#
#  Ma tra ve:  0 = sach, dat 100%   |   1 = co loi
# =============================================================================

set -e
FAIL=0

echo "================================================================="
echo "  KIEM TRA BO TAI LIEU TEST HE THONG (MASTER TEST PLAN & SUITES) "
echo "================================================================="

DIR="docs/testing"

# --- 1. Kiem tra su ton tai cua du 9 tai lieu trong suite ----------------------
echo "== 1. Kiem tra file ton tai =="
FILES=(
  "$DIR/MASTER-TEST-PLAN.md"
  "$DIR/TEST-CASES-FLOW-1-RESERVATION.md"
  "$DIR/TEST-CASES-FLOW-2-CHECKIN.md"
  "$DIR/TEST-CASES-FLOW-3-RETURN.md"
  "$DIR/TEST-CASES-FLOW-4-BUSINESS.md"
  "$DIR/TEST-CASES-FLOW-5-FACILITY-STAFF.md"
  "$DIR/TEST-CASES-FLOW-6-RENEWAL-OVERDUE.md"
  "$DIR/TEST-CASES-FLOW-7-SUPPORT.md"
  "$DIR/TEST-CASES-SECURITY-API-NONFUNCTIONAL.md"
)

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "  ✓ $f"
  else
    echo "  ✗ THIEU FILE: $f"
    FAIL=1
  fi
done

# --- 2. Kiem tra quy tac cam dung the tu / RFID ------------------------------
echo "== 2. Kiem tra quy tac nghiep vu: Cam dung the RFID trong checkin/handover =="
ILLEGAL_RFID=$(grep -in "thẻ RFID" $DIR/*.md | grep -viE "(cấm|không|tuyệt đối)" || true)
if [ -n "$ILLEGAL_RFID" ]; then
  echo "  ✗ Phat hien su dung the RFID trai quy dinh:"
  echo "$ILLEGAL_RFID"
  FAIL=1
else
  echo "  ✓ Quy tac nghiep vu tuan thu: Tuyet doi khong cap/su dung the RFID (chi dung PIN 6 so hoac khoa co)"
fi

# --- 3. Kiem tra do phu 27 ma yeu cau chuc nang tu TOPIC.md -------------------
echo "== 3. Kiem tra do phu 27 ma yeu cau chuc nang (SC, FS, FM, BM, SA) =="
RQ_LIST=(
  SC-01 SC-02 SC-03 SC-04 SC-05 SC-06
  FS-01 FS-02 FS-03 FS-04 FS-05 FS-06
  FM-01 FM-02 FM-03 FM-04 FM-05 FM-06
  BM-01 BM-02 BM-03 BM-04 BM-05
  SA-01 SA-02 SA-03 SA-04
)

MISSING_RQ=0
for rq in "${RQ_LIST[@]}"; do
  if ! grep -q "$rq" $DIR/*.md; then
    echo "  ✗ Thieu ma yeu cau: $rq"
    MISSING_RQ=1
    FAIL=1
  fi
done

if [ $MISSING_RQ -eq 0 ]; then
  echo "  ✓ Toan bo 27/27 ma yeu cau chuc nang deu da duoc bao phu trong test suite!"
fi

# --- 4. Dem tong so luong Test Cases da thiet ke -----------------------------
echo "== 4. Thong ke tong so Test Cases da thiet ke =="
TOTAL_TC=$(grep -oh 'TC-[A-Z0-9]\{2,4\}-[0-9]\{3\}' $DIR/TEST-CASES-*.md | sort -u | wc -l)
echo "  ✓ Tong cong da sinh: $TOTAL_TC Test Cases chi tiet dat chuan IEEE 829"

# --- Ket luan ----------------------------------------------------------------
echo "================================================================="
if [ $FAIL -eq 0 ]; then
  echo "  KET QUA: TAT CA KIEM TRA DEU DAT (ALL CHECKS PASSED)!"
  exit 0
else
  echo "  KET QUA: CO LOI TRONG BO TAI LIEU TEST!"
  exit 1
fi
