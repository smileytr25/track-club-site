import express from "express";
import { pool } from "../db.js";
import { sendRegistrationConfirmation } from "../email/sendConfirmation.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      guardian_name,
      email,
      phone,
      gender,

      address_line1,
      address_line2,
      city,
      state,
      postal_code,

      school_district,
      program,

      interest_sprints = false,
      interest_distance = false,
      interest_relays = false,
      interest_jumps = false,
      interest_throws = false,

      allergies
    } = req.body;

    // Basic validation
    if (
      !first_name ||
      !last_name ||
      !date_of_birth ||
      !guardian_name ||
      !email ||
      !gender ||
      !address_line1 ||
      !city ||
      !state ||
      !postal_code ||
      !program ||
      !school_district
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `
      INSERT INTO registrations (
        first_name,
        last_name,
        gender,
        date_of_birth,
        guardian_name,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        program,
        school_district,
        interest_sprints,
        interest_distance,
        interest_relays,
        interest_jumps,
        interest_throws,
        allergies
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,$19,$20
      )
      RETURNING id
      `,
      [
        first_name,
        last_name,
        gender,
        date_of_birth,
        guardian_name,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        program,
        school_district,
        interest_sprints,
        interest_distance,
        interest_relays,
        interest_jumps,
        interest_throws,
        allergies
      ]
    );

    const registrationId = result.rows[0].id;

    // 🔔 Send confirmation email (non-blocking)
    sendRegistrationConfirmation({
      email,
      first_name,
      program
    })
    .then((data) => {
      console.log("Successfully sent email:", data);
    })
    .catch((err) => {
      console.error(
        `Confirmation email failed for registration ${registrationId}:`,
        err
      );
    });
    res.status(201).json({
      success: true,
      registration_id: registrationId
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
