-- Only a new, unregistered target may create this schema. No IF NOT EXISTS/adoption.
CREATE SCHEMA deployment_control;
REVOKE ALL ON SCHEMA deployment_control FROM PUBLIC;
CREATE TABLE deployment_control.installations (
 singleton boolean PRIMARY KEY CHECK(singleton),
 installation_id uuid NOT NULL UNIQUE,
 format integer NOT NULL CHECK(format=2),
 source_sha character(40) NOT NULL CHECK(source_sha ~ '^[a-f0-9]{40}$'),
 tree_sha character(40) NOT NULL CHECK(tree_sha ~ '^[a-f0-9]{40}$'),
 package_sha256 character(64) NOT NULL CHECK(package_sha256 ~ '^[a-f0-9]{64}$'),
 ledger_sha256 character(64) NOT NULL CHECK(ledger_sha256 ~ '^[a-f0-9]{64}$')
);
REVOKE ALL ON deployment_control.installations FROM PUBLIC;
