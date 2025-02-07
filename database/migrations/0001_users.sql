CREATE TABLE IF NOT EXISTS users (
  -- primary artificial key user_id 
  user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- have to validate that this is a valid email
  user_email TEXT NOT NULL,
  user_username VARCHAR(50) NOT NULL,

  -- 255 length to allow for hashing 
  user_hashed_password VARCHAR(255) NOT NULL,

  -- default user has not privilege
  user_role valid_role NOT NULL DEFAULT 'default',

  -- to disable accounts only an admin should be able to do this
  user_account_disabled BOOLEAN DEFAULT 0,

  account_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_email, user_username)
);
