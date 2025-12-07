#!/usr/bin/env node

/**
 * Convention Adherence Checker
 * 
 * This script validates that the codebase follows the conventions
 * defined in LLM_EXTENSION_CONVENTION.md
 * 
 * Usage: node scripts/check-conventions.js [--strict]
 */

const fs = require('fs');
const path = require('path');

let score = 100;
const results = [];
const errors = [];
const warnings = [];

const STRICT_MODE = process.argv.includes('--strict');
const SCORE_THRESHOLD = STRICT_MODE ? 90 : 80;

console.log('\n' + '='.repeat(70));
console.log('🔍 BERRY DASHBOARD - CONVENTION ADHERENCE CHECKER');
console.log('='.repeat(70) + '\n');

/**
 * Check 1: API File Naming Conventions
 */
function checkApiFileNaming() {
  console.log('📁 Checking API file naming conventions...');
  
  if (!fs.existsSync('src/api')) {
    errors.push('❌ src/api directory not found');
    score -= 10;
    return;
  }

  const apiFiles = fs.readdirSync('src/api').filter(f => 
    (f.endsWith('API.js') || f.endsWith('API.ts')) && f !== 'index.js' && f !== 'index.ts'
  );
  
  const validApiPattern = /^[a-z]+API\.(js|ts)$/;
  let violations = 0;

  apiFiles.forEach(file => {
    if (!validApiPattern.test(file)) {
      score -= 5;
      violations++;
      errors.push(`❌ API file naming violation: ${file} (should be: [resource]API.{js|ts})`);
    } else {
      results.push(`✓ API file naming correct: ${file}`);
    }
  });

  if (violations === 0) {
    console.log(`   ✅ All ${apiFiles.length} API files follow naming convention\n`);
  } else {
    console.log(`   ⚠️  ${violations} API file(s) violate naming convention\n`);
  }
}

/**
 * Check 2: Test File Coverage
 */
function checkTestCoverage() {
  console.log('🧪 Checking test file coverage...');
  
  if (!fs.existsSync('src/api')) {
    return;
  }

  const apiFiles = fs.readdirSync('src/api').filter(f => 
    (f.endsWith('API.js') || f.endsWith('API.ts')) && f !== 'index.js' && f !== 'index.ts'
  );
  
  let missingTests = 0;

  apiFiles.forEach(file => {
    const baseName = file.replace(/API\.(js|ts)$/, '');
    const resourceName = file.replace(/\.(js|ts)$/, '');
    
    // Check multiple possible test file patterns
    const possibleTestFiles = [
      `src/tests/api/${baseName}.integration.test.ts`,
      `src/tests/api/${baseName}.integration.test.js`,
      `src/tests/api/${baseName}.test.ts`,
      `src/tests/api/${baseName}.test.js`,
      `src/tests/api/${resourceName}.integration.test.ts`,
      `src/tests/api/${resourceName}.test.ts`,
      `src/tests/api/${file.replace(/\.(js|ts)$/, '.test.ts')}`
    ];
    
    const testExists = possibleTestFiles.some(testFile => fs.existsSync(testFile));
    
    if (!testExists) {
      score -= 8;
      missingTests++;
      errors.push(`❌ Missing test file for: ${file}`);
      errors.push(`   Expected one of: ${possibleTestFiles.slice(0, 2).join(' or ')}`);
    } else {
      const foundTest = possibleTestFiles.find(f => fs.existsSync(f));
      results.push(`✓ Test exists for: ${file} (${path.basename(foundTest)})`);
    }
  });

  if (missingTests === 0) {
    console.log(`   ✅ All ${apiFiles.length} API files have tests\n`);
  } else {
    console.log(`   ⚠️  ${missingTests} API file(s) missing tests\n`);
  }
}

/**
 * Check 3: Type Definitions for TypeScript API Files
 */
function checkTypeDefinitions() {
  console.log('📝 Checking type definitions...');
  
  if (!fs.existsSync('src/api')) {
    return;
  }

  const tsApiFiles = fs.readdirSync('src/api')
    .filter(f => f.endsWith('API.ts') && f !== 'index.ts');
  
  if (tsApiFiles.length === 0) {
    console.log('   ℹ️  No TypeScript API files found\n');
    return;
  }

  let missingTypes = 0;

  tsApiFiles.forEach(file => {
    const resourceName = file.replace('API.ts', '');
    
    // Check multiple possible type file patterns
    const possibleTypeFiles = [
      `src/types/${resourceName}.ts`,
      `src/types/${resourceName}.d.ts`,
      `src/types/api.ts` // Generic API types
    ];
    
    const typeExists = possibleTypeFiles.some(typeFile => {
      if (!fs.existsSync(typeFile)) return false;
      
      // Check if the type file contains relevant types
      const content = fs.readFileSync(typeFile, 'utf8');
      const capitalizedResource = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
      return content.includes(capitalizedResource) || typeFile.includes('api.ts');
    });
    
    if (!typeExists) {
      score -= 6;
      missingTypes++;
      warnings.push(`⚠️  No specific type definition found for: ${file}`);
      warnings.push(`   Consider creating: src/types/${resourceName}.ts`);
    } else {
      const foundType = possibleTypeFiles.find(f => {
        if (!fs.existsSync(f)) return false;
        const content = fs.readFileSync(f, 'utf8');
        const capitalizedResource = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
        return content.includes(capitalizedResource) || f.includes('api.ts');
      });
      results.push(`✓ Type definition found for: ${file} (${path.basename(foundType)})`);
    }
  });

  if (missingTypes === 0) {
    console.log(`   ✅ All ${tsApiFiles.length} TypeScript API files have types\n`);
  } else {
    console.log(`   ⚠️  ${missingTypes} API file(s) may be missing specific types\n`);
  }
}

/**
 * Check 4: API Export Patterns
 */
function checkApiExportPatterns() {
  console.log('📤 Checking API export patterns...');
  
  if (!fs.existsSync('src/api')) {
    return;
  }

  const apiFiles = fs.readdirSync('src/api').filter(f => 
    (f.endsWith('API.js') || f.endsWith('API.ts')) && f !== 'index.js' && f !== 'index.ts'
  );
  
  let exportViolations = 0;

  apiFiles.forEach(file => {
    const content = fs.readFileSync(`src/api/${file}`, 'utf8');
    const resourceName = file.replace(/API\.(js|ts)$/, '');
    
    // Check for named export
    const hasNamedExport = content.includes(`export const ${resourceName}API`) ||
                          content.match(new RegExp(`export\\s+{[^}]*${resourceName}API[^}]*}`));
    
    // Check for default export
    const hasDefaultExport = content.includes(`export default ${resourceName}API`) ||
                            content.includes('export default {');
    
    if (!hasNamedExport) {
      score -= 4;
      exportViolations++;
      errors.push(`❌ Missing named export in: ${file}`);
      errors.push(`   Expected: export const ${resourceName}API = { ... }`);
    } else if (!hasDefaultExport) {
      score -= 2;
      exportViolations++;
      warnings.push(`⚠️  Missing default export in: ${file}`);
      warnings.push(`   Consider adding: export default ${resourceName}API;`);
    } else {
      results.push(`✓ Export pattern correct: ${file}`);
    }
    
    // Check for WhyHowClient import
    const hasClientImport = content.includes("import { WhyHowClient } from './baseClient'") ||
                           content.includes('import { WhyHowClient } from "./baseClient"');
    
    if (!hasClientImport && content.includes('WhyHowClient')) {
      score -= 3;
      exportViolations++;
      errors.push(`❌ Incorrect WhyHowClient import in: ${file}`);
    }
  });

  if (exportViolations === 0) {
    console.log(`   ✅ All ${apiFiles.length} API files use correct export pattern\n`);
  } else {
    console.log(`   ⚠️  ${exportViolations} API file(s) have export issues\n`);
  }
}

/**
 * Check 5: View Component Patterns
 */
function checkViewComponentPatterns() {
  console.log('🎨 Checking view component patterns...');
  
  if (!fs.existsSync('src/views')) {
    warnings.push('⚠️  src/views directory not found');
    return;
  }

  const viewDirs = fs.readdirSync('src/views', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  let patternViolations = 0;
  let checkedFiles = 0;

  viewDirs.forEach(dir => {
    const viewPath = `src/views/${dir}`;
    if (!fs.existsSync(viewPath)) return;
    
    const viewFiles = fs.readdirSync(viewPath)
      .filter(f => (f.endsWith('.tsx') || f.endsWith('.jsx')) && !f.startsWith('.'));
    
    viewFiles.forEach(file => {
      checkedFiles++;
      const content = fs.readFileSync(`${viewPath}/${file}`, 'utf8');
      
      // Check for MainCard usage without import
      if (content.includes('<MainCard') && 
          !content.includes("import MainCard from") && 
          !content.includes("import { MainCard }")) {
        score -= 2;
        patternViolations++;
        warnings.push(`⚠️  MainCard used but not imported: ${dir}/${file}`);
      }
      
      // Check for proper useState/useEffect imports
      if ((content.includes('useState') || content.includes('useEffect')) && 
          !content.includes("from 'react'") && 
          !content.includes('from "react"')) {
        score -= 2;
        patternViolations++;
        warnings.push(`⚠️  React hooks used but not imported: ${dir}/${file}`);
      }
    });
  });

  if (checkedFiles === 0) {
    console.log('   ℹ️  No view component files found\n');
  } else if (patternViolations === 0) {
    console.log(`   ✅ All ${checkedFiles} view files follow patterns\n`);
  } else {
    console.log(`   ⚠️  ${patternViolations} pattern issue(s) found in ${checkedFiles} files\n`);
  }
}

/**
 * Check 6: File Structure Compliance
 */
function checkFileStructure() {
  console.log('🏗️  Checking project structure...');
  
  const requiredDirs = [
    'src/api',
    'src/views',
    'src/types',
    'src/tests',
    'src/hooks',
    'src/contexts',
    'src/ui-component'
  ];
  
  let structureIssues = 0;
  
  requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      score -= 5;
      structureIssues++;
      errors.push(`❌ Required directory missing: ${dir}`);
    } else {
      results.push(`✓ Directory exists: ${dir}`);
    }
  });

  if (structureIssues === 0) {
    console.log(`   ✅ All required directories present\n`);
  } else {
    console.log(`   ⚠️  ${structureIssues} structural issue(s) found\n`);
  }
}

/**
 * Check 7: Index Export Files
 */
function checkIndexExports() {
  console.log('📋 Checking index export files...');
  
  const indexFiles = [
    { path: 'src/api/index.js', required: true },
    { path: 'src/types/index.ts', required: false }
  ];
  
  let indexIssues = 0;
  
  indexFiles.forEach(({ path: indexPath, required }) => {
    if (!fs.existsSync(indexPath)) {
      if (required) {
        score -= 5;
        indexIssues++;
        errors.push(`❌ Required index file missing: ${indexPath}`);
      } else {
        warnings.push(`⚠️  Optional index file missing: ${indexPath}`);
      }
    } else {
      results.push(`✓ Index file exists: ${indexPath}`);
      
      // Check if API index exports all API modules
      if (indexPath === 'src/api/index.js' && fs.existsSync('src/api')) {
        const content = fs.readFileSync(indexPath, 'utf8');
        const apiFiles = fs.readdirSync('src/api')
          .filter(f => f.endsWith('API.js') || f.endsWith('API.ts'));
        
        apiFiles.forEach(apiFile => {
          const resourceName = apiFile.replace(/\.(js|ts)$/, '');
          if (!content.includes(resourceName)) {
            score -= 2;
            indexIssues++;
            warnings.push(`⚠️  ${resourceName} not exported from ${indexPath}`);
          }
        });
      }
    }
  });

  if (indexIssues === 0) {
    console.log(`   ✅ Index export files are correct\n`);
  } else {
    console.log(`   ⚠️  ${indexIssues} index export issue(s) found\n`);
  }
}

// Run all checks
checkFileStructure();
checkApiFileNaming();
checkTestCoverage();
checkTypeDefinitions();
checkApiExportPatterns();
checkViewComponentPatterns();
checkIndexExports();

// Generate Final Report
console.log('='.repeat(70));
console.log('📊 DETAILED RESULTS');
console.log('='.repeat(70) + '\n');

if (results.length > 0 && !STRICT_MODE) {
  console.log('✅ Passed Checks:');
  results.slice(0, 10).forEach(r => console.log('   ' + r));
  if (results.length > 10) {
    console.log(`   ... and ${results.length - 10} more\n`);
  } else {
    console.log('');
  }
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(w => console.log('   ' + w));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(e => console.log('   ' + e));
  console.log('');
}

// Calculate final score
const finalScore = Math.max(0, Math.min(100, score));

console.log('='.repeat(70));
console.log('🎯 FINAL SCORE');
console.log('='.repeat(70));
console.log(`\n   Score: ${finalScore}/100`);
console.log(`   Threshold: ${SCORE_THRESHOLD}/100`);
console.log(`   Mode: ${STRICT_MODE ? 'STRICT' : 'NORMAL'}`);
console.log('');

// Interpretation
if (finalScore >= 95) {
  console.log('   🏆 EXCELLENT - Production ready!');
} else if (finalScore >= 85) {
  console.log('   ✅ GOOD - Minor improvements suggested');
} else if (finalScore >= SCORE_THRESHOLD) {
  console.log('   ⚠️  PASS - Some improvements needed');
} else if (finalScore >= 70) {
  console.log('   ❌ FAIL - Significant issues require attention');
} else {
  console.log('   ❌ FAIL - Major convention violations');
}

console.log('\n' + '='.repeat(70));
console.log('📈 SCORING BREAKDOWN');
console.log('='.repeat(70));
console.log(`
   Points Deducted:
   • API Naming Issues: ${100 - score > 0 ? 'Yes' : 'None'}
   • Missing Tests: ${errors.filter(e => e.includes('Missing test')).length} files
   • Missing Types: ${warnings.filter(w => w.includes('type definition')).length} files
   • Export Pattern Issues: ${errors.filter(e => e.includes('export')).length} files
   • Structure Issues: ${errors.filter(e => e.includes('directory')).length} issues
   
   Errors: ${errors.length}
   Warnings: ${warnings.length}
   Passed Checks: ${results.length}
`);

console.log('='.repeat(70) + '\n');

// Exit with appropriate code
if (finalScore >= SCORE_THRESHOLD) {
  console.log('✅ CONVENTION CHECK PASSED\n');
  process.exit(0);
} else {
  console.log('❌ CONVENTION CHECK FAILED\n');
  console.log('Please address the issues above and run again.');
  console.log('Hint: Review LLM_EXTENSION_CONVENTION.md for guidelines\n');
  process.exit(1);
}


