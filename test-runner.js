#!/usr/bin/env node

// Cross-platform test runner for Windows/Unix
// This replaces the shell script for Windows compatibility

import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const print = {
  status: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// Utility functions
const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    process.on('error', reject);
  });
};

const checkCommand = async (command) => {
  try {
    await runCommand(command, ['--version']);
    return true;
  } catch {
    return false;
  }
};

const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Main setup function
async function setupTestEnvironment() {
  print.status('🧪 Setting up test environment for DeepWebAI...');
  
  try {
    // Check Node.js
    print.status('Checking Node.js version...');
    const hasNode = await checkCommand('node');
    if (!hasNode) {
      print.error('Node.js is not installed. Please install Node.js 18+ and try again.');
      process.exit(1);
    }
    
    const { stdout: nodeVersion } = await runCommand('node', ['--version']);
    print.success(`Node.js version: ${nodeVersion.trim()}`);
    
    // Check pnpm
    print.status('Checking pnpm...');
    const hasPnpm = await checkCommand('pnpm');
    if (!hasPnpm) {
      print.warning('pnpm not found. Installing pnpm...');
      await runCommand('npm', ['install', '-g', 'pnpm']);
    }
    
    const { stdout: pnpmVersion } = await runCommand('pnpm', ['--version']);
    print.success(`pnpm version: ${pnpmVersion.trim()}`);
    
    // Install dependencies
    print.status('Installing dependencies...');
    await runCommand('pnpm', ['install']);
    print.success('Dependencies installed');
    
    // Check test environment file
    if (!fileExists('.env.test')) {
      print.warning('.env.test not found. Creating from template...');
      if (fileExists('.env.example')) {
        fs.copyFileSync('.env.example', '.env.test');
        print.success('.env.test created');
      } else {
        print.warning('No .env.example found');
      }
    }
    
    // Validate test configuration
    print.status('Validating test configuration...');
    
    // Check TypeScript
    try {
      await runCommand('pnpm', ['run', 'typecheck']);
      print.success('TypeScript type checking passed');
    } catch {
      print.warning('TypeScript type checking failed. Continuing with tests...');
    }
    
    print.success('Test environment setup completed!');
    
    return true;
  } catch (error) {
    print.error(`Setup failed: ${error.message}`);
    return false;
  }
}

// Test execution functions
async function runTests(type = 'all') {
  const testCommands = {
    unit: ['run', 'test:unit'],
    integration: ['run', 'test:integration'],
    all: ['test'],
    coverage: ['run', 'test:coverage'],
    watch: ['run', 'test:watch']
  };
  
  const command = testCommands[type] || testCommands.all;
  
  print.status(`Running ${type} tests...`);
  
  try {
    const process = spawn('pnpm', command, {
      stdio: 'inherit',
      shell: true
    });
    
    return new Promise((resolve, reject) => {
      process.on('close', (code) => {
        if (code === 0) {
          print.success('Tests completed successfully!');
          resolve(true);
        } else {
          print.error(`Tests failed with code ${code}`);
          reject(new Error(`Tests failed with code ${code}`));
        }
      });
      
      process.on('error', reject);
    });
  } catch (error) {
    print.error(`Failed to run tests: ${error.message}`);
    return false;
  }
}

// Health check function
async function healthCheck() {
  print.status('Checking services health...');
  
  const checks = [
    {
      name: 'Environment',
      check: () => fileExists('.env.test'),
      status: null
    },
    {
      name: 'Dependencies',
      check: () => fileExists('node_modules'),
      status: null
    },
    {
      name: 'TypeScript',
      check: async () => {
        try {
          await runCommand('pnpm', ['run', 'typecheck']);
          return true;
        } catch {
          return false;
        }
      },
      status: null
    }
  ];
  
  for (const check of checks) {
    try {
      const result = typeof check.check === 'function' ? 
        await check.check() : check.check;
      check.status = result ? '✅' : '❌';
    } catch {
      check.status = '⚠️';
    }
  }
  
  console.log('\n📊 Health Check Summary:');
  checks.forEach(check => {
    console.log(`- ${check.name}: ${check.status}`);
  });
  
  return checks.every(check => check.status === '✅');
}

// Interactive menu
function showMenu() {
  console.log('\nSelect test type to run:');
  console.log('1) Unit tests only');
  console.log('2) Integration tests only');
  console.log('3) All tests');
  console.log('4) Tests with coverage');
  console.log('5) Watch mode');
  console.log('6) Health check');
  console.log('7) Setup only');
  console.log('8) Exit');
  
  process.stdout.write('\nEnter your choice (1-8): ');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.length > 0) {
    const command = args[0];
    
    switch (command) {
      case 'setup':
        await setupTestEnvironment();
        break;
      case 'unit':
        await setupTestEnvironment();
        await runTests('unit');
        break;
      case 'integration':
        await setupTestEnvironment();
        await runTests('integration');
        break;
      case 'coverage':
        await setupTestEnvironment();
        await runTests('coverage');
        break;
      case 'watch':
        await setupTestEnvironment();
        await runTests('watch');
        break;
      case 'health':
        await healthCheck();
        break;
      case 'all':
      default:
        await setupTestEnvironment();
        await runTests('all');
        break;
    }
    return;
  }
  
  // Interactive mode
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Setup first
  const setupSuccess = await setupTestEnvironment();
  if (!setupSuccess) {
    print.error('Setup failed. Exiting...');
    process.exit(1);
  }
  
  const handleChoice = async (choice) => {
    switch (choice) {
      case '1':
        await runTests('unit');
        break;
      case '2':
        await runTests('integration');
        break;
      case '3':
        await runTests('all');
        break;
      case '4':
        await runTests('coverage');
        break;
      case '5':
        await runTests('watch');
        return; // Don't show menu again for watch mode
      case '6':
        await healthCheck();
        break;
      case '7':
        print.success('Setup already completed!');
        break;
      case '8':
        print.status('Exiting...');
        rl.close();
        return;
      default:
        print.error('Invalid choice. Please try again.');
        break;
    }
    
    // Show menu again
    setTimeout(() => {
      showMenu();
      rl.once('line', handleChoice);
    }, 1000);
  };
  
  showMenu();
  rl.once('line', handleChoice);
}

// Handle process termination
process.on('SIGINT', () => {
  print.status('\nExiting test runner...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  print.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    print.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  setupTestEnvironment,
  runTests,
  healthCheck
};
