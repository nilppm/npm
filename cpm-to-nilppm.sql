alter table maintainer ADD utime datetime NOT NULL;
CREATE INDEX idx_account ON user (account);
alter table version ADD mtime datetime NOT NULL;
CREATE INDEX idx_rev ON version (rev);
CREATE UNIQUE INDEX uq_pid_name ON version (`pid`, `name`);