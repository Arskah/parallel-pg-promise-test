CREATE TYPE payment_session_status_t AS ENUM('STARTED', 'PENDING', 'FINISHED', 'ERROR');

CREATE TABLE payment_session (
    order_id VARCHAR PRIMARY KEY,
    status payment_session_status_t NOT NULL
);
