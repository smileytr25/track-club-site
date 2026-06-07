--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cms_auth; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_auth (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    display_name text,
    role text DEFAULT 'admin'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT cms_auth_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text])))
);


--
-- Name: cms_auth cms_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_auth
    ADD CONSTRAINT cms_auth_pkey PRIMARY KEY (id);


--
-- Name: idx_cms_auth_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_auth_active ON public.cms_auth USING btree (active);


--
-- Name: idx_cms_auth_username_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_cms_auth_username_unique ON public.cms_auth USING btree (lower(username));


--
-- Name: cms_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    event_date date NOT NULL,
    event_time time without time zone,
    location text NOT NULL,
    description text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT cms_events_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: cms_events cms_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_events
    ADD CONSTRAINT cms_events_pkey PRIMARY KEY (id);


--
-- Name: idx_cms_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_events_date ON public.cms_events USING btree (event_date);


--
-- Name: idx_cms_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_events_status ON public.cms_events USING btree (status);

--
-- Name: cms_gallery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_gallery (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file text,
    image_url text,
    caption text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT cms_gallery_image_source_check CHECK ((((file IS NOT NULL) AND (length(TRIM(BOTH FROM file)) > 0)) OR ((image_url IS NOT NULL) AND (length(TRIM(BOTH FROM image_url)) > 0)))),
    CONSTRAINT cms_gallery_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: cms_gallery cms_gallery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_gallery
    ADD CONSTRAINT cms_gallery_pkey PRIMARY KEY (id);


--
-- Name: idx_cms_gallery_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_gallery_sort_order ON public.cms_gallery USING btree (sort_order);


--
-- Name: idx_cms_gallery_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_gallery_status ON public.cms_gallery USING btree (status);


--
-- Name: cms_site_copy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_site_copy (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_path text NOT NULL,
    selector text NOT NULL,
    text_content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: cms_site_copy cms_site_copy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_site_copy
    ADD CONSTRAINT cms_site_copy_pkey PRIMARY KEY (id);


--
-- Name: idx_cms_site_copy_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_site_copy_page ON public.cms_site_copy USING btree (page_path);


--
-- Name: idx_cms_site_copy_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_cms_site_copy_unique ON public.cms_site_copy USING btree (page_path, selector);


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth date NOT NULL,
    gender text NOT NULL,
    school_district text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state character(2) NOT NULL,
    postal_code text NOT NULL,
    guardian_name text NOT NULL,
    email text NOT NULL,
    phone text,
    confirmed boolean DEFAULT false,
    confirmation_sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    interest_sprints boolean DEFAULT false,
    interest_distance boolean DEFAULT false,
    interest_relays boolean DEFAULT false,
    interest_jumps boolean DEFAULT false,
    interest_throws boolean DEFAULT false,
    allergies text,
    program text NOT NULL,
    registration_fee_cents integer DEFAULT 5000 NOT NULL,
    payment_status text DEFAULT 'unpaid'::text NOT NULL,
    payment_provider text,
    payment_reference text,
    paid_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT registrations_payment_status_check CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'pending'::text, 'paid'::text, 'waived'::text])))
);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


--
-- Name: idx_registrations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_created_at ON public.registrations USING btree (created_at);


--
-- Name: idx_registrations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_email ON public.registrations USING btree (email);


--
-- Name: idx_registrations_program; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_program ON public.registrations USING btree (program);


--
-- Name: idx_registrations_payment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_payment_status ON public.registrations USING btree (payment_status);


--
-- PostgreSQL database dump complete
--
