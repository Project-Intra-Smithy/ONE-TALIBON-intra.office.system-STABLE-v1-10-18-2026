import fs from 'node:fs';
let browser=fs.readFileSync('tests/Browser/phase-a-qualification.mjs','utf8').replace("from './phase-a-manual-review.mjs'","from '../../../tests/Browser/phase-a-manual-review.mjs'");
browser=browser.replace("await enrollPage.waitForURL('**/security/mfa/enroll');for", "await enrollPage.waitForURL('**/security/mfa/enroll');await enrollPage.getByLabel('Six-digit verification code').fill('123');await enrollPage.getByRole('button',{name:'Confirm MFA enrollment',exact:true}).click();await enrollPage.getByText(/code.*6 digits/i).waitFor();for");
browser=browser.replace('overflow,capture:null,captureDisposition:',"overflow,interactionState:component==='Auth/MfaEnrollment'?'invalid-short-code':'baseline',capture:null,captureDisposition:");
fs.writeFileSync('storage/app/qa/auth-error-probe-browser.mjs',browser);
const driver=fs.readFileSync('storage/app/qa/hover-probe-runtime.mjs','utf8').replace('storage/app/qa/hover-probe-browser.mjs','storage/app/qa/auth-error-probe-browser.mjs');
fs.writeFileSync('storage/app/qa/auth-error-probe-runtime.mjs',driver);
