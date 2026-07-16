from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:password@localhost:5432/virtual_workbench')

with engine.connect() as conn:
    # Check existing columns
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = 'workspaces' ORDER BY ordinal_position"
    ))
    cols = [r[0] for r in result]
    print('Existing columns:', cols)

    # Add missing columns if they do not exist
    if 'assigned_to' not in cols:
        print('Adding assigned_to column...')
        conn.execute(text(
            "ALTER TABLE workspaces ADD COLUMN assigned_to UUID REFERENCES users(id)"
        ))
        print('  -> assigned_to added.')

    if 'selected_tools' not in cols:
        print('Adding selected_tools column...')
        conn.execute(text(
            "ALTER TABLE workspaces ADD COLUMN selected_tools TEXT[]"
        ))
        print('  -> selected_tools added.')

    if 'workspace_url' not in cols:
        print('Adding workspace_url column...')
        conn.execute(text(
            "ALTER TABLE workspaces ADD COLUMN workspace_url VARCHAR(255)"
        ))
        print('  -> workspace_url added.')

    conn.commit()
    print('Migration complete.')
