-- Migration: Add phone_number to chat_sessions
ALTER TABLE chat_sessions ADD COLUMN phone_number VARCHAR(20);
