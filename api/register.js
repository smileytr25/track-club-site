import express from "express";
import { pool } from "../db.js";
import { sendRegistrationConfirmation } from "../email/sendConfirmation.js";

const router = express.Router();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validPaymentStatuses = ["unpaid", "pending", "paid", "waived"];
const registrationFeeCents = Number.parseInt(process.env.REGISTRATION_FEE_CENTS || "5000", 10);
let registrationSchemaReady;
const stateNameToCode = new Map(Object.entries({
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY"
}));

async function ensureRegistrationSchema() {
  if (!registrationSchemaReady) {
    registrationSchemaReady = pool.query(`
      ALTER TABLE public.registrations
      ADD COLUMN IF NOT EXISTS registration_fee_cents integer DEFAULT 5000 NOT NULL;

      ALTER TABLE public.registrations
      ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' NOT NULL;

      ALTER TABLE public.registrations
      ADD COLUMN IF NOT EXISTS payment_provider text;

      ALTER TABLE public.registrations
      ADD COLUMN IF NOT EXISTS payment_reference text;

      ALTER TABLE public.registrations
      ADD COLUMN IF NOT EXISTS paid_at timestamp without time zone;

      ALTER TABLE public.registrations
      ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

      ALTER TABLE public.registrations
      DROP CONSTRAINT IF EXISTS registrations_payment_status_check;

      ALTER TABLE public.registrations
      ADD CONSTRAINT registrations_payment_status_check
      CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'pending'::text, 'paid'::text, 'waived'::text])));

      CREATE INDEX IF NOT EXISTS idx_registrations_payment_status
      ON public.registrations USING btree (payment_status);
    `).catch(error => {
      registrationSchemaReady = null;
      throw error;
    });
  }

  return registrationSchemaReady;
}

function normalizeRegistration(row) {
  const dateOfBirth = row.date_of_birth instanceof Date
    ? row.date_of_birth.toISOString().slice(0, 10)
    : row.date_of_birth;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    dateOfBirth,
    gender: row.gender,
    schoolDistrict: row.school_district,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    guardianName: row.guardian_name,
    email: row.email,
    phone: row.phone,
    program: row.program,
    interests: {
      sprints: row.interest_sprints,
      distance: row.interest_distance,
      relays: row.interest_relays,
      jumps: row.interest_jumps,
      throws: row.interest_throws
    },
    allergies: row.allergies,
    registrationFeeCents: row.registration_fee_cents,
    paymentStatus: row.payment_status,
    paymentProvider: row.payment_provider,
    paymentReference: row.payment_reference,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const registrationFields = `
  id, first_name, last_name, date_of_birth, gender, school_district,
  address_line1, address_line2, city, state, postal_code, guardian_name,
  email, phone, confirmed, confirmation_sent_at, created_at, interest_sprints,
  interest_distance, interest_relays, interest_jumps, interest_throws,
  allergies, program, registration_fee_cents, payment_status,
  payment_provider, payment_reference, paid_at, updated_at
`;

function getPublicBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
}

function normalizeState(value) {
  const trimmed = String(value || "").trim();
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  return stateNameToCode.get(trimmed.toLowerCase()) || "";
}

router.post("/", async (req, res) => {
  try {
    await ensureRegistrationSchema();

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
      !address_line1 ||
      !city ||
      !state ||
      !postal_code ||
      !program ||
      !school_district
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedState = normalizeState(state);
    if (!normalizedState) {
      return res.status(400).json({ error: "Please enter a valid two-letter state code." });
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
        allergies,
        registration_fee_cents,
        payment_status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22
      )
      RETURNING id
      `,
      [
        first_name,
        last_name,
        gender || "Prefer not to say",
        date_of_birth,
        guardian_name,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        normalizedState,
        postal_code,
        program,
        school_district,
        interest_sprints,
        interest_distance,
        interest_relays,
        interest_jumps,
        interest_throws,
        allergies,
        registrationFeeCents,
        "unpaid"
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
      registration_id: registrationId,
      registration_fee_cents: registrationFeeCents,
      payment_status: "unpaid"
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/checkout", async (req, res) => {
  const { id } = req.params;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid registration id." });
  }

  try {
    await ensureRegistrationSchema();
    const registration = await pool.query(
      `
      SELECT id, first_name, last_name, email, registration_fee_cents, payment_status
      FROM public.registrations
      WHERE id = $1
      `,
      [id]
    );

    if (registration.rowCount === 0) {
      return res.status(404).json({ error: "Registration not found." });
    }

    const row = registration.rows[0];

    if (row.payment_status === "paid" || row.payment_status === "waived") {
      return res.json({ paid: true, paymentStatus: row.payment_status });
    }

    const baseUrl = getPublicBaseUrl(req);
    const successUrl = `${baseUrl}/public-site/html-source/register.html?registration_id=${encodeURIComponent(id)}&payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/public-site/html-source/register.html?registration_id=${encodeURIComponent(id)}&payment=cancelled`;

    if (!process.env.STRIPE_SECRET_KEY) {
      await pool.query(
        `
        UPDATE public.registrations
        SET payment_status = 'pending',
            payment_provider = 'offline',
            updated_at = now()
        WHERE id = $1
        `,
        [id]
      );

      return res.status(202).json({
        paymentStatus: "pending",
        message: "Online checkout is not configured yet. The registration is saved as pay later."
      });
    }

    const body = new URLSearchParams({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: row.email,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": process.env.REGISTRATION_FEE_CURRENCY || "usd",
      "line_items[0][price_data][unit_amount]": String(row.registration_fee_cents),
      "line_items[0][price_data][product_data][name]": "Genesee Swift Registration Fee",
      "metadata[registration_id]": id
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe checkout error:", stripeData);
      return res.status(502).json({ error: "Unable to start registration fee checkout." });
    }

    await pool.query(
      `
      UPDATE public.registrations
      SET payment_status = 'pending',
          payment_provider = 'stripe',
          payment_reference = $2,
          updated_at = now()
      WHERE id = $1
      `,
      [id, stripeData.id]
    );

    res.json({ checkoutUrl: stripeData.url, paymentStatus: "pending" });
  } catch (error) {
    console.error("Registration checkout error:", error);
    res.status(500).json({ error: "Unable to start registration fee checkout." });
  }
});

router.post("/:id/payment/verify", async (req, res) => {
  const { id } = req.params;
  const { sessionId } = req.body;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid registration id." });
  }

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ error: "Payment verification is not configured." });
  }

  try {
    await ensureRegistrationSchema();
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
      }
    });
    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return res.status(502).json({ error: "Unable to verify payment." });
    }

    if (stripeData.metadata?.registration_id !== id) {
      return res.status(400).json({ error: "Payment does not match this registration." });
    }

    const isPaid = stripeData.payment_status === "paid" || stripeData.status === "complete";

    const result = await pool.query(
      `
      UPDATE public.registrations
      SET payment_status = $1,
          payment_provider = 'stripe',
          payment_reference = $2,
          paid_at = CASE WHEN $1 = 'paid' THEN COALESCE(paid_at, now()) ELSE paid_at END,
          updated_at = now()
      WHERE id = $3
      RETURNING ${registrationFields}
      `,
      [isPaid ? "paid" : "pending", sessionId, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Registration not found." });
    }

    res.json({ registration: normalizeRegistration(result.rows[0]) });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Unable to verify payment." });
  }
});

router.get("/cms", async (_req, res) => {
  try {
    await ensureRegistrationSchema();
    const result = await pool.query(
      `
      SELECT ${registrationFields}
      FROM public.registrations
      ORDER BY created_at DESC
      `
    );

    res.json({ registrations: result.rows.map(normalizeRegistration) });
  } catch (error) {
    console.error("CMS registrations error:", error);
    res.status(500).json({ error: "Unable to load registrations." });
  }
});

router.get("/cms/report", async (_req, res) => {
  try {
    await ensureRegistrationSchema();
    const result = await pool.query(
      `
      SELECT ${registrationFields}
      FROM public.registrations
      ORDER BY program ASC, last_name ASC, first_name ASC
      `
    );

    res.json({
      generatedAt: new Date().toISOString(),
      registrations: result.rows.map(normalizeRegistration)
    });
  } catch (error) {
    console.error("CMS registrations report error:", error);
    res.status(500).json({ error: "Unable to generate report." });
  }
});

router.get("/cms/:id", async (req, res) => {
  const { id } = req.params;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid registration id." });
  }

  try {
    await ensureRegistrationSchema();
    const result = await pool.query(
      `
      SELECT ${registrationFields}
      FROM public.registrations
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Registration not found." });
    }

    res.json({ registration: normalizeRegistration(result.rows[0]) });
  } catch (error) {
    console.error("CMS registration detail error:", error);
    res.status(500).json({ error: "Unable to load registration." });
  }
});

router.put("/cms/:id", async (req, res) => {
  const { id } = req.params;
  const {
    program,
    schoolDistrict,
    interestSprints = false,
    interestDistance = false,
    interestRelays = false,
    interestJumps = false,
    interestThrows = false,
    allergies,
    paymentStatus,
    paymentReference
  } = req.body;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid registration id." });
  }

  if (!program?.trim() || !schoolDistrict?.trim()) {
    return res.status(400).json({ error: "Program and school district are required." });
  }

  if (!validPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({ error: "Invalid payment status." });
  }

  try {
    await ensureRegistrationSchema();
    const result = await pool.query(
      `
      UPDATE public.registrations
      SET program = $1,
          school_district = $2,
          interest_sprints = $3,
          interest_distance = $4,
          interest_relays = $5,
          interest_jumps = $6,
          interest_throws = $7,
          allergies = $8,
          payment_status = $9,
          payment_provider = CASE
            WHEN $9 IN ('paid', 'waived') AND payment_provider IS NULL THEN 'cms'
            ELSE payment_provider
          END,
          payment_reference = NULLIF($10, ''),
          paid_at = CASE
            WHEN $9 IN ('paid', 'waived') THEN COALESCE(paid_at, now())
            WHEN $9 IN ('unpaid', 'pending') THEN NULL
            ELSE paid_at
          END,
          updated_at = now()
      WHERE id = $11
      RETURNING ${registrationFields}
      `,
      [
        program.trim(),
        schoolDistrict.trim(),
        interestSprints,
        interestDistance,
        interestRelays,
        interestJumps,
        interestThrows,
        allergies?.trim() || null,
        paymentStatus,
        paymentReference?.trim() || "",
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Registration not found." });
    }

    res.json({ registration: normalizeRegistration(result.rows[0]) });
  } catch (error) {
    console.error("Update CMS registration error:", error);
    res.status(500).json({ error: "Unable to update registration." });
  }
});

router.delete("/cms/:id", async (req, res) => {
  const { id } = req.params;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid registration id." });
  }

  try {
    await ensureRegistrationSchema();
    const result = await pool.query(
      `
      DELETE FROM public.registrations
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Registration not found." });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error("Delete CMS registration error:", error);
    res.status(500).json({ error: "Unable to delete registration." });
  }
});

export default router;
