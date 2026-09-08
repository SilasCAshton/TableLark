CREATE TYPE poll_status AS ENUM (
  'open',
  'awaiting_organizer',
  'final',
  'no_votes'
);

CREATE TYPE poll_tie_mode AS ENUM (
  'random',
  'organizer'
);

CREATE TYPE poll_close_reason AS ENUM (
  'deadline',
  'maximum',
  'manual'
);

CREATE TABLE polls (
  id UUID PRIMARY KEY,
  public_slug VARCHAR(32) NOT NULL UNIQUE,
  owner_token_hash CHAR(64) NOT NULL,
  status poll_status NOT NULL DEFAULT 'open',
  deadline_at TIMESTAMPTZ NOT NULL,
  maximum_ballots SMALLINT NOT NULL,
  tie_mode poll_tie_mode NOT NULL,
  winner_option_id UUID,
  close_reason poll_close_reason,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  CONSTRAINT polls_maximum_ballots_check
    CHECK (maximum_ballots BETWEEN 2 AND 20),
  CONSTRAINT polls_closed_state_check CHECK (
    (status = 'open' AND closed_at IS NULL AND close_reason IS NULL)
    OR
    (status <> 'open' AND closed_at IS NOT NULL AND close_reason IS NOT NULL)
  ),
  CONSTRAINT polls_winner_state_check CHECK (
    (status = 'final' AND winner_option_id IS NOT NULL)
    OR
    (status <> 'final' AND winner_option_id IS NULL)
  )
);

CREATE INDEX polls_open_deadline_idx
  ON polls (deadline_at)
  WHERE status = 'open';

CREATE TABLE poll_options (
  id UUID PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  google_place_id VARCHAR(255) NOT NULL,
  display_order SMALLINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(500) NOT NULL,
  google_maps_url VARCHAR(2048),
  CONSTRAINT poll_options_poll_place_unique
    UNIQUE (poll_id, google_place_id),
  CONSTRAINT poll_options_poll_order_unique
    UNIQUE (poll_id, display_order),
  CONSTRAINT poll_options_id_poll_unique
    UNIQUE (id, poll_id),
  CONSTRAINT poll_options_display_order_check
    CHECK (display_order >= 0)
);

ALTER TABLE polls
  ADD CONSTRAINT polls_winner_option_fk
  FOREIGN KEY (winner_option_id, id)
  REFERENCES poll_options(id, poll_id);

CREATE TABLE ballots (
  id UUID PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voter_token_hash CHAR(64) NOT NULL,
  optional_name VARCHAR(80),
  is_organizer_ballot BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ballots_poll_voter_unique
    UNIQUE (poll_id, voter_token_hash),
  CONSTRAINT ballots_id_poll_unique
    UNIQUE (id, poll_id)
);

CREATE UNIQUE INDEX ballots_one_organizer_idx
  ON ballots (poll_id)
  WHERE is_organizer_ballot;

CREATE INDEX ballots_poll_idx ON ballots (poll_id);

CREATE TABLE ballot_ranks (
  poll_id UUID NOT NULL,
  ballot_id UUID NOT NULL,
  option_id UUID NOT NULL,
  rank SMALLINT NOT NULL,
  PRIMARY KEY (ballot_id, rank),
  CONSTRAINT ballot_ranks_ballot_option_unique
    UNIQUE (ballot_id, option_id),
  CONSTRAINT ballot_ranks_rank_check
    CHECK (rank BETWEEN 1 AND 3),
  CONSTRAINT ballot_ranks_ballot_fk
    FOREIGN KEY (ballot_id, poll_id)
    REFERENCES ballots(id, poll_id)
    ON DELETE CASCADE,
  CONSTRAINT ballot_ranks_option_fk
    FOREIGN KEY (option_id, poll_id)
    REFERENCES poll_options(id, poll_id)
    ON DELETE CASCADE
);

CREATE INDEX ballot_ranks_poll_idx ON ballot_ranks (poll_id);

CREATE TABLE poll_tie_candidates (
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (poll_id, option_id),
  CONSTRAINT poll_tie_candidates_option_fk
    FOREIGN KEY (option_id, poll_id)
    REFERENCES poll_options(id, poll_id)
    ON DELETE CASCADE
);
