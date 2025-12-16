import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  host: "ep-mute-field-advwz1yu-pooler.c-2.us-east-1.aws.neon.tech",
  user: "neondb_owner",
  password: "npg_b78xyjePFhCL",
  database: "neondb",
  port: 5432,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});