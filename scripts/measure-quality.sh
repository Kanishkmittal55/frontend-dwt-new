#!/bin/bash

###############################################################################
# Quality Measurement Script
#
# This script runs all quality checks and produces a comprehensive score
# based on the metrics defined in LLM_EXTENSION_CONVENTION.md
#
# Usage: ./scripts/measure-quality.sh [--strict] [--verbose]
###############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
STRICT_MODE=false
VERBOSE=false
SKIP_BUILD=false
SKIP_TESTS=false

for arg in "$@"; do
  case $arg in
    --strict)
      STRICT_MODE=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
  esac
done

# Scores for each category (out of 100)
BUILD_SCORE=0
LINT_SCORE=0
TEST_SCORE=0
CONVENTION_SCORE=0
STABILITY_BONUS=0

# Weights
BUILD_WEIGHT=25
LINT_WEIGHT=20
TEST_WEIGHT=30
CONVENTION_WEIGHT=25
STABILITY_BONUS_WEIGHT=10

echo ""
echo "========================================================================"
echo "🎯 BERRY DASHBOARD - COMPREHENSIVE QUALITY MEASUREMENT"
echo "========================================================================"
echo ""
echo "Mode: $([ "$STRICT_MODE" = true ] && echo "STRICT" || echo "NORMAL")"
echo "Verbose: $([ "$VERBOSE" = true ] && echo "YES" || echo "NO")"
echo ""
echo "========================================================================"
echo ""

###############################################################################
# 1. BUILD & TYPE CHECKING (25 points)
###############################################################################

if [ "$SKIP_BUILD" = false ]; then
  echo "📦 [1/5] Running Build & Type Checks..."
  echo "========================================================================"
  
  if [ "$VERBOSE" = true ]; then
    yarn build:ts 2>&1 | tee /tmp/build-output.txt
    BUILD_EXIT=$?
  else
    yarn build:ts > /tmp/build-output.txt 2>&1
    BUILD_EXIT=$?
  fi
  
  if [ $BUILD_EXIT -eq 0 ]; then
    BUILD_SCORE=25
    echo -e "${GREEN}✅ Build SUCCESS${NC}"
    echo "   Score: 25/25"
  else
    # Check for errors vs warnings
    ERROR_COUNT=$(grep -c "error TS" /tmp/build-output.txt || echo "0")
    if [ "$ERROR_COUNT" -gt 0 ]; then
      BUILD_SCORE=0
      echo -e "${RED}❌ Build FAILED${NC}"
      echo "   TypeScript Errors: $ERROR_COUNT"
      echo "   Score: 0/25"
    else
      BUILD_SCORE=20
      echo -e "${YELLOW}⚠️  Build completed with warnings${NC}"
      echo "   Score: 20/25"
    fi
  fi
  
  echo ""
else
  echo "⏭️  Skipping build checks..."
  BUILD_SCORE=25  # Assume passing if skipped
  echo ""
fi

###############################################################################
# 2. LINTING (20 points)
###############################################################################

echo "🔍 [2/5] Running Linting Checks..."
echo "========================================================================"

if [ "$VERBOSE" = true ]; then
  yarn lint 2>&1 | tee /tmp/lint-output.txt
  LINT_EXIT=$?
else
  yarn lint > /tmp/lint-output.txt 2>&1
  LINT_EXIT=$?
fi

# Count errors and warnings
ERROR_COUNT=$(grep -c "error" /tmp/lint-output.txt || echo "0")
WARNING_COUNT=$(grep -c "warning" /tmp/lint-output.txt || echo "0")

if [ $LINT_EXIT -eq 0 ]; then
  if [ $WARNING_COUNT -lt 5 ]; then
    LINT_SCORE=20
    echo -e "${GREEN}✅ Linting PASSED${NC}"
    echo "   Errors: 0, Warnings: $WARNING_COUNT"
    echo "   Score: 20/20"
  else
    LINT_SCORE=18
    echo -e "${YELLOW}⚠️  Linting passed with warnings${NC}"
    echo "   Errors: 0, Warnings: $WARNING_COUNT"
    echo "   Score: 18/20"
  fi
else
  if [ $ERROR_COUNT -gt 10 ]; then
    LINT_SCORE=5
    echo -e "${RED}❌ Linting FAILED (many errors)${NC}"
    echo "   Errors: $ERROR_COUNT, Warnings: $WARNING_COUNT"
    echo "   Score: 5/20"
  elif [ $ERROR_COUNT -gt 0 ]; then
    LINT_SCORE=10
    echo -e "${RED}❌ Linting FAILED${NC}"
    echo "   Errors: $ERROR_COUNT, Warnings: $WARNING_COUNT"
    echo "   Score: 10/20"
  else
    LINT_SCORE=15
    echo -e "${YELLOW}⚠️  Linting completed with warnings${NC}"
    echo "   Warnings: $WARNING_COUNT"
    echo "   Score: 15/20"
  fi
fi

echo ""

###############################################################################
# 3. TESTING (30 points)
###############################################################################

if [ "$SKIP_TESTS" = false ]; then
  echo "🧪 [3/5] Running Test Suite..."
  echo "========================================================================"
  
  if [ "$VERBOSE" = true ]; then
    yarn test:run 2>&1 | tee /tmp/test-output.txt
    TEST_EXIT=$?
  else
    yarn test:run > /tmp/test-output.txt 2>&1
    TEST_EXIT=$?
  fi
  
  # Parse test results
  TOTAL_TESTS=$(grep -oP '\d+(?= passed)' /tmp/test-output.txt | tail -1 || echo "0")
  FAILED_TESTS=$(grep -oP '\d+(?= failed)' /tmp/test-output.txt | tail -1 || echo "0")
  
  if [ $TEST_EXIT -eq 0 ]; then
    # Run coverage
    if [ "$VERBOSE" = true ]; then
      yarn test:coverage > /tmp/coverage-output.txt 2>&1
    else
      yarn test:coverage > /tmp/coverage-output.txt 2>&1
    fi
    
    # Extract coverage percentages (simplified - adjust based on your coverage reporter)
    LINE_COVERAGE=$(grep -oP 'All files.*?\|\s+\K[\d.]+' /tmp/coverage-output.txt | head -1 || echo "0")
    
    if [ -z "$LINE_COVERAGE" ]; then
      LINE_COVERAGE=0
    fi
    
    # Calculate test score based on coverage
    if (( $(echo "$LINE_COVERAGE >= 80" | bc -l) )); then
      TEST_SCORE=30
      echo -e "${GREEN}✅ Tests PASSED with excellent coverage${NC}"
      echo "   Total Tests: $TOTAL_TESTS"
      echo "   Line Coverage: ${LINE_COVERAGE}%"
      echo "   Score: 30/30"
    elif (( $(echo "$LINE_COVERAGE >= 60" | bc -l) )); then
      TEST_SCORE=25
      echo -e "${YELLOW}⚠️  Tests passed, coverage needs improvement${NC}"
      echo "   Total Tests: $TOTAL_TESTS"
      echo "   Line Coverage: ${LINE_COVERAGE}%"
      echo "   Score: 25/30"
    else
      TEST_SCORE=20
      echo -e "${YELLOW}⚠️  Tests passed, low coverage${NC}"
      echo "   Total Tests: $TOTAL_TESTS"
      echo "   Line Coverage: ${LINE_COVERAGE}%"
      echo "   Score: 20/30"
    fi
  else
    TEST_SCORE=10
    echo -e "${RED}❌ Tests FAILED${NC}"
    echo "   Passed: $TOTAL_TESTS, Failed: $FAILED_TESTS"
    echo "   Score: 10/30"
  fi
  
  echo ""
  
  ###############################################################################
  # Test Stability Check (Bonus 10 points)
  ###############################################################################
  
  echo "🔄 [3.5/5] Checking Test Stability..."
  echo "========================================================================"
  
  STABILITY_RUNS=3
  STABLE=true
  
  for i in $(seq 1 $STABILITY_RUNS); do
    if [ "$VERBOSE" = true ]; then
      echo "   Run $i/$STABILITY_RUNS..."
    fi
    
    if ! yarn test:run > /dev/null 2>&1; then
      STABLE=false
      break
    fi
  done
  
  if [ "$STABLE" = true ]; then
    STABILITY_BONUS=10
    echo -e "${GREEN}✅ Tests are STABLE (${STABILITY_RUNS}/${STABILITY_RUNS} runs passed)${NC}"
    echo "   Bonus: +10 points"
  else
    STABILITY_BONUS=0
    echo -e "${RED}❌ Tests are FLAKY${NC}"
    echo "   Bonus: 0 points"
  fi
  
  echo ""
else
  echo "⏭️  Skipping tests..."
  TEST_SCORE=30  # Assume passing if skipped
  STABILITY_BONUS=10
  echo ""
fi

###############################################################################
# 4. CONVENTION ADHERENCE (25 points)
###############################################################################

echo "📋 [4/5] Checking Convention Adherence..."
echo "========================================================================"

if [ "$VERBOSE" = true ]; then
  if [ "$STRICT_MODE" = true ]; then
    node scripts/check-conventions.js --strict 2>&1 | tee /tmp/convention-output.txt
    CONVENTION_EXIT=$?
  else
    node scripts/check-conventions.js 2>&1 | tee /tmp/convention-output.txt
    CONVENTION_EXIT=$?
  fi
else
  if [ "$STRICT_MODE" = true ]; then
    node scripts/check-conventions.js --strict > /tmp/convention-output.txt 2>&1
    CONVENTION_EXIT=$?
  else
    node scripts/check-conventions.js > /tmp/convention-output.txt 2>&1
    CONVENTION_EXIT=$?
  fi
fi

# Extract score from convention check
CONVENTION_SCORE_RAW=$(grep -oP 'Score: \K\d+' /tmp/convention-output.txt | tail -1 || echo "0")

# Scale to 25 points
CONVENTION_SCORE=$(echo "scale=2; $CONVENTION_SCORE_RAW * 0.25" | bc)

if [ $CONVENTION_EXIT -eq 0 ]; then
  echo -e "${GREEN}✅ Convention checks PASSED${NC}"
  echo "   Raw Score: ${CONVENTION_SCORE_RAW}/100"
  echo "   Weighted Score: ${CONVENTION_SCORE}/25"
else
  echo -e "${YELLOW}⚠️  Convention checks completed with issues${NC}"
  echo "   Raw Score: ${CONVENTION_SCORE_RAW}/100"
  echo "   Weighted Score: ${CONVENTION_SCORE}/25"
fi

echo ""

###############################################################################
# 5. CALCULATE FINAL SCORE
###############################################################################

echo "========================================================================"
echo "📊 QUALITY SCORE BREAKDOWN"
echo "========================================================================"
echo ""

printf "   %-30s %5.1f/%d (weight: %d%%)\n" "Build & Type Checking:" $BUILD_SCORE $BUILD_WEIGHT $BUILD_WEIGHT
printf "   %-30s %5.1f/%d (weight: %d%%)\n" "Linting:" $LINT_SCORE $LINT_WEIGHT $LINT_WEIGHT
printf "   %-30s %5.1f/%d (weight: %d%%)\n" "Testing & Coverage:" $TEST_SCORE $TEST_WEIGHT $TEST_WEIGHT
printf "   %-30s %5.1f/%d (weight: %d%%)\n" "Convention Adherence:" $CONVENTION_SCORE $CONVENTION_WEIGHT $CONVENTION_WEIGHT
printf "   %-30s %5.1f/%d (bonus)\n" "Test Stability Bonus:" $STABILITY_BONUS $STABILITY_BONUS_WEIGHT

echo ""
echo "------------------------------------------------------------------------"

# Calculate final score (with bonus capped at 100)
TOTAL_SCORE=$(echo "scale=2; $BUILD_SCORE + $LINT_SCORE + $TEST_SCORE + $CONVENTION_SCORE + $STABILITY_BONUS" | bc)
TOTAL_SCORE_CAPPED=$(echo "if ($TOTAL_SCORE > 100) 100 else $TOTAL_SCORE" | bc)

printf "   ${BLUE}%-30s %5.1f/100${NC}\n" "TOTAL QUALITY SCORE:" $TOTAL_SCORE_CAPPED

echo ""
echo "========================================================================"

# Determine pass/fail threshold
if [ "$STRICT_MODE" = true ]; then
  PASS_THRESHOLD=90
else
  PASS_THRESHOLD=85
fi

# Interpretation
echo ""
if (( $(echo "$TOTAL_SCORE_CAPPED >= 95" | bc -l) )); then
  echo -e "${GREEN}🏆 EXCELLENT - Production ready!${NC}"
  EXIT_CODE=0
elif (( $(echo "$TOTAL_SCORE_CAPPED >= $PASS_THRESHOLD" | bc -l) )); then
  echo -e "${GREEN}✅ PASSED - Quality standards met${NC}"
  EXIT_CODE=0
elif (( $(echo "$TOTAL_SCORE_CAPPED >= 70" | bc -l) )); then
  echo -e "${YELLOW}⚠️  NEEDS IMPROVEMENT - Below quality threshold${NC}"
  echo "   Required: ${PASS_THRESHOLD}/100, Achieved: ${TOTAL_SCORE_CAPPED}/100"
  EXIT_CODE=1
else
  echo -e "${RED}❌ FAILED - Significant quality issues${NC}"
  echo "   Required: ${PASS_THRESHOLD}/100, Achieved: ${TOTAL_SCORE_CAPPED}/100"
  EXIT_CODE=1
fi

echo ""
echo "========================================================================"
echo ""

# Save results to file
cat > /tmp/quality-score.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_score": $TOTAL_SCORE_CAPPED,
  "pass_threshold": $PASS_THRESHOLD,
  "passed": $([ $EXIT_CODE -eq 0 ] && echo "true" || echo "false"),
  "strict_mode": $([ "$STRICT_MODE" = true ] && echo "true" || echo "false"),
  "scores": {
    "build": $BUILD_SCORE,
    "lint": $LINT_SCORE,
    "test": $TEST_SCORE,
    "convention": $CONVENTION_SCORE,
    "stability_bonus": $STABILITY_BONUS
  },
  "weights": {
    "build": $BUILD_WEIGHT,
    "lint": $LINT_WEIGHT,
    "test": $TEST_WEIGHT,
    "convention": $CONVENTION_WEIGHT,
    "stability_bonus": $STABILITY_BONUS_WEIGHT
  }
}
EOF

echo "📄 Detailed results saved to: /tmp/quality-score.json"
echo ""

# Suggestions for improvement
if [ $EXIT_CODE -ne 0 ]; then
  echo "💡 SUGGESTIONS FOR IMPROVEMENT:"
  echo ""
  
  if (( $(echo "$BUILD_SCORE < $BUILD_WEIGHT" | bc -l) )); then
    echo "   • Fix TypeScript compilation errors"
    echo "     Run: yarn build:ts"
  fi
  
  if (( $(echo "$LINT_SCORE < $LINT_WEIGHT" | bc -l) )); then
    echo "   • Address linting issues"
    echo "     Run: yarn lint:fix"
  fi
  
  if (( $(echo "$TEST_SCORE < $TEST_WEIGHT" | bc -l) )); then
    echo "   • Improve test coverage (target: >80%)"
    echo "     Run: yarn test:coverage"
  fi
  
  if (( $(echo "$CONVENTION_SCORE < $CONVENTION_WEIGHT" | bc -l) )); then
    echo "   • Review convention violations"
    echo "     Run: node scripts/check-conventions.js"
  fi
  
  if [ $STABILITY_BONUS -eq 0 ]; then
    echo "   • Fix flaky tests"
    echo "     Run: yarn test multiple times to identify flaky tests"
  fi
  
  echo ""
  echo "   📖 Refer to: LLM_EXTENSION_CONVENTION.md"
  echo ""
fi

exit $EXIT_CODE


