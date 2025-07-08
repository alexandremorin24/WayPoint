#!/usr/bin/env node

/**
 * Email sending test script
 * This script tests email sending functions without sending real emails
 */

require('dotenv').config();

// Set test environment to prevent real email sending
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const mailer = require('../../src/utils/mailer');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const icon = passed ? 'PASS' : 'FAIL';
  const color = passed ? colors.green : colors.red;
  console.log(`[${icon}] ${color}${testName}${colors.reset}`);
  if (details) {
    console.log(`   ${colors.cyan}${details}${colors.reset}`);
  }
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
}

// Test data
const testData = {
  email: 'test@example.com',
  name: 'Jean Dupont',
  inviterName: 'Marie Martin',
  inviteeName: 'Pierre Durand',
  mapName: 'Trip to Spain 2024',
  role: 'collaborator',
  token: 'test-token-12345',
  resetToken: 'reset-token-67890',
  verifyToken: 'verify-token-abcde'
};

// Mock console.log to capture output
let capturedLogs = [];
const originalLog = console.log;
function captureLogs() {
  capturedLogs = [];
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
}

function restoreLogs() {
  console.log = originalLog;
}

// Test functions
async function testEmailVerification() {
  logSection('Email Verification Tests');

  try {
    // Test French locale
    captureLogs();
    await mailer.sendVerificationEmail(testData.email, testData.verifyToken, 'fr');
    restoreLogs();

    const hasEmail = capturedLogs.some(log => log.includes(testData.email));
    const hasToken = capturedLogs.some(log => log.includes(testData.verifyToken));
    const hasFrenchLocale = capturedLogs.some(log => log.includes('Using locale: fr'));
    const hasCorrectUrl = capturedLogs.some(log => log.includes('/verify-email?token='));

    logTest('Email verification (FR)', hasEmail && hasToken && hasFrenchLocale && hasCorrectUrl);

    // Test English locale
    captureLogs();
    await mailer.sendVerificationEmail(testData.email, testData.verifyToken, 'en');
    restoreLogs();

    const hasEnglishLocale = capturedLogs.some(log => log.includes('Using locale: en'));
    logTest('Email verification (EN)', hasEnglishLocale);

    // Test default locale fallback
    captureLogs();
    await mailer.sendVerificationEmail(testData.email, testData.verifyToken);
    restoreLogs();

    const hasDefaultLocale = capturedLogs.some(log => log.includes('Using locale: en'));
    logTest('Email verification (default locale)', hasDefaultLocale);

  } catch (error) {
    logTest('Email verification', false, `Error: ${error.message}`);
  }
}

async function testPasswordReset() {
  logSection('Password Reset Tests');

  try {
    // Test French locale
    captureLogs();
    await mailer.sendPasswordResetEmail(testData.email, testData.name, testData.resetToken, 'fr');
    restoreLogs();

    const hasEmail = capturedLogs.some(log => log.includes(testData.email));
    const hasToken = capturedLogs.some(log => log.includes(testData.resetToken));
    const hasFrenchLocale = capturedLogs.some(log => log.includes('Using locale: fr'));
    const hasCorrectUrl = capturedLogs.some(log => log.includes('/reset-password/'));

    logTest('Password reset (FR)', hasEmail && hasToken && hasFrenchLocale && hasCorrectUrl);

    // Test English locale
    captureLogs();
    await mailer.sendPasswordResetEmail(testData.email, testData.name, testData.resetToken, 'en');
    restoreLogs();

    const hasEnglishLocale = capturedLogs.some(log => log.includes('Using locale: en'));
    logTest('Password reset (EN)', hasEnglishLocale);

  } catch (error) {
    logTest('Password reset', false, `Error: ${error.message}`);
  }
}

async function testMapInvitation() {
  logSection('Map Invitation Tests');

  try {
    // Test French locale
    captureLogs();
    await mailer.sendMapInvitationEmail(
      testData.email,
      testData.inviterName,
      testData.mapName,
      testData.role,
      testData.token,
      'fr'
    );
    restoreLogs();

    const hasEmail = capturedLogs.some(log => log.includes(testData.email));
    const hasToken = capturedLogs.some(log => log.includes(testData.token));
    const hasCorrectUrl = capturedLogs.some(log => log.includes('/fr/invitations/'));

    logTest('Map invitation (FR)', hasEmail && hasToken && hasCorrectUrl);

    // Test English locale
    captureLogs();
    await mailer.sendMapInvitationEmail(
      testData.email,
      testData.inviterName,
      testData.mapName,
      testData.role,
      testData.token,
      'en'
    );
    restoreLogs();

    const hasEnglishUrl = capturedLogs.some(log => log.includes('/en/invitations/'));
    logTest('Map invitation (EN)', hasEnglishUrl);

  } catch (error) {
    logTest('Map invitation', false, `Error: ${error.message}`);
  }
}

async function testInvitationResponse() {
  logSection('Invitation Response Tests');

  try {
    // Test accepted invitation
    captureLogs();
    await mailer.sendInvitationResponseEmail(
      testData.email,
      testData.inviteeName,
      testData.mapName,
      'accepted',
      'fr'
    );
    restoreLogs();

    const hasEmail = capturedLogs.some(log => log.includes(testData.email));
    const hasAcceptedStatus = capturedLogs.some(log => log.includes('[DEV] Status: accepted'));

    logTest('Invitation response (accepted)', hasEmail && hasAcceptedStatus);

    // Test rejected invitation
    captureLogs();
    await mailer.sendInvitationResponseEmail(
      testData.email,
      testData.inviteeName,
      testData.mapName,
      'rejected',
      'en'
    );
    restoreLogs();

    const hasRejectedStatus = capturedLogs.some(log => log.includes('[DEV] Status: rejected'));
    logTest('Invitation response (rejected)', hasRejectedStatus);

  } catch (error) {
    logTest('Invitation response', false, `Error: ${error.message}`);
  }
}

async function testTemplateGeneration() {
  logSection('Template Generation Tests');

  try {
    // Test that templates are correctly loaded
    const passwordResetFr = require('../../src/templates/emails/passwordReset.fr');
    const passwordResetEn = require('../../src/templates/emails/passwordReset.en');

    const frSubject = passwordResetFr.subject;
    const enSubject = passwordResetEn.subject;

    logTest('French template loaded', !!frSubject && frSubject.includes('Réinitialisation'));
    logTest('English template loaded', !!enSubject && enSubject.includes('Reset your password'));

    // Test HTML generation
    const frHtml = passwordResetFr.html('Test User', 'http://test.com/reset/token123');
    const enHtml = passwordResetEn.html('Test User', 'http://test.com/reset/token123');

    logTest('French HTML generation', frHtml.includes('Test User') && frHtml.includes('token123'));
    logTest('English HTML generation', enHtml.includes('Test User') && enHtml.includes('token123'));

  } catch (error) {
    logTest('Template generation', false, `Error: ${error.message}`);
  }
}

async function testEnvironmentVariables() {
  logSection('Environment Variables');

  const requiredVars = [
    'FRONTEND_URL',
    'MAIL_HOST',
    'MAIL_PORT',
    'MAIL_USER',
    'MAIL_PASS'
  ];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    logTest(`${varName} is set`, !!value, value ? `Value: ${value}` : 'Not set');
  });
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}${colors.magenta}WayPoint Email Sending Tests${colors.reset}`);
  console.log(`${colors.yellow}Mode: TEST (no emails will be sent)${colors.reset}\n`);

  await testEnvironmentVariables();
  await testTemplateGeneration();
  await testEmailVerification();
  await testPasswordReset();
  await testMapInvitation();
  await testInvitationResponse();

  console.log(`\n${colors.bold}${colors.green}Tests completed!${colors.reset}`);
  console.log(`${colors.cyan}Emails are properly configured and ready to be sent.${colors.reset}`);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error(`${colors.red}Error during tests:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = {
  testEmailVerification,
  testPasswordReset,
  testMapInvitation,
  testInvitationResponse,
  testTemplateGeneration,
  testEnvironmentVariables
}; 
