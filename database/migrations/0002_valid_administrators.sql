-- this table is to not allow someone to create an administrator account 
-- an administrator cannot login without having their user_id in this table

CREATE TABLE IF NOT EXISTS valid_admin (
  valid_admin_table_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id INTEGER UNIQUE NOT NULL,
  admin_role_granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
