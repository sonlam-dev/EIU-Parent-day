import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission } from '../api/_lib/validation.ts';
const valid = { name: ' Minh Anh ', recipient: 'Ba mẹ', message: 'Con yêu ba mẹ rất nhiều!', color: 'green', requestId: '993a8df8-8aa0-4bed-945f-bb1ab9d017c1', deviceId: '7b9f12ac-8934-4515-a302-c4c8469749dc' };
test('Accepts Vietnamese content and trims names', () => { assert.equal(validateSubmission(valid).name, 'Minh Anh'); });
test('Rejects malformed bodies, missing fields and honeypot', () => { for (const body of [null, [], {}, { ...valid, website: 'spam' }, { ...valid, name: 1 }]) assert.throws(() => validateSubmission(body)); });
test('Enforces limits on server including whitespace and control characters', () => { for (const patch of [{ name: ' ' }, { name: 'a'.repeat(61) }, { message: 'ngắn' }, { message: 'a'.repeat(501) }, { recipient: 'x\u0000y' }]) assert.throws(() => validateSubmission({ ...valid, ...patch })); });
test('Rejects forged status-independent color and invalid retry identifiers', () => { for (const patch of [{ color: 'script' }, { requestId: 'not-a-uuid' }, { deviceId: null }]) assert.throws(() => validateSubmission({ ...valid, ...patch })); assert.equal(validateSubmission({ ...valid, status: 'approved' }).status, undefined); });
