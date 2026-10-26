import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adminOperationError} from '../src/AdminOperationError.ts';
test('Admin errors identify safeupdate, permissions, missing functions, and expired sessions',()=>{
  assert.match(adminOperationError({code:'21000',message:'DELETE requires a WHERE clause'}),/004_fix_admin_delete.sql/);
  assert.match(adminOperationError({code:'42501'}),/42501/);
  assert.match(adminOperationError({code:'PGRST202'}),/003_admin_operations.sql/);
  assert.match(adminOperationError({code:'PGRST301'}),/Đăng xuất/);
});
test('Unexpected database errors retain the real code and message',()=>{
  const message=adminOperationError({code:'23503',message:'foreign key constraint violation'});
  assert.match(message,/23503/);assert.match(message,/foreign key constraint/);
  assert.match(adminOperationError({message:'Failed to fetch'}),/NETWORK.*Failed to fetch/);
});
