-- Test data for go-vibe-friend
-- This script is executed before running tests to ensure a clean and predictable database state.

-- Insert a default admin user
-- Username: admin@demo.dev, Password: Pa$$
INSERT INTO users (id, username, email, password, status, created_at, updated_at)
VALUES (1, 'admin@demo.dev', 'admin@demo.dev', '$2a$10$wr49Rt8KFlPv4wcNMuNiRujp58LaIKuou/Wq39sjjkIFK5rS3SUvC', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    updated_at = NOW();

-- Insert a standard user for other tests
-- Username: user@demo.dev, Password: password
INSERT INTO users (id, username, email, password, status, created_at, updated_at)
VALUES (2, 'user@demo.dev', 'user@demo.dev', '$2a$10$gE.8OM8254fC9iB/aJd2le3F53p2i3d2U/S.2s.S.2s.S.2s.S', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    updated_at = NOW();

-- Ensure default roles exist
INSERT INTO roles (id, name, description) VALUES (1, 'admin', 'Administrator role') ON CONFLICT (id) DO NOTHING;
INSERT INTO roles (id, name, description) VALUES (2, 'user', 'Standard user role') ON CONFLICT (id) DO NOTHING;

-- Associate the admin user with the admin role
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1) ON CONFLICT DO NOTHING;
-- Associate the standard user with the user role
INSERT INTO user_roles (user_id, role_id) VALUES (2, 2) ON CONFLICT DO NOTHING;

-- Add a profile for the admin user
INSERT INTO profiles (user_id, display_name, bio) VALUES (1, 'Admin Demo', 'This is the bio for the admin user.')
ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio;