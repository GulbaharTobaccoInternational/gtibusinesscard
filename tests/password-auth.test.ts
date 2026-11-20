import { changePasswordSchema } from '../src/lib/password-auth';
import { issuePasswordLinkGrant, validPasswordLinkGrant } from '../src/server/password-link-grant';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {passwordDestination,passwordLoginSchema,passwordUpdateSchema,emailLinkSchema,passwordEmailSchema} from '../src/lib/password-auth';
const origin='https://www.mrghashi.com';
test('email/password login preserves password whitespace and rejects extra privilege fields',()=>{
 const parsed=passwordLoginSchema.parse({email:' Vinu@GulbaharTobacco.com ',password:'  secret  '});assert.equal(parsed.email,'vinu@gulbahartobacco.com');assert.equal(parsed.password,'  secret  ');
 assert.ok(!passwordLoginSchema.safeParse({email:'a@example.com',password:'valid',role:'admin'}).success);
});
test('password confirmation and configured minimum are enforced',()=>{
 assert.ok(passwordUpdateSchema.safeParse({password:'long enough',confirmPassword:'long enough'}).success);
 assert.ok(!passwordUpdateSchema.safeParse({password:'long enough',confirmPassword:'different'}).success);
 assert.ok(!passwordUpdateSchema.safeParse({password:'short',confirmPassword:'short'}).success);
 assert.ok(!passwordUpdateSchema.safeParse({password:'long enough',confirmPassword:'long enough',userId:'other'}).success);
});
test('password redirects are fixed local paths; external and protocol-relative targets are rejected',()=>{
 for(const path of ['/create-password','/reset-password']){assert.equal(passwordDestination(path,origin),path);assert.equal(passwordDestination(origin+path+'?flow_id=uuid',origin),path);}
 for(const value of ['https://evil.example/reset-password','//evil.example/create-password','javascript:alert(1)','/admin','https://www.mrghashi.com.evil.example/reset-password','https://evil@www.mrghashi.com/reset-password'])assert.equal(passwordDestination(value,origin),null,value);
 assert.equal(passwordDestination(null,origin),'/reset-password');
});
test('only invitation and recovery proofs are accepted; no custom login or arbitrary redirects',()=>{
 for(const type of ['invite','recovery'])assert.ok(emailLinkSchema.safeParse({type,token_hash:'a'.repeat(64),next:'/create-password'}).success);
 for(const value of [{type:'email',token_hash:'a'.repeat(64),next:'/create-password'},{type:'recovery',token_hash:'short',next:'/create-password'},{type:'recovery',token_hash:'a'.repeat(64),next:'https://evil.example'}])assert.ok(!emailLinkSchema.safeParse(value).success);
 assert.ok(passwordEmailSchema.safeParse({email:'a@example.com',intent:'setup'}).success);
 assert.ok(!passwordEmailSchema.safeParse({email:'a@example.com',intent:'invite',role:'admin'}).success);
});

test('retired OTP endpoints cannot create sessions and guide stale tabs to password login',async()=>{
 const endpoints=[await import('../src/app/api/auth/request/route'),await import('../src/app/api/auth/verify/route')];
 for(const endpoint of endpoints){const response=endpoint.POST();assert.equal(response.status,410);assert.equal(response.headers.get('set-cookie'),null);assert.match(response.headers.get('cache-control')??'',/no-store/);assert.match((await response.json()).error,/password/);}
});

test('in-app password changes require the current password, a distinct new password and matching confirmation', () => {
  const valid = { currentPassword: ' previous password ', password: ' new password ', confirmPassword: ' new password ' };
  assert.deepEqual(changePasswordSchema.parse(valid), valid);
  for (const patch of [{ currentPassword: '' }, { currentPassword: valid.password }, { password: 'short', confirmPassword: 'short' }, { confirmPassword: 'different' }, { userId: 'other' }]) {
    assert.equal(changePasswordSchema.safeParse({ ...valid, ...patch }).success, false);
  }
  assert.equal(changePasswordSchema.safeParse({ password: valid.password, confirmPassword: valid.password }).success, false);
});

test('email setup and recovery grants expire and belong to the verified session', () => {
  const now = Date.now(), grant = issuePasswordLinkGrant('session-a', 'test-key', now);
  assert.ok(validPasswordLinkGrant(grant, 'session-a', 'test-key', now));
  assert.equal(validPasswordLinkGrant(grant, 'session-b', 'test-key', now), false);
  assert.equal(validPasswordLinkGrant(grant, 'session-a', 'test-key', now + 600_000), false);
  assert.equal(validPasswordLinkGrant(grant, 'session-a', 'other-key', now), false);
  assert.equal(validPasswordLinkGrant('invalid', 'session-a', 'test-key', now), false);
});
