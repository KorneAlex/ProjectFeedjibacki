// https://soledadpenades.com/posts/2015/hashing-passwords-with-bcrypt-and-node-js/
// https://medium.com/hackernoon/the-bcrypt-protocol-is-kind-of-a-mess-4aace5eb31bd

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(plainPassword, storedPassword) {
  if (!storedPassword) {
    return false;
  }
    return bcrypt.compare(plainPassword, storedPassword);
}
