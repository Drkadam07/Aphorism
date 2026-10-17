import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRelativeTime,
  validateOtp,
  calculateRemainingChars,
  parseQuotesAndAttribution,
  applyOptimisticLike,
  applyOptimisticSave,
  buildThreadSequence,
} from './utils.ts';
import type { PostResponse } from '../types/index.ts';

test('formatRelativeTime returns accurate human-readable format', () => {
  const baseTime = 1760690000000;
  assert.equal(formatRelativeTime(new Date(baseTime - 10000).toISOString(), baseTime), 'just now');
  assert.equal(formatRelativeTime(new Date(baseTime - 180000).toISOString(), baseTime), '3m');
  assert.equal(formatRelativeTime(new Date(baseTime - 7200000).toISOString(), baseTime), '2h');
  assert.equal(formatRelativeTime(new Date(baseTime - 86400000 * 3).toISOString(), baseTime), '3d');
});

test('validateOtp accepts valid 6-digit pin and rejects invalid codes', () => {
  assert.equal(validateOtp('482910'), true);
  assert.equal(validateOtp('000000'), true);
  assert.equal(validateOtp('12345'), false);
  assert.equal(validateOtp('1234567'), false);
  assert.equal(validateOtp('abcdef'), false);
  assert.equal(validateOtp('  482910  '), true);
});

test('calculateRemainingChars calculates accurate limit and percentage', () => {
  const empty = calculateRemainingChars('', 500);
  assert.equal(empty.remaining, 500);
  assert.equal(empty.isOverLimit, false);
  assert.equal(empty.percent, 0);

  const half = calculateRemainingChars('a'.repeat(250), 500);
  assert.equal(half.remaining, 250);
  assert.equal(half.percent, 50);

  const overflow = calculateRemainingChars('a'.repeat(505), 500);
  assert.equal(overflow.remaining, -5);
  assert.equal(overflow.isOverLimit, true);
});

test('parseQuotesAndAttribution parses em-dash correctly', () => {
  const parsed = parseQuotesAndAttribution('Simplicity is prerequisite for reliability. — Edsger Dijkstra');
  assert.equal(parsed.quote, 'Simplicity is prerequisite for reliability.');
  assert.equal(parsed.author, 'Edsger Dijkstra');

  const noAuthor = parseQuotesAndAttribution('Know thyself.');
  assert.equal(noAuthor.quote, 'Know thyself.');
  assert.equal(noAuthor.author, undefined);
});

test('applyOptimisticLike increments or decrements count appropriately', () => {
  const mockPost: PostResponse = {
    id: 104,
    content: 'Test quote',
    created_at: new Date().toISOString(),
    likes_count: 10,
    comments_count: 0,
    is_liked_by_me: false,
    is_saved_by_me: false,
    parent_id: null,
    author: {
      id: 1,
      name: 'Test',
      username: 'test',
      email: 'test@example.com',
      bio: null,
      avatar_url: null,
      is_verified: true,
      created_at: new Date().toISOString(),
    },
    quoted_post: null,
  };

  const likedState = applyOptimisticLike(mockPost);
  assert.equal(likedState.liked, true);
  assert.equal(likedState.updatedPost.is_liked_by_me, true);
  assert.equal(likedState.updatedPost.likes_count, 11);

  const unlikedState = applyOptimisticLike(likedState.updatedPost);
  assert.equal(unlikedState.liked, false);
  assert.equal(unlikedState.updatedPost.is_liked_by_me, false);
  assert.equal(unlikedState.updatedPost.likes_count, 10);
});

test('applyOptimisticSave toggles bookmark status', () => {
  const mockPost: PostResponse = {
    id: 104,
    content: 'Test quote',
    created_at: new Date().toISOString(),
    likes_count: 10,
    comments_count: 0,
    is_liked_by_me: false,
    is_saved_by_me: false,
    parent_id: null,
    author: {
      id: 1,
      name: 'Test',
      username: 'test',
      email: 'test@example.com',
      bio: null,
      avatar_url: null,
      is_verified: true,
      created_at: new Date().toISOString(),
    },
    quoted_post: null,
  };

  const saved = applyOptimisticSave(mockPost);
  assert.equal(saved.saved, true);
  assert.equal(saved.updatedPost.is_saved_by_me, true);

  const unsaved = applyOptimisticSave(saved.updatedPost);
  assert.equal(unsaved.saved, false);
  assert.equal(unsaved.updatedPost.is_saved_by_me, false);
});

test('buildThreadSequence orders root post first, then chronologically', () => {
  const baseDate = new Date('2026-10-17T08:00:00Z').getTime();
  const root: PostResponse = {
    id: 104,
    content: 'Root',
    created_at: new Date(baseDate).toISOString(),
    likes_count: 1,
    comments_count: 2,
    is_liked_by_me: false,
    is_saved_by_me: false,
    parent_id: null,
    author: { id: 1, name: 'A', username: 'a', email: 'a@a.com', bio: null, avatar_url: null, is_verified: true, created_at: '' },
    quoted_post: null,
  };

  const reply2: PostResponse = {
    ...root,
    id: 106,
    content: 'Reply 2',
    created_at: new Date(baseDate + 300000).toISOString(),
    parent_id: 104,
  };

  const reply1: PostResponse = {
    ...root,
    id: 105,
    content: 'Reply 1',
    created_at: new Date(baseDate + 100000).toISOString(),
    parent_id: 104,
  };

  const ordered = buildThreadSequence(104, [reply2, root, reply1]);
  assert.equal(ordered.length, 3);
  assert.equal(ordered[0].id, 104);
  assert.equal(ordered[1].id, 105);
  assert.equal(ordered[2].id, 106);
});
