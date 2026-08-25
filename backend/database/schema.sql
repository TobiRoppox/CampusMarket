-- Table: events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT
);

-- Table: stalls
CREATE TABLE stalls (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    position VARCHAR(10) NOT NULL,
    size INT NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Available', 'Occupied', 'Reserved')) NOT NULL
);

-- Table: seller_applications
CREATE TABLE seller_applications (
    id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    stall_id INT REFERENCES stalls(id),
    status VARCHAR(50) CHECK (status IN ('Pending', 'Approved', 'Rejected')) NOT NULL
);