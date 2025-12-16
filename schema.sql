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
    program text NOT NULL
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
-- PostgreSQL database dump complete
--

