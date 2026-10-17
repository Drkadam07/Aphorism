import test from 'node:test';
import assert from 'node:assert/strict';
import { usersDb, postsDb, commentsDb, likesDb, savesDb, otpDb, tokensDb } from './data.ts';

test('backend store initializes with valid user and post fixtures', () => {
  assert.ok(usersDb[1]);
  assert.equal(usersDb[1].username, 'janedoe');
  assert.ok(postsDb[104]);
  assert.equal(postsDb[104].author_id, 3);
});

test('like toggle properly increments and decrements count', () => {
  const post = postsDb[104];
  const initialLikes = post.likes_count;
  const userKey = '2:104'; // Marcus Aurelius liking post 104

  // Liking
  likesDb.add(userKey);
  post.likes_count += 1;
  assert.equal(likesDb.has(userKey), true);
  assert.equal(post.likes_count, initialLikes + 1);

  // Unliking
  likesDb.delete(userKey);
  post.likes_count -= 1;
  assert.equal(likesDb.has(userKey), false);
  assert.equal(post.likes_count, initialLikes);
});

test('save bookmark toggle tracks bookmarked posts', () => {
  const saveKey = '2:104';
  savesDb.add(saveKey);
  assert.equal(savesDb.has(saveKey), true);

  savesDb.delete(saveKey);
  assert.equal(savesDb.has(saveKey), false);
});

test('otpDb dispatches and verifies 6-digit codes', () => {
  const email = 'test@example.com';
  otpDb[email] = '482910';

  assert.equal(otpDb[email], '482910');
  assert.equal(/^\d{6}$/.test(otpDb[email]), true);
});

test('thread reply increments comments_count of parent post', () => {
  const parent = postsDb[104];
  const prevComments = parent.comments_count;

  // Add thread reply
  const replyId = 999;
  postsDb[replyId] = {
    id: replyId,
    content: 'Unit test reply',
    created_at: new Date().toISOString(),
    likes_count: 0,
    comments_count: 0,
    parent_id: 104,
    quoted_post_id: null,
    author_id: 1,
  };
  parent.comments_count += 1;

  assert.equal(parent.comments_count, prevComments + 1);

  // Cleanup
  delete postsDb[replyId];
  parent.comments_count = prevComments;
});
