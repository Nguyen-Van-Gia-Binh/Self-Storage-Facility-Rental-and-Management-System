#!/usr/bin/env bash
# =============================================================================
#  Kiem tra tinh nhat quan giua cac tai lieu phan tich.
#
#  Cach chay (tu THU MUC GOC repo):
#      bash docs/check-docs.sh
#
#  Ma tra ve:  0 = sach   |   1 = co loi   |   2 = chay sai thu muc
#
#  Script nay chi lo "Lop 1 — tinh nhat quan" trong quy trinh review
#  (xem docs/REVIEW-CHECKLIST.md). No KHONG danh gia noi dung dung hay sai —
#  viec do la Lop 2 va Lop 3, phai lam bang mat va bang phan doan.
#
#  Chay lai script nay moi khi them use case, user story hoac business rule.
# =============================================================================

# --- Chot chan: thieu file ma van chay tiep se cho ket qua "sach" gia --------
MISSING=0
for f in README.md CONTRIBUTING.md docs/TOPIC.md docs/PLAN.md docs/USE-CASES.md \
         docs/USER-STORIES.md docs/BUSINESS-RULES.md docs/CONVENTIONS.md \
         docs/diagrams/use-case-diagram.puml; do
  [ -f "$f" ] || { echo "THIEU FILE: $f"; MISSING=1; }
done
[ $MISSING -eq 0 ] || { echo; echo "Dung lai. Hay chay script tu thu muc goc repo."; exit 2; }

FAIL=0
report() { if [ -s "$1" ]; then echo "  ✗ $2"; sed 's/^/      /' "$1"; FAIL=1; else echo "  ✓ $2"; fi; }
T=$(mktemp -d)

echo "== 1. Link tuong doi =="
: > "$T/l"
for f in README.md CONTRIBUTING.md docs/*.md; do
  d=$(dirname "$f")
  grep -o '](\([^)#]*\.\(md\|puml\|sh\)\)[^)]*)' "$f" 2>/dev/null | sed 's/](//; s/[#)].*//' | sort -u |
  while read -r l; do [ -e "$d/$l" ] || echo "$f -> $l"; done >> "$T/l"
done
report "$T/l" "moi link tro toi file co that"

echo "== 2. Ma UC duoc tham chieu nhung khong ton tai =="
grep -o '^| `UC-[A-Z0-9-]*`' docs/USE-CASES.md | tr -d '|` ' | sort -u > "$T/uc_def"
grep -oh 'UC-\(F[0-9]-[0-9][0-9]\|SYS-[0-9][0-9]\)' docs/USER-STORIES.md docs/BUSINESS-RULES.md \
  docs/diagrams/use-case-diagram.puml README.md 2>/dev/null | sort -u > "$T/uc_ref"
comm -13 "$T/uc_def" "$T/uc_ref" > "$T/uc_bad"
report "$T/uc_bad" "moi ma UC duoc tham chieu deu co dinh nghia"

echo "== 3. Ma BR duoc tham chieu nhung khong ton tai =="
grep -o '^| `BR-[A-Z]*-[0-9][0-9]`' docs/BUSINESS-RULES.md | tr -d '|` ' | sort -u > "$T/br_def"
grep -oh 'BR-[A-Z]\{3\}-[0-9][0-9]' docs/*.md README.md CONTRIBUTING.md | sort -u > "$T/br_ref"
comm -13 "$T/br_def" "$T/br_ref" > "$T/br_bad"
report "$T/br_bad" "moi ma BR duoc tham chieu deu co dinh nghia"

echo "== 4. Ma yeu cau khong co trong TOPIC.md § 3 =="
grep -o '^| `\?\(SC\|FS\|FM\|BM\|SA\)-[0-9][0-9]' docs/TOPIC.md | grep -o '[A-Z]\{2\}-[0-9][0-9]' | sort -u > "$T/rq_def"
grep -oh '\(SC\|FS\|FM\|BM\|SA\)-[0-9][0-9]' docs/USE-CASES.md docs/USER-STORIES.md docs/BUSINESS-RULES.md | sort -u > "$T/rq_ref"
comm -13 "$T/rq_def" "$T/rq_ref" > "$T/rq_bad"
report "$T/rq_bad" "moi ma yeu cau duoc tham chieu deu co trong TOPIC § 3"

echo "== 5. Ma yeu cau chua duoc phu boi use case nao =="
comm -23 "$T/rq_def" <(awk '/^## 10\./,/^## 11\./' docs/USE-CASES.md | grep -o '^| `\(SC\|FS\|FM\|BM\|SA\)-[0-9][0-9]`' | grep -o '[A-Z]\{2\}-[0-9][0-9]' | sort -u) > "$T/rq_unc"
report "$T/rq_unc" "ca 27 ma yeu cau deu co mat trong ban do phu"

echo "== 6. So luong khop giua cac bang =="
UC_TBL=$(grep -c '^| `UC-' docs/USE-CASES.md)
UC_PUML=$(grep -c '^    usecase "UC-' docs/diagrams/use-case-diagram.puml)
ST=$(grep -c '^### `US-SC-' docs/USER-STORIES.md)
ST_TBL=$(grep -c '^| `US-SC-' docs/USER-STORIES.md)
AC=$(grep -c '^- \*\*AC-' docs/USER-STORIES.md)
: > "$T/n"
[ "$UC_TBL" = "$UC_PUML" ] || echo "use case: bang=$UC_TBL puml=$UC_PUML" >> "$T/n"
[ "$ST" = "$ST_TBL" ] || echo "user story: so muc=$ST so dong bang tong hop=$ST_TBL" >> "$T/n"
report "$T/n" "use case ($UC_TBL) va user story ($ST story / $AC AC) khop giua cac bang"

echo "== 7. Ma task khong co trong PLAN.md =="
grep -o '^| T[0-9]\+\.[0-9]\+' docs/PLAN.md | tr -d '| ' | sort -u > "$T/tk_def"
grep -ohE '\bT[0-9]+\.[0-9]+\b' $(ls docs/*.md | grep -v 'docs/PLAN.md') CONTRIBUTING.md README.md \
  2>/dev/null | sort -u > "$T/tk_ref"
comm -13 "$T/tk_def" "$T/tk_ref" > "$T/tk_bad"
report "$T/tk_bad" "moi ma task duoc nhac deu co trong PLAN.md"

echo "== 8. Con so neu trong van ban vs thuc te =="
: > "$T/c"
UC_SAY=$(grep -o '\*\*[0-9]\+ use case nghiệp vụ\*\*' docs/USE-CASES.md | grep -o '[0-9]\+' | head -1)
SYS_SAY=$(grep -o '\*\*[0-9]\+ use case nền tảng\*\*' docs/USE-CASES.md | grep -o '[0-9]\+' | head -1)
UC_SYS=$(grep -c '^| `UC-SYS-' docs/USE-CASES.md)
UC_FLOW=$(grep -c '^| `UC-F' docs/USE-CASES.md)
[ "$UC_SAY" = "$UC_FLOW" ] || echo "USE-CASES § 1 noi $UC_SAY use case nghiep vu, dem duoc $UC_FLOW" >> "$T/c"
[ "$SYS_SAY" = "$UC_SYS" ] || echo "USE-CASES § 1 noi $SYS_SAY use case nen tang, dem duoc $UC_SYS" >> "$T/c"
for n in $(grep -o '\*\*[0-9]\+ user story\*\*' docs/USER-STORIES.md | grep -o '[0-9]\+'); do
  [ "$n" = "$ST" ] || echo "USER-STORIES noi $n user story, dem duoc $ST" >> "$T/c"
done
for n in $(grep -o '\*\*[0-9]\+ acceptance criteria\*\*' docs/USER-STORIES.md | grep -o '[0-9]\+'); do
  [ "$n" = "$AC" ] || echo "USER-STORIES § 1 noi $n acceptance criteria, dem duoc $AC" >> "$T/c"
done
TOTAL_LINE=$(grep '^\*\*Tổng:\*\*' docs/USER-STORIES.md)
echo "$TOTAL_LINE" | grep -q "$ST story" || echo "USER-STORIES § 8 dong Tong: so story khong khop ($ST)" >> "$T/c"
echo "$TOTAL_LINE" | grep -q "$AC acceptance criteria" || echo "USER-STORIES § 8 dong Tong: so AC khong khop ($AC)" >> "$T/c"
AC_SUM=$(awk '/^## 8\./,0' docs/USER-STORIES.md | grep '^| `US-SC-' | awk -F'|' '{gsub(/ /,"",$8); s+=$8} END {print s+0}')
[ "$AC_SUM" = "$AC" ] || echo "Cot 'So AC' trong bang tong hop cong lai = $AC_SUM, dem thuc te = $AC" >> "$T/c"
report "$T/c" "con so trong van ban khop voi so dem duoc"

rm -rf "$T"
echo
if [ $FAIL -eq 0 ]; then
  echo "KET QUA: sach — Lop 1 dat. Chuyen sang Lop 2 (doi chieu nguon)."
else
  echo "KET QUA: co loi — sua roi chay lai."
fi
exit $FAIL
